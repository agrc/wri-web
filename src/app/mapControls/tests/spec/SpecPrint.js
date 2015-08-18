require([
    'app/mapControls/Print',

    'dojo/dom-construct'
], function (
    WidgetUnderTest,

    domConstruct
) {
    describe('app/mapControls/Print', function () {
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
            it('should create a Print', function () {
                expect(widget).toEqual(jasmine.any(WidgetUnderTest));
            });
        });
    });
});
