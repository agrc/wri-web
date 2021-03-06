require([
    'agrc-jasmine-matchers/topics',

    'app/config',
    'app/helpers',
    'app/project/Action',
    'app/project/CreateEditFeature',

    'dojo/Deferred',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/query',
    'dojo/text!app/tests/data/esri_geometries.json',

    'esri/geometry/Multipoint',
    'esri/geometry/Point',
    'esri/geometry/Polygon',
    'esri/geometry/Polyline',
    'esri/graphic',

    'stubmodule'
], function (
    topics,

    config,
    helpers,
    Action,
    WidgetUnderTest,

    Deferred,
    domClass,
    domConstruct,
    query,
    esriGeometries,

    Multipoint,
    Point,
    Polygon,
    Polyline,
    Graphic,

    stubModule
) {
    describe('app/project/CreateEditFeature', function () {
        esriGeometries = JSON.parse(esriGeometries);
        var widget;
        var category = config.domains.featureType[0][0];
        var geo = new Polyline(esriGeometries.esri.line);
        var featureId = 88;
        var existingData = {
            category: category,
            retreatment: 'Y',
            geometry: geo,
            actions: [{
                action: 'action1',
                type: 'type1'
            }, {
                action: 'action2',
                treatment: 'treatment2',
                herbicide: 'herbicide2'
            }, {
                action: 'action3',
                description: 'description3'
            }],
            featureId: featureId
        };
        var destroy = function (widget) {
            widget.destroyRecursive();
            widget = null;
        };

        beforeEach(function () {
            spyOn(helpers, 'getGeometryTypeFromCategory');
            widget = new WidgetUnderTest(null, domConstruct.create('div', null, document.body));
            widget.startup();
        });

        afterEach(function () {
            if (widget) {
                destroy(widget);
            }
        });

        describe('Sanity', function () {
            it('should create a CreateEditFeature', function () {
                expect(widget).toEqual(jasmine.any(WidgetUnderTest));
            });
            it('should build the feature types select options', function () {
                expect(widget.featureCategorySelect.children.length)
                    .toBe(config.domains.featureType.length + 1);
            });
        });
        describe('parseExistingData', function () {
            it('accepts existing data', function () {
                widget.parseExistingData(existingData);

                expect(widget.featureCategorySelect.value).toBe(category);
                expect(widget.retreatmentChBx.checked).toBe(true);
                expect(widget.graphicsLayer.graphics[0].geometry).toEqual(geo);
                expect(widget.actions.length).toBe(3);
            });
            it('does not create action widgets for categories that don\'t support multiple actions', function () {
                var easement = 'Easement/Acquisition';
                var fee = 'Fee title land acquisition';
                var existingData2 = {
                    category: easement,
                    geometry: new Polygon(esriGeometries.esri.poly),
                    actions: [{
                        action: easement,
                        treatment: fee
                    }],
                    featureId: featureId
                };
                widget.parseExistingData(existingData2);

                expect(widget.actions.length).toBe(0);
                expect(widget.polyActionSelect.value).toBe(easement);
                expect(domClass.contains(widget.polyAction, 'hidden')).toBe(false);
                expect(widget.treatmentSelect.value).toBe(fee);
                expect(domClass.contains(widget.treatment, 'hidden')).toBe(false);
            });
            it('explodes multipoint geometry', function () {
                spyOn(widget, 'onGeometryDefined').and.callThrough();
                existingData.geometry = new Multipoint(esriGeometries.esri.multipoint);

                widget.parseExistingData(existingData);

                expect(widget.onGeometryDefined.calls.count()).toBe(3);
                expect(widget.graphicsLayer.graphics.length).toBe(3);
            });
            it('explodes multi-part polygon geometry', function () {
                spyOn(widget, 'onGeometryDefined').and.callThrough();
                existingData.geometry = new Polygon(esriGeometries.esri.multipolygon);

                widget.parseExistingData(existingData);

                expect(widget.onGeometryDefined.calls.count()).toBe(2);
                expect(widget.graphicsLayer.graphics.length).toBe(2);
                expect(widget.graphicsLayer.graphics[0].geometry.rings[0])
                    .toEqual(esriGeometries.esri.multipolygon.rings[0]);
            });
            it('explodes multi-part line geometry', function () {
                spyOn(widget, 'onGeometryDefined').and.callThrough();
                existingData.geometry = new Polyline(esriGeometries.esri.multiline);

                widget.parseExistingData(existingData);

                expect(widget.onGeometryDefined.calls.count()).toBe(2);
                expect(widget.graphicsLayer.graphics.length).toBe(2);
                expect(widget.graphicsLayer.graphics[0].geometry.paths[0])
                    .toEqual(esriGeometries.esri.multiline.paths[0]);
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
            it('hides action dropdown for other point feature', function () {
                atts[testType] = [];
                config.noActionCategories.push(testType);

                widget.onFeatureCategoryChange();

                expect(domClass.contains(widget.pointLineActionSelect.parentElement, 'hidden')).toBe(true);
                expect(widget.pointLineActionSelect.children.length).toBe(1);

                config.noActionCategories.pop();
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

                widget.graphicsLayer.graphics = [{geometry: {type: ''}}];

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
            it('shows the buffer select if category is poly and there is a line geometry', function () {
                expect(domClass.contains(widget.buffer, 'hidden')).toBe(true);

                helpers.getGeometryTypeFromCategory.and.returnValue('POLY');
                widget.graphicsLayer.graphics = [{
                    geometry: {
                        type: 'polyline'
                    }
                }, {
                    geometry: {
                        type: 'polygon'
                    }
                }];

                widget.validateForm();

                expect(domClass.contains(widget.buffer, 'hidden')).toBe(false);
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
                widget.graphicsLayer.graphics = [{geometry: {type: ''}}];
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
                    action: 'Cable',
                    treatment: 'T1'
                }, {
                    action: 'Cable',
                    treatment: 'T2'
                }, {
                    action: 'Something else',
                    treatment: 'T3'
                }];

                var results = widget.getActionsData();

                expect(results).toEqual([{
                    action: 'Cable',
                    treatments: [{
                        treatment: 'T1'
                    }, {
                        treatment: 'T2'
                    }]
                }, {
                    action: 'Something else',
                    treatments: [{treatment: 'T3'}]
                }]);
            });
            it('combines herbicides for the same treatment', function () {
                widget.actions = [{
                    action: 'Cable',
                    treatment: 'T1'
                }, {
                    action: 'Cable',
                    treatment: 'T2',
                    herbicide: 'herbi1'
                }, {
                    action: 'Cable',
                    treatment: 'T2',
                    herbicide: 'herbi2'
                }, {
                    action: 'Cable2',
                    treatment: 'T2',
                    herbicide: 'herbi2'
                }, {
                    action: 'Something else',
                    treatment: 'T3',
                    herbicide: 'herbi3'
                }];

                var results = widget.getActionsData();

                expect(results).toEqual([{
                    action: 'Cable',
                    treatments: [{
                        treatment: 'T1'
                    }, {
                        treatment: 'T2',
                        herbicides: ['herbi1', 'herbi2']
                    }]
                }, {
                    action: 'Cable2',
                    treatments: [{
                        treatment: 'T2',
                        herbicides: ['herbi2']
                    }]
                }, {
                    action: 'Something else',
                    treatments: [{
                        treatment: 'T3',
                        herbicides: ['herbi3']
                    }]
                }]);
            });
            it('copying action and description properties', function () {
                var inputs = [{
                    action: 'hello',
                    description: 'blah'
                }, {
                    action: 'Something else',
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
                    description: 'blah'
                }, {
                    type: 'type2',
                    action: 'hello2'
                }, {
                    action: 'Something else',
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
                widget.graphicsLayer.graphics = [{geometry: {type: ''}}];
                domConstruct.create('option', {
                    innerHTML: 'Test Action',
                    value: 'Test Action'
                }, widget.polyActionSelect);
                widget.polyActionSelect.value = 'Test Action';
                widget.onPolyActionSelectChange();
                widget.treatmentSelect.value = 'Test Treatment1';
                widget.actions = [{
                    action: 'Test Action',
                    treatment: 'T1'
                }];

                var results = widget.getActionsData();

                expect(results).toEqual([{
                    action: 'Test Action',
                    treatments: [{
                        treatment: 'T1'
                    }, {
                        treatment: 'Test Treatment1'
                    }]
                }]);
            });
            it('doesn\t return empty action objects', function () {
                spyOn(widget, 'validateForm').and.returnValue(true);

                expect(widget.getActionsData()).toEqual(null);
            });
        });
        describe('getActionParams', function () {
            var setUp = function (data) {
                data.forEach(function (d) {
                    var select = d[0];
                    var value = d[1];
                    domConstruct.create('option', {
                        innerHTML: value,
                        value: value
                    }, select);
                    select.value = value;
                    domClass.remove(select.parentElement, 'hidden');
                });
            };
            it('returns null if no controls are visible', function () {
                query('[data-dojo-attach-point="actionsContainer"] .form-group',
                    widget.domNode).addClass('hidden');
                expect(widget.getActionParams()).toBeNull();
            });
            describe('maps the correct control values to the correct properties', function () {
                it('poly with action, treatment & herbicide', function () {
                    var action = 'actionman';
                    var treatment = 'treatment1';
                    var herbicide = 'herbie';
                    setUp([
                        [widget.polyActionSelect, action],
                        [widget.treatmentSelect, treatment],
                        [widget.herbicideSelect, herbicide]
                    ]);

                    expect(widget.getActionParams()).toEqual({
                        action: action,
                        treatment: treatment,
                        herbicide: herbicide
                    });
                });
                it('poly with action & treatment', function () {
                    var action = 'actionman';
                    var treatment = 'treatment1';
                    setUp([
                        [widget.polyActionSelect, action],
                        [widget.treatmentSelect, treatment]
                    ]);

                    expect(widget.getActionParams()).toEqual({
                        action: action,
                        treatment: treatment
                    });
                });
                it('poly with single action', function () {
                    var action = 'actionman';
                    setUp([
                        [widget.polyActionSelect, action]
                    ]);

                    expect(widget.getActionParams()).toEqual({
                        action: action
                    });
                });
                it('point/line with action & type', function () {
                    var action = 'actionman';
                    var type = 'typer';
                    setUp([
                        [widget.pointLineActionSelect, action],
                        [widget.typeSelect, type]
                    ]);

                    expect(widget.getActionParams()).toEqual({
                        action: action,
                        type: type
                    });
                });
                it('point/line with single action', function () {
                    var action = 'actionman';
                    setUp([
                        [widget.pointLineActionSelect, action]
                    ]);

                    expect(widget.getActionParams()).toEqual({
                        action: action
                    });
                });
                it('point/line with action & comments', function () {
                    var action = 'actionman';
                    var comments = 'hello comments';
                    setUp([
                        [widget.pointLineActionSelect, action]
                    ]);
                    domClass.remove(widget.comments, 'hidden');
                    widget.commentsTxt.value = comments;

                    expect(widget.getActionParams()).toEqual({
                        action: action,
                        description: comments
                    });
                });

            });
        });
        describe('onSaveClick', function () {
            var StubbedModule;
            var xhrSpy;
            beforeEach(function (done) {
                var def = new Deferred();
                xhrSpy = jasmine.createSpy('xhr').and.returnValue({
                    response: def.promise
                });
                stubModule('app/project/CreateEditFeature', {
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
                    'dojo/request/xhr': xhrSpy
                }).then(function (Module) {
                    StubbedModule = Module;
                    done();
                });
            });
            it('sends the correct data to the api for create', function () {
                var testWidget2 = new StubbedModule({}, domConstruct.create('div', {}, document.body));
                testWidget2.graphicsLayer.graphics = [{
                    geometry: new Point(esriGeometries.esri.point)
                }];
                var actionData = 'blah';
                spyOn(testWidget2, 'getActionsData').and.returnValue(actionData);

                testWidget2.onSaveClick();

                var args = xhrSpy.calls.mostRecent().args;
                expect(args[0]).toMatch(/999\/feature\/create/);
                expect(args[1].method).toBe('POST');

                destroy(testWidget2);
            });
            it('sends the correct data to the api for edit', function () {
                var testWidget2 = new StubbedModule({
                    existingData: existingData
                }, domConstruct.create('div', {}, document.body));

                testWidget2.onSaveClick();

                var args = xhrSpy.calls.mostRecent().args;
                expect(args[0]).toMatch(/999\/feature\/88/);
                expect(args[1].method).toBe('PUT');

                destroy(testWidget2);
            });
        });
        describe('onBufferChange', function () {
            it('gets buffer lines and removes from graphics layer', function () {
                spyOn(widget, 'onGeometryDefined');
                widget.graphicsLayer.graphics = [
                    new Graphic({geometry: esriGeometries.esri.line}),
                    new Graphic({geometry: esriGeometries.esri.line}),
                    new Graphic({geometry: esriGeometries.esri.polygon})
                ];
                widget.bufferSelect.value = 5;

                widget.onBufferChange();

                expect(widget.bufferLines.length).toBe(2);
                expect(widget.graphicsLayer.graphics.length).toBe(1);
            });
        });
        describe('reducePrecision', function () {
            it('rounds coords for polygons', function () {
                var result = widget.reducePrecision(new Polygon(esriGeometries.esri.multipolygon));

                expect(result.rings[0][0][0]).toBe(-12545673.12);
                expect(result.rings[0][0][1]).toBe(4865605.12);

                result = widget.reducePrecision(new Polygon(esriGeometries.esri.polygon));

                expect(result.rings[0][1][0]).toBe(-12544660.16);
                expect(result.rings[0][1][1]).toBe(4867133.14);
            });
            it('rounds coords for polylines', function () {
                var result = widget.reducePrecision(new Polyline(esriGeometries.esri.multiline));

                expect(result.paths[0][0][0]).toBe(-12544870.12);
                expect(result.paths[0][0][1]).toBe(4870802.12);
            });
            it('does nothing to points', function () {
                var pnt = new Point(esriGeometries.esri.point);

                var result = widget.reducePrecision(pnt);

                expect(result).toEqual(pnt);
            });
        });
    });
});
