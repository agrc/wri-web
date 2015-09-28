require([
    'agrc-jasmine-matchers/topics',

    'app/config',
    'app/project/NewFeatureWizard',

    'dojo/dom-class',
    'dojo/dom-construct'
], function (
    topics,

    config,
    WidgetUnderTest,

    domClass,
    domConstruct
) {
    describe('app/project/NewFeatureWizard', function () {
        var widget;
        var destroy = function (widget) {
            widget.destroyRecursive();
            widget = null;
        };

        beforeEach(function () {
            widget = new WidgetUnderTest(null, domConstruct.create('div', null, document.body));
            widget.startup();
        });

        afterEach(function () {
            if (widget) {
                destroy(widget);
            }
        });

        describe('Sanity', function () {
            it('should create a NewFeatureWizard', function () {
                expect(widget).toEqual(jasmine.any(WidgetUnderTest));
            });
            it('should build the feature types select options', function () {
                expect(widget.featureCategorySelect.children.length)
                    .toBe(config.domains.featureType.length + 1);
            });
        });
        describe('onFeatureCategoryChange', function () {
            var atts = config.domains.featureAttributes;
            var testType = 'Test Type';
            beforeEach(function () {
                domConstruct.create('option', {
                    innerHTML: testType,
                    value: testType
                }, widget.featureCategorySelect);
                widget.featureCategorySelect.value = testType;
            });
            it('polys - populates the action', function () {
                atts[testType] = {
                    'Aerator': [
                        'blah',
                        'blah2',
                        'blah3'
                    ],
                    'Anchor chain': [
                        'blah4'
                    ]
                };

                widget.onFeatureCategoryChange();

                expect(widget.polyActionSelect.children.length).toBe(3);
                expect(domClass.contains(widget.polyActionSelect.parentElement, 'hidden')).toBe(false);
                expect(domClass.contains(widget.treatmentSelect.parentElement, 'hidden')).toBe(false);
            });
            it('points/lines - populates the sub-type & action', function () {
                atts[testType] = [
                    'blah',
                    'blah2',
                    'blah3'
                ];

                widget.onFeatureCategoryChange();

                expect(widget.typeSelect.children.length).toBe(4);
                expect(widget.pointLineActionSelect.children.length).toBe(6);
                expect(domClass.contains(widget.pointLineActionSelect.parentElement, 'hidden')).toBe(false);
                expect(domClass.contains(widget.typeSelect.parentElement, 'hidden')).toBe(false);
            });
            it('points/lines - hides the type if there are none', function () {
                atts[testType] = [];

                widget.onFeatureCategoryChange();

                expect(widget.pointLineActionSelect.children.length).toBe(6);
                expect(domClass.contains(widget.pointLineActionSelect.parentElement, 'hidden')).toBe(false);
                expect(domClass.contains(widget.typeSelect.parentElement, 'hidden')).toBe(true);
            });
            it('shows the comments box on other point', function () {
                widget.featureCategorySelect.value = config.commentsFieldCategories[0];
                expect(domClass.contains(widget.comments, 'hidden')).toBe(true);

                widget.onFeatureCategoryChange();

                expect(domClass.contains(widget.comments, 'hidden')).toBe(false);
            });
            it('shows the retreatment box', function () {
                widget.featureCategorySelect.value = config.retreatmentCategories[0];
                expect(domClass.contains(widget.retreatment, 'hidden')).toBe(true);

                widget.onFeatureCategoryChange();

                expect(domClass.contains(widget.retreatment, 'hidden')).toBe(false);
            });
        });
        describe('onPolyActionSelectChange', function () {
            it('populates the treatment select', function () {
                var atts = config.domains.featureAttributes;
                atts['Test Category'] = {
                    'Test Action': ['Test Treatment1', 'Test Treatment2']
                };
                domConstruct.create('option', {
                    innerHTML: 'Test Category',
                    value: 'Test Category'
                }, widget.featureCategorySelect);
                widget.featureCategorySelect.value = 'Test Category';
                domConstruct.create('option', {
                    innerHTML: 'Test Action',
                    value: 'Test Action'
                }, widget.polyActionSelect);
                widget.polyActionSelect.value = 'Test Action';

                widget.onPolyActionSelectChange();

                expect(widget.treatmentSelect.children.length).toBe(3);
            });
        });
        describe('resetFeatureAttributes', function () {
            it('resets all of the selects', function () {
                var selects = [
                    widget.polyActionSelect,
                    widget.treatmentSelect,
                    widget.typeSelect,
                    widget.pointLineActionSelect
                ];

                selects.forEach(function (s) {
                    domConstruct.create('option', {}, s);
                    domClass.remove(s.parentElement, 'hidden');
                });

                widget.resetFeatureAttributes();

                selects.forEach(function (s) {
                    expect(s.children.length).toBe(1);
                    expect(domClass.contains(s.parentElement, 'hidden')).toBe(true);
                });
            });
        });
        describe('getServiceErrorMessage', function () {
            it('returns generic message if no error object with messages or details', function () {
                var expected = 'Error uploading shapefile';
                var actual = widget.getServiceErrorMessage();

                expect(actual).toBe(expected);

                actual = widget.getServiceErrorMessage({});

                expect(actual).toBe(expected);
            });
            it('returns message if no details are provided', function () {
                var expected = 'Error uploading shapefile: "Unable to complete operation."';
                var actual = widget.getServiceErrorMessage({
                    message: 'Unable to complete operation.'
                });

                expect(actual).toBe(expected);
            });
            it('returns the exception text from details if present', function () {
                var expected = 'Error uploading shapefile: "Missing .prj file"';
                var actual = widget.getServiceErrorMessage({
                    message: 'blah',
                    details: ['Error executing tool. ZipToGraphics Job ID: j3433273e638c470bb2861cecf6b7d2c8 : Traceback (most recent call last): File "C:\arcgisserver\directories\arcgissystem\arcgisinput\WRI\Toolbox.GPServer\extracted\v101\ziptographics\zipToGraphics.py", line 78, in <module> result = main(arcpy.GetParameterAsText(0)) File "C:\arcgisserver\directories\arcgissystem\arcgisinput\WRI\Toolbox.GPServer\extracted\v101\ziptographics\zipToGraphics.py", line 45, in main raise Exception(\'Missing .{} file\'.format(ext)) Exception: Missing .prj file\n Failed to execute (ZipToGraphics). Failed to execute (ZipToGraphics).']
                });

                expect(actual).toBe(expected);
            });
        });
        describe('validateForm', function () {
            it('disables save button', function () {
                var atts = config.domains.featureAttributes;
                atts['Test Category'] = {
                    'Test Action': ['Test Treatment1', 'Test Treatment2']
                };
                domConstruct.create('option', {
                    innerHTML: 'Test Category',
                    value: 'Test Category'
                }, widget.featureCategorySelect);
                widget.featureCategorySelect.value = 'Test Category';
                widget.onFeatureCategoryChange();

                widget.graphicsLayer.graphics = [{}];

                // existing stored actions
                widget.actions = [{}];
                widget.validateForm();
                expect(widget.saveBtn.disabled).toBe(false);

                // partially filled out action
                domConstruct.create('option', {
                    innerHTML: 'Test Action',
                    value: 'Test Action'
                }, widget.polyActionSelect);
                widget.polyActionSelect.value = 'Test Action';
                widget.onPolyActionSelectChange();
                widget.validateForm();
                expect(widget.saveBtn.disabled).toBe(true);

                // existing stored actions and fully filled out action
                widget.treatmentSelect.value = 'Test Treatment1';
                widget.validateForm();
                expect(widget.saveBtn.disabled).toBe(false);
            });
        });
        describe('onAddActionClick', function () {
            it('prevents duplicate actions', function () {
                topics.listen(config.topics.toast);

                // add first action
                var atts = config.domains.featureAttributes;
                atts['Test Category'] = {
                    'Test Action': ['Test Treatment1', 'Test Treatment2']
                };
                domConstruct.create('option', {
                    innerHTML: 'Test Category',
                    value: 'Test Category'
                }, widget.featureCategorySelect);
                widget.featureCategorySelect.value = 'Test Category';
                widget.onFeatureCategoryChange();
                widget.graphicsLayer.graphics = [{}];
                domConstruct.create('option', {
                    innerHTML: 'Test Action',
                    value: 'Test Action'
                }, widget.polyActionSelect);
                widget.polyActionSelect.value = 'Test Action';
                widget.onPolyActionSelectChange();
                widget.treatmentSelect.value = 'Test Treatment1';

                widget.onAddActionClick();

                expect(widget.actions.length).toBe(1);

                // restore controls to the same values
                widget.polyActionSelect.value = 'Test Action';
                widget.onPolyActionSelectChange();
                widget.treatmentSelect.value = 'Test Treatment1';

                widget.onAddActionClick();

                expect(config.topics.toast).toHaveBeenPublishedWith(widget.duplicateActionMsg, 'warning');
            });
        });
    });
});
