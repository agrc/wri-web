define([
    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/_base/declare',
    'dojo/text!app/mapControls/templates/LayerControls.html'
], function (
    _TemplatedMixin,
    _WidgetBase,

    declare,
    template
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      the spot for the layer bubbles, transparency, legend, etc
        templateString: template,
        baseClass: 'layer-controls',

        // Properties to be sent into constructor

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.mapControls.LayerControls::postCreate', arguments);

            this.setupConnections();

            this.inherited(arguments);

            if (!this.layers || this.layers.length === 0) {
                return;
            }

            var that = this;

            this.layers.forEach(function (layer) {
                layer.placeAt(that.layerContainerNode);
            });
        },
        setupConnections: function () {
            // summary:
            //      wire events, and such
            console.log('app.mapControls.LayerControls::setupConnections', arguments);

        }
    });
});