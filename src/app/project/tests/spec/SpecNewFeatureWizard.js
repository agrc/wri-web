require([
    'agrc-jasmine-matchers/topics',

    'app/config',
    'app/project/Action',
    'app/project/NewFeatureWizard',

    'dojo/Deferred',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/text!app/tests/data/esri_geometries.json',

    'esri/geometry/Point',

    'stubmodule'
], function (
    topics,

    config,
    Action,
    WidgetUnderTest,

    Deferred,
    domClass,
    domConstruct,
    esriGeometries,

    Point,

    stubModule
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
                widget.featureCategorySelect.value = config.terrestrialAquaticCategories[0];
                expect(domClass.contains(widget.retreatment, 'hidden')).toBe(true);

                widget.onFeatureCategoryChange();

                expect(domClass.contains(widget.retreatment, 'hidden')).toBe(false);
            });
            it('only shows the add additional action button for terrestrial and acquatic', function () {
                expect(domClass.contains(widget.addActionBtn, 'hidden')).toBe(false);

                widget.featureCategorySelect.value = config.commentsFieldCategories[0];
                widget.onFeatureCategoryChange();

                expect(domClass.contains(widget.addActionBtn, 'hidden')).toBe(true);
            });
            it('hides action and type if there are no available values', function () {
                atts[testType] = undefined;
                domClass.remove(widget.pointLineActionSelect.parentElement, 'hidden');
                domClass.remove(widget.treatmentSelect.parentElement, 'hidden');
                domClass.remove(widget.herbicideSelect.parentElement, 'hidden');
                domClass.remove(widget.typeSelect.parentElement, 'hidden');

                widget.onFeatureCategoryChange();

                expect(domClass.contains(widget.pointLineActionSelect.parentElement, 'hidden')).toBe(true);
                expect(domClass.contains(widget.treatmentSelect.parentElement, 'hidden')).toBe(true);
                expect(domClass.contains(widget.herbicideSelect.parentElement, 'hidden')).toBe(true);
                expect(domClass.contains(widget.typeSelect.parentElement, 'hidden')).toBe(true);
            });
        });
        describe('onPolyActionSelectChange', function () {
            beforeEach(function () {
                var atts = config.domains.featureAttributes;
                atts['Test Category'] = {
                    'Test Action': ['Test Treatment1', 'Test Treatment2']
                };
                atts['Test Category'][config.herbicideActionName] = ['test1', 'test2'];
                domConstruct.create('option', {
                    innerHTML: 'Test Category',
                    value: 'Test Category'
                }, widget.featureCategorySelect);
                widget.featureCategorySelect.value = 'Test Category';
            });
            it('populates the treatment select', function () {
                domConstruct.create('option', {
                    innerHTML: 'Test Action',
                    value: 'Test Action'
                }, widget.polyActionSelect);
                widget.polyActionSelect.value = 'Test Action';

                widget.onPolyActionSelectChange();

                expect(widget.treatmentSelect.children.length).toBe(3);
            });
            it('shows/hides the herbicide select', function () {
                domConstruct.create('option', {
                    innerHTML: config.herbicideActionName,
                    value: config.herbicideActionName
                }, widget.polyActionSelect);
                widget.polyActionSelect.value = config.herbicideActionName;

                widget.onPolyActionSelectChange();

                expect(domClass.contains(widget.herbicide, 'hidden')).toBe(false);

                domConstruct.create('option', {
                    innerHTML: 'Test Action',
                    value: 'Test Action'
                }, widget.polyActionSelect);
                widget.polyActionSelect.value = 'Test Action';

                widget.onPolyActionSelectChange();

                expect(domClass.contains(widget.herbicide, 'hidden')).toBe(true);
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
        describe('getActionsData', function () {
            it('combines multiple treatments for the same action', function () {
                widget.actions = [{
                    type: 'Terr',
                    treatment: 'T1'
                }, {
                    type: 'Terr',
                    treatment: 'T2'
                }, {
                    type: 'Something else',
                    treatment: 'T3'
                }];

                var results = widget.getActionsData();

                expect(results).toEqual([{
                    type: 'Terr',
                    treatments: [{
                        treatment: 'T1'
                    }, {
                        treatment: 'T2'
                    }]
                }, {
                    type: 'Something else',
                    treatments: [{treatment: 'T3'}]
                }]);
            });
            it('combines herbicides for the same treatment', function () {
                widget.actions = [{
                    type: 'Terr',
                    treatment: 'T1'
                }, {
                    type: 'Terr',
                    treatment: 'T2',
                    herbicide: 'herbi1'
                }, {
                    type: 'Terr',
                    treatment: 'T2',
                    herbicide: 'herbi2'
                }, {
                    type: 'Terr2',
                    treatment: 'T2',
                    herbicide: 'herbi2'
                }, {
                    type: 'Something else',
                    treatment: 'T3',
                    herbicide: 'herbi3'
                }];

                var results = widget.getActionsData();

                expect(results).toEqual([{
                    type: 'Terr',
                    treatments: [{
                        treatment: 'T1'
                    }, {
                        treatment: 'T2',
                        herbicides: ['herbi1', 'herbi2']
                    }]
                }, {
                    type: 'Terr2',
                    treatments: [{
                        treatment: 'T2',
                        herbicides: ['herbi2']
                    }]
                }, {
                    type: 'Something else',
                    treatments: [{
                        treatment: 'T3',
                        herbicides: ['herbi3']
                    }]
                }]);
            });
            it('copying action and description properties', function () {
                var inputs = [{
                    action: 'hello',
                    comments: 'blah'
                }, {
                    type: 'Something else',
                    treatment: 'T3',
                    herbicide: 'herbi3'
                }, {
                    type: 'type2',
                    action: 'hello2'
                }];
                inputs.forEach(function (i) {
                    widget.actions.push(new Action(i));
                });

                var results = widget.getActionsData();

                expect(results).toEqual([{
                    action: 'hello',
                    comments: 'blah'
                }, {
                    type: 'type2',
                    action: 'hello2'
                }, {
                    type: 'Something else',
                    treatments: [{
                        treatment: 'T3',
                        herbicides: ['herbi3']
                    }]
                }]);
            });
            it('gets action from visible controls if applicable', function () {
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
                widget.actions = [{
                    type: 'Test Action',
                    treatment: 'T1'
                }];

                var results = widget.getActionsData();

                expect(results).toEqual([{
                    type: 'Test Action',
                    treatments: [{
                        treatment: 'T1'
                    }, {
                        treatment: 'Test Treatment1'
                    }]
                }]);
            });
        });
        describe('onSaveClick', function () {
            it('sends the correct data to the api', function (done) {
                var def = new Deferred();
                var xhrSpy = jasmine.createSpy('xhr').and.returnValue(def.promise);
                stubModule('app/project/NewFeatureWizard', {
                    'app/router': {
                        getProjectId: function () {
                            return 999;
                        }
                    },
                    'app/project/userCredentials': {
                        getUserData: function () {
                            return {};
                        }
                    },
                    'dojo/request/xhr': {
                        post: xhrSpy
                    }
                }).then(function (StubbedModule) {
                    var testWidget2 = new StubbedModule({}, domConstruct.create('div', {}, document.body));
                    testWidget2.graphicsLayer.graphics = [{
                        geometry: new Point(JSON.parse(esriGeometries).esri.point)
                    }];
                    var actionData = 'blah';
                    spyOn(testWidget2, 'getActionsData').and.returnValue(actionData);

                    testWidget2.onSaveClick();

                    var args = xhrSpy.calls.mostRecent().args;
                    expect(args[0]).toMatch(/999/);

                    destroy(testWidget2);
                    done();
                });
            });
        });
    });
});
