require([
    'app/project/ProjectContainer',

    'dojo/dom-construct'
], function (
    WidgetUnderTest,

    domConstruct
) {
    describe('app/project/ProjectContainer', function () {
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
            it('should create a ProjectContainer', function () {
                expect(widget).toEqual(jasmine.any(WidgetUnderTest));
            });
        });
        describe('showDetailsForProject', function () {
            it('destroys child widgets', function () {
                var destroySpy = jasmine.createSpy('destroy');
                widget.featureDetails = {destroy: destroySpy};
                widget.projectDetails = {destroy: destroySpy};
                widget.featuresGrid = {destroy: destroySpy};

                widget.showDetailsForProject();

                expect(destroySpy.calls.count()).toBe(3);
            });
        });
    });
});
