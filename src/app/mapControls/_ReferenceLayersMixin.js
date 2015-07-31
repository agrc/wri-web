define([
    'app/config',
    'app/mapControls/LayerItem',

    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/topic',
    'dojo/_base/declare'
],

function (
    config,
    LayerItem,

    domClass,
    domConstruct,
    topic,
    declare
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

            var that = this;
            topic.subscribe(config.topics.toggleReferenceLayerLabels, function (show, originator) {
                if (originator !== that) {
                    domClass.toggle(that.labelsBtn, 'active', show);
                }
            });
        },
        toggleLabels: function () {
            // summary:
            //      description
            console.log('app.mapControls._ReferenceLayersMixin:toggleLabels', arguments);

            topic.publish(config.topics.toggleReferenceLayerLabels,
                !domClass.contains(this.labelsBtn, 'active'), this);
        }
    });
});
