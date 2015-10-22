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

        beforeEach(function () {
            widget = new WidgetUnderTest({
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
        });

        afterEach(function () {
            if (widget) {
                destroy(widget);
            }
        });

        describe('Sanity', function () {
            it('should create a FeatureDetails', function () {
                expect(widget).toEqual(jasmine.any(WidgetUnderTest));
            });
        });
        describe('onFeatureSelected', function () {
            beforeEach(function (done) {
                stubModule('app/project/FeatureDetails', {
                    'dojo/request/xhr': {
                        get: jasmine.createSpy('xhr').and.returnValue({
                            response: new Deferred().promise
                        })
                    },
                    'app/router': {
                        getProjectId: function () {
                            return 999;
                        }
                    }
                }).then(function (StubbedModule) {
                    if (widget) {
                        destroy(widget);
                    }

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

            it('places template in contents', function () {
                widget.onFeatureSelected({});

                expect(widget.featureTabContents.innerHTML.length).toBeGreaterThan(5);
            });
            it('shows the feature tab', function () {
                expect(domClass.contains(widget.featureTabContents.parentElement, 'hidden')).toBe(true);

                widget.onFeatureSelected({});

                expect(domClass.contains(widget.featureTabContents, 'hidden')).toBe(false);
            });
            it('clears out any previous data', function () {
                widget.featureTabContents.innerHTML = 'test';

                widget.onFeatureSelected({});

                expect(widget.featureTabContents.innerHTML).not.toContain('test');
            });
        });
    });
});
