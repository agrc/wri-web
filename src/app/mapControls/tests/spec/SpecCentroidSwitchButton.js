require([
    'app/mapControls/CentroidSwitchButton',

    'dojo/dom-construct'
], function (
    WidgetUnderTest,

    domConstruct
) {
    describe('app/mapControls/CentroidSwitchButton', function () {
        var widget;
        var node;
        var destroy = function (widget) {
            widget.destroyRecursive();
            widget = null;
            node = null;
        };

        beforeEach(function () {
            widget = new WidgetUnderTest(null, domConstruct.create('div', null, document.body));
            widget.startup();
            node = domConstruct.create('div', null, document.body);
        });

        afterEach(function () {
            if (widget) {
                destroy(widget);
            }
        });

        describe('Sanity', function () {
            it('should create a CentroidSwitchButton', function () {
                expect(widget).toEqual(jasmine.any(WidgetUnderTest));
            });
        });

        describe('toggle', function () {
            it('should be added on first click', function () {
                widget.toggle({
                    target: node
                });

                expect(node.getAttribute('class')).toEqual('toggle');
            });

            it('should be removed on second click', function () {
                widget.toggle({
                    target: node
                });

                widget.toggle({
                    target: node
                });

                expect(node.getAttribute('class')).toEqual('');
            });
        });
    });
});
