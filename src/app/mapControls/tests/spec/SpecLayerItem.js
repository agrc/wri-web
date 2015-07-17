require([
    'agrc-jasmine-matchers/topics',

    'app/config',
    'app/mapControls/LayerItem',

    'dojo/dom-construct',
    'dojo/dom-class',
    'dojo/topic'
], function (
    topics,

    config,
    WidgetUnderTest,

    domConstruct,
    domClass,
    topic
) {
    describe('app/mapControls/LayerItem', function () {
        var widget;
        var destroy = function (widget) {
            widget.destroyRecursive();
            widget = null;
        };

        beforeEach(function () {
            widget = new WidgetUnderTest({
                name: 'blah',
                url: 'blah2'
            }, domConstruct.create('div', null, document.body));
            widget.startup();
        });

        afterEach(function () {
            if (widget) {
                destroy(widget);
            }
        });

        describe('Sanity', function () {
            it('should create a LayerItem', function () {
                expect(widget).toEqual(jasmine.any(WidgetUnderTest));
            });
        });
        describe('onToggleReferenceLayerTopic', function () {
            it('toggles button when relevant topic fires', function () {
                var widgetWithSameName = {name: widget.name};
                expect(widget.checkbox.checked).toBe(false);

                topic.publish(config.topics.toggleReferenceLayer, {}, true);

                expect(widget.checkbox.checked).toBe(false);

                topic.publish(config.topics.toggleReferenceLayer, widgetWithSameName, true);

                expect(widget.checkbox.checked).toBe(true);

                topic.publish(config.topics.toggleReferenceLayer, widgetWithSameName, false);

                expect(widget.checkbox.checked).toBe(false);
            });
        });
        describe('toggleBtn', function () {
            it('should toggle the button', function () {
                expect(domClass.contains(widget.domNode, 'active')).toBe(false);

                widget.toggleBtn(true);

                expect(domClass.contains(widget.domNode, 'active')).toBe(true);
                expect(widget.checkbox.checked).toBe(true);
            });
        });
        describe('toggleLayer', function () {
            it('fires the topic', function () {
                topics.listen(config.topics.toggleReferenceLayer);
                widget.toggleLayer(true);

                expect(config.topics.toggleReferenceLayer).toHaveBeenPublishedWith(widget, true);
            });
        });
    });
});
