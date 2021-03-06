define([
    'app/config',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/on',
    'dojo/text!app/project/templates/OpacitySlider.html',
    'dojo/topic',

    'bootstrap-stylus/js/tooltip',
    'bootstrap-stylus/js/popover',
    'slider'
], function (
    config,

    _TemplatedMixin,
    _WidgetBase,

    declare,
    lang,
    on,
    template,
    topic
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      Controls for adjusting the opacity of a feature or set of features on the map.
        templateString: template,
        baseClass: 'opacity-slider',

        // Properties to be sent into constructor
        // {
        //     type: String,
        //     subType: String,
        //     action: String,
        //     origin: String (point, line, poly),
        //     parent: Number,
        //     featureId: Number,
        //     size: String,
        //     hasChildren: Boolean
        // }

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.project.OpacitySlider::postCreate', arguments);

            $(this.sliderDiv).slider({
                min: 0,
                max: 1,
                value: 1,
                step: 0.01,
                tooltip: 'hide'
            });
            $(this.sliderDiv).on('change', lang.hitch(this, 'onChange'));
            $(this.button).popover({
                content: this.sliderContainer,
                container: 'body',
                html: true,
                trigger: 'manual'
            });

            var that = this;
            on(this.button, 'click', function () {
                $(that.button).popover('toggle');
            });
            $(this.button).on('shown.bs.popover', function () {
                on.once(document, 'click', function () {
                    $(that.button).popover('hide');
                });
            });

            this.inherited(arguments);
        },
        onChange: function (evt) {
            // summary:
            //      description
            // evt: Event Object
            console.log('app/project/OpacitySlider:onChange', arguments);

            topic.publish(config.topics.opacityChanged, evt.value.newValue, this.origin, this.featureId);
        },
        destroy: function () {
            // summary:
            //      destroy the popover
            console.log('app.project.OpacitySlider:destroy', arguments);

            $(this.button).popover('destroy');
        }
    });
});
