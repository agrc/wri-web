define([
    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/_base/declare',
    'dojo/dom-class',
    'dojo/text!app/mapControls/templates/LayerItem.html'
], function (
    _TemplatedMixin,
    _WidgetBase,

    declare,
    domClass,
    template
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      A layer item to be used in the LayerControls widget to display a legend and toggle visibility
        templateString: template,
        baseClass: 'layer-item',

        // Properties to be sent into constructor

        // name: string
        // summary:
        //      the name of the layer to show in the UI
        name: '',

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.mapControls.LayerItem::postCreate', arguments);

            this.setupConnections();

            this.inherited(arguments);
        },
        setupConnections: function () {
            // summary:
            //      wire events, and such
            console.log('app.mapControls.LayerItem::setupConnections', arguments);

        },
        toggle: function () {
            // summary:
            //      toggle the highlighted status of a layeritem
            console.log('app.mapControls::toggle', arguments);

            domClass.toggle(this.toggleNode, 'btn-primary');
        }
    });
});
