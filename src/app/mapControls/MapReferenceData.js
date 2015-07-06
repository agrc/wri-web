define([
    'app/mapControls/_CollapsePanel',
    'app/mapControls/_ReferenceLayersMixin',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/_base/declare',
    'dojo/text!app/mapControls/templates/MapReferenceData.html',

    'bootstrap-stylus/js/collapse',
    'bootstrap-stylus/js/transition'
], function (
    _CollapsePanel,
    _ReferenceLayersMixin,

    _TemplatedMixin,
    _WidgetBase,

    declare,
    template
) {
    return declare([_WidgetBase, _TemplatedMixin, _CollapsePanel, _ReferenceLayersMixin], {
        // description:
        //      Container for controls for toggling reference layers
        templateString: template,
        baseClass: 'map-reference-data panel panel-default',

        // Properties to be sent into constructor

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.mapControls.MapReferenceData::postCreate', arguments);

            this.inherited(arguments);
        }
    });
});
