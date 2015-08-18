require([
    'app/ToasterItem',

    'dojo/dom-construct'
], function (
    WidgetUnderTest,

    domConstruct
) {
    describe('app/ToasterItem', function () {
        var widget;
        var destroy = function (widget) {
            widget.destroyRecursive();
            widget = null;
        };

        afterEach(function () {
            if (widget) {
                destroy(widget);
            }
        });

        describe('Sanity', function () {
            it('should create a ToasterItem', function () {
                widget = new WidgetUnderTest({
                    message: 'test',
                    cssClass: 'info'
                }, domConstruct.create('div', null, document.body));
                widget.startup();

                expect(widget).toEqual(jasmine.any(WidgetUnderTest));
            });
        });
        describe('constructor', function () {
            it('danger is sticky by default but can be overridden', function () {
                widget = new WidgetUnderTest({
                    message: 'test',
                    cssClass: 'danger',
                    duration: 1
                }, domConstruct.create('div', null, document.body));
                widget.startup();

                expect(widget.sticky).toBe(true);

                var widget2 = new WidgetUnderTest({
                    message: 'test',
                    cssClass: 'danger',
                    duration: 1,
                    sticky: false
                }, domConstruct.create('div', null, document.body));
                widget2.startup();

                expect(widget2.sticky).toBe(false);
                destroy(widget2);
            });
        });
        describe('show', function () {
            beforeEach(function () {
                jasmine.clock().install();
            });
            afterEach(function () {
                jasmine.clock().uninstall();
            });
            it('hides destroys itself after timeout', function () {
                widget = new WidgetUnderTest({
                    message: 'test',
                    cssClass: 'info',
                    duration: 1
                }, domConstruct.create('div', null, document.body));
                widget.startup();
                spyOn(widget.hideAnim, 'play');

                widget.show();
                jasmine.clock().tick(2);

                expect(widget.hideAnim.play).toHaveBeenCalled();
            });
            it('sticky doesn\'t auto hide', function () {
                widget = new WidgetUnderTest({
                    message: 'test',
                    cssClass: 'info',
                    duration: 1,
                    sticky: true
                }, domConstruct.create('div', null, document.body));
                widget.startup();
                spyOn(widget.hideAnim, 'play');

                widget.show();
                jasmine.clock().tick(2);

                expect(widget.hideAnim.play).not.toHaveBeenCalled();
            });
        });
    });
});
