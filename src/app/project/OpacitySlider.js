define([
    'app/config',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/_base/declare',
    'dojo/_base/lang',
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
                max: 100,
                value: 100,
                tooltip: 'hide'
            });
            $(this.sliderDiv).on('change', lang.hitch(this, 'onChange'));
            $(this.button).popover({
                content: this.sliderContainer,
                container: 'body',
                html: true
            });

            this.inherited(arguments);
        },
        onChange: function (evt) {
            // summary:
            //      description
            // evt: Event Object
            console.log('app/project/OpacitySlider:onChange', arguments);

            topic.publish(config.topics.opacityChanged, evt.value, this.origin, this.featureId);
        }
    });
});
