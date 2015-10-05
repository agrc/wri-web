require([
    'app/project/Action',

    'dojo/dom-construct'
], function (
    WidgetUnderTest,

    domConstruct
) {
    describe('app/project/Action', function () {
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
            it('should create a Action', function () {
                expect(widget).toEqual(jasmine.any(WidgetUnderTest));
            });
        });
        describe('toObject', function () {
            it('returns the valid properties', function () {
                var obj = {
                    type: 'blah',
                    comments: 'hello'
                };
                var widget2 = new WidgetUnderTest(obj, domConstruct.create('div', null, document.body));
                expect(widget2.toObject()).toEqual(obj);
                destroy(widget2);

                obj = {
                    type: 'blah',
                    action: 'hello action'
                };
                widget2 = new WidgetUnderTest(obj, domConstruct.create('div', null, document.body));
                expect(widget2.toObject()).toEqual(obj);
                destroy(widget2);
            });
        });
    });
});
