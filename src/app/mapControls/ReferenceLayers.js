define([
    'app/mapControls/_CollapsePanel',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/_base/declare',
    'dojo/text!app/mapControls/templates/ReferenceLayers.html',

    'bootstrap-stylus/js/collapse',
    'bootstrap-stylus/js/transition'
], function (
    _CollapsePanel,

    _TemplatedMixin,
    _WidgetBase,

    declare,
    template
) {
    return declare([_WidgetBase, _TemplatedMixin, _CollapsePanel], {
        // description:
        //      Container for controls for toggling reference layers
        templateString: template,
        baseClass: 'reference-layers panel panel-default',
        widgetsInTemplate: true,

        // Properties to be sent into constructor

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.mapControls.ReferenceLayers::postCreate', arguments);

            this.inherited(arguments);
        }
    });
});
