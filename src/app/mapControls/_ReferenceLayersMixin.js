define([
    'app/config',
    'app/mapControls/LayerItem',

    'dojo/_base/declare',
    'dojo/dom-construct'
],

function (
    config,
    LayerItem,

    declare,
    domConstruct
) {
    return declare([], {
        postCreate: function () {
            // summary:
            //      add buttons
            console.log('app.mapControls._ReferenceLayersMixin:postCreate', arguments);

            config.referenceLayers.forEach(function (rl) {
                this.own(new LayerItem(rl, domConstruct.create('div', null, this.container)));
            }, this);

            this.inherited(arguments);
        }
    });
});
