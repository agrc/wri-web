require([
    'app/Toaster',

    'dojo/dom-construct',
    'dojo/topic'
], function (
    WidgetUnderTest,

    domConstruct,
    topic
) {
    describe('app/Toaster', function () {
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
            it('should create a Toaster', function () {
                expect(widget).toEqual(jasmine.any(WidgetUnderTest));
            });
        });
        describe('topics', function () {
            it('listens to the default topic property', function () {
                widget.handleMessage = jasmine.createSpy('handleMessage');
                topic.publish('app/Toaster', 'message');

                expect(widget.handleMessage.calls.count()).toBe(1);
                expect(widget.handleMessage.calls.mostRecent().args).toEqual(['message']);
            });
            it('listens to the custom topic property', function () {
                widget.destroy(false);

                widget = new WidgetUnderTest({
                    topic: 'custom'
                }, domConstruct.create('div', null, document.body));

                widget.handleMessage = jasmine.createSpy('handleMessage');
                topic.publish('custom', 'message');

                expect(widget.handleMessage.calls.count()).toBe(1);
                expect(widget.handleMessage.calls.mostRecent().args).toEqual(['message']);
            });
        });
        describe('handleMessage', function () {
            it('sets default class for simple string message', function () {
                widget.setContent = jasmine.createSpy('setContent');

                widget.handleMessage('message');

                expect(widget.setContent.calls.count()).toBe(1);
                expect(widget.setContent.calls.mostRecent().args).toEqual(['message', widget.defaultClass]);
            });
            it('sets class when specified and in allowableClasses', function () {
                widget.setContent = jasmine.createSpy('setContent');

                widget.handleMessage({message: 'message', type: 'danger'});

                expect(widget.setContent.calls.count()).toBe(1);
                expect(widget.setContent.calls.mostRecent().args).toEqual(['message', 'danger', undefined]);
            });
            it('sets class to default when not in allowableClasses', function () {
                widget.setContent = jasmine.createSpy('setContent');

                widget.handleMessage({message: 'message', type: 'not there'});

                expect(widget.setContent.calls.count()).toBe(1);
                expect(widget.setContent.calls.mostRecent().args).toEqual(['message', widget.defaultClass, undefined]);
            });
            it('passes along the sticky value', function () {
                widget.setContent = jasmine.createSpy('setContent');

                widget.handleMessage({message: 'message', type: 'danger', sticky: true});

                expect(widget.setContent.calls.count()).toBe(1);
                expect(widget.setContent.calls.mostRecent().args).toEqual(['message', 'danger', true]);
            });
        });
        describe('setContent', function () {
            it('does not add items with empty message', function () {
                widget.setContent();

                expect(widget.toasterItems.length).toEqual(0);
            });
            it('does not add duplicate items', function () {
                widget.setContent('a', widget.defaultClass);
                widget.setContent('a', widget.defaultClass);

                expect(widget.toasterItems.length).toEqual(1);
            });
            it('does not add duplicate items', function () {
                widget.setContent('a', widget.defaultClass);
                widget.setContent('a', widget.defaultClass);
                widget.setContent('a', 'danger');

                expect(widget.toasterItems.length).toEqual(2);
            });
            it('removes first item when maxItems is reached', function () {
                widget.maxItems = 2;
                widget.setContent('1', widget.defaultClass);
                widget.setContent('2', widget.defaultClass);
                widget.setContent('3', widget.defaultClass);

                expect(widget.toasterItems.length).toEqual(widget.maxItems);
                expect(widget.toasterItems[0].message).toEqual('2');
            });
        });
        describe('isDuplicate', function () {
            it('returns true if duplicate', function () {
                expect(widget.isDuplicate([{message: 'a', cssClass: 'b'}], 'a', 'b')).toEqual(true);
                expect(widget.isDuplicate([{message: 'a', cssClass: 'c'}, {message: 'a', cssClass: 'b'}], 'a', 'b')).toEqual(true);
            });
            it('returns false if no duplicate', function () {
                expect(widget.isDuplicate([{message: 'a', cssClass: 'b'}], 'a', 'c')).toEqual(false);
                expect(widget.isDuplicate([{message: 'a', cssClass: 'c'}, {message: 'a', cssClass: 'b'}], 'a', 'd')).toEqual(false);
                expect(widget.isDuplicate([], 'a', 'b')).toEqual(false);
            });
        });
    });
});
