require([
    'app/project/FeatureDetails',

    'dojo/dom-class',
    'dojo/dom-construct'
], function (
    WidgetUnderTest,

    domClass,
    domConstruct
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
            it('places template in contents', function () {
                widget.onFeatureSelected({});

                expect(widget.featureTabContents.innerHTML.length).toBeGreaterThan(5);
            });
            it('shows the feature tab', function () {
                expect(domClass.contains(widget.featureTabContents, 'hidden')).toBe(true);

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
