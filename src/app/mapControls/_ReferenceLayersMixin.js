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

            config.supportLayers
                .filter(function (l) {
                    return l.reference;
                })
                .forEach(function (l) {
                    this.own(new LayerItem(l, domConstruct.create('div', null, this.container)));
                }, this);

            this.inherited(arguments);
        }
    });
});
