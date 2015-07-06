define([
    'app/mapControls/_ReferenceLayersMixin',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/_base/declare',
    'dojo/text!app/mapControls/templates/LayerControls.html'
], function (
    _ReferenceLayersMixin,

    _TemplatedMixin,
    _WidgetBase,

    declare,
    template
) {
    return declare([_WidgetBase, _TemplatedMixin, _ReferenceLayersMixin], {
        // description:
        //      the spot for the layer bubbles, transparency, legend, etc
        templateString: template,
        baseClass: 'layer-controls',

        // Properties to be sent into constructor

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.mapControls.LayerControls::postCreate', arguments);

            this.inherited(arguments);
        }
    });
});
