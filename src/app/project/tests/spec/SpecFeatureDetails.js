require([
    'app/project/FeatureDetails',

    'dojo/Deferred',
    'dojo/dom-class',
    'dojo/dom-construct',

    'stubmodule'
], function (
    WidgetUnderTest,

    Deferred,
    domClass,
    domConstruct,

    stubModule
) {
    describe('app/project/FeatureDetails', function () {
        var widget;
        var destroy = function (widget) {
            widget.destroyRecursive();
            widget = null;
        };

        var def;
        var StubbedModule;
        var xhrSpy;
        beforeEach(function (done) {
            xhrSpy = jasmine.createSpy('xhr');
            def = new Deferred();
            stubModule('app/project/FeatureDetails', {
                'dojo/request/xhr': xhrSpy.and.returnValue({
                    response: def.promise
                }),
                'app/router': {
                    getProjectId: function () {
                        return 999;
                    }
                },
                'app/project/userCredentials': {
                    getUserData: function () {
                        return {};
                    }
                }
            }).then(function (Module) {
                StubbedModule = Module;
                widget = new StubbedModule({
                    title: 'Title',
                    projectId: 1234,
                    status: 'Completed',
                    description: 'asdf',
                    acres: 123,
                    streamMiles: 34,
                    leadAgency: 'asdf',
                    region: 'asdf',
                    projectManagerName: 'Scott Davis'
                }, domConstruct.create('div', null, document.body));
                widget.startup();
                done();
            });
        });

        afterEach(function () {
            if (widget) {
                destroy(widget);
            }
        });

        describe('Sanity', function () {
            it('should create a FeatureDetails', function () {
                expect(widget).toEqual(jasmine.any(StubbedModule));
            });
        });
        describe('onFeatureSelected', function () {
            it('places template in contents', function () {
                widget.onFeatureSelected({});
                def.resolve();

                expect(widget.featureTabContents.innerHTML.length).toBeGreaterThan(5);
            });
            it('shows the feature tab', function () {
                expect(domClass.contains(widget.featureTabContents.parentElement, 'hidden')).toBe(true);

                widget.onFeatureSelected({});
                def.resolve();

                expect(domClass.contains(widget.featureTabContents, 'hidden')).toBe(false);
            });
            it('clears out any previous data', function () {
                widget.featureTabContents.innerHTML = 'test';

                widget.onFeatureSelected({});
                def.resolve();

                expect(widget.featureTabContents.innerHTML).not.toContain('test');
            });
        });
        describe('makeRequest', function () {
            it('uses data for post and query for get', function () {
                var type = 'blah';
                widget.currentRowData = {
                    type: type
                };
                widget.makeRequest('GET');

                expect(xhrSpy.calls.mostRecent().args[1].query).toEqual({
                    featureCategory: type
                });

                widget.makeRequest('DELETE');

                expect(xhrSpy.calls.mostRecent().args[1].data).toEqual({
                    featureCategory: type
                });
            });
        });
    });
});
