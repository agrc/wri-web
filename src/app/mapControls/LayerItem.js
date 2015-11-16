define([
    'app/config',
    'app/mapControls/Legend',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/mouse',
    'dojo/on',
    'dojo/text!app/mapControls/templates/LayerItem.html',
    'dojo/topic',
    'dojo/_base/declare',
    'dojo/_base/lang',

    'bootstrap-stylus/js/button',
    'bootstrap-stylus/js/tooltip'
], function (
    config,
    Legend,

    _TemplatedMixin,
    _WidgetBase,

    domClass,
    domConstruct,
    mouse,
    on,
    template,
    topic,
    declare,
    lang
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      A layer item to be used in the LayerControls widget to display a legend and toggle visibility
        templateString: template,
        baseClass: 'layer-item btn btn-default btn-xs',

        // Properties to be sent into constructor

        // name: string
        // summary:
        //      the name of the layer to show in the UI
        name: '',

        // url: String
        //      the url to the service endpoint
        url: '',

        // layerIndex: Number
        //      the index of the layer with a dynamic map service
        layerIndex: null,

        // type: String (dynamic | cached | range)
        //      the type of layer to create
        type: '',

        // legend: Boolean
        //      display a legend tooltip
        legend: false,

        // minScale: Number
        //      the min scale at which the button will be enabled
        minScale: null,

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.mapControls.LayerItem::postCreate', arguments);

            if (this.legend) {
                var that = this;
                on.once(this.legendTip, mouse.enter, function () {
                    var legendContent = new Legend({
                        mapServiceUrl: that.url,
                        layerId: that.layerIndex,
                        header: that.legendHeader || ''
                    });
                    legendContent.startup();

                    legendContent.on('loaded', function () {
                        $(that.legendTip).tooltip({
                            title: legendContent.domNode,
                            html: true,
                            placement: 'auto',
                            delay: config.popupDelay,
                            container: 'body'
                        });
                        $(that.legendTip).tooltip('show');
                    });
                });
            } else {
                domConstruct.destroy(this.legendTip);
            }

            this.setupConnections();

            this.inherited(arguments);
        },
        setupConnections: function () {
            // summary:
            //      wire events, and such
            console.log('app.mapControls.LayerItem::setupConnections', arguments);

            this.own(
                topic.subscribe(config.topics.toggleReferenceLayer, lang.hitch(this, 'onToggleReferenceLayerTopic')),
                topic.subscribe(config.topics.mapScaleChanged, lang.hitch(this, 'onMapScaleChange'))
            );
        },
        onToggleReferenceLayerTopic: function (layerItem, show) {
            // summary:
            //      callback for config.topics.toggleReferenceLayer
            //      updates the button state if the name matches this widget
            // layerItem: LayerItem
            // show: Boolean
            console.log('app.mapControls.LayerItems:onToggleReferenceLayerTopic', arguments);

            if (layerItem !== this &&
                layerItem.name === this.name &&
                this.checkbox.checked !== show &&
                !domClass.contains(layerItem.domNode, 'disabled')) {
                this.toggleBtn(show);
            }
        },
        onClick: function (evt) {
            // summary:
            //      the widget is clicked
            console.log('app.mapControls.LayerItem:onClick', arguments);

            if (!domClass.contains(this.domNode, 'disabled')) {
                var that = this;
                window.setTimeout(function () {
                    that.toggleLayer(that.checkbox.checked);
                }, 0);
            } else {
                if (evt && evt.preventDefault) {
                    evt.preventDefault();
                }
                evt.stopPropagation();
            }
        },
        toggleBtn: function (active) {
            // summary:
            //      toggle the button
            // active: Boolean
            console.log('app.mapControls::toggleBtn', arguments);

            this.checkbox.checked = active;
            domClass.toggle(this.domNode, 'active', active);
        },
        toggleLayer: function (show) {
            // summary:
            //      toggles the visibility of the layer associated with this widget
            // show: Boolean
            console.log('app.mapControlls:toggleLayer', arguments);

            topic.publish(config.topics.toggleReferenceLayer, this, show);
        },
        onMapScaleChange: function (newScale) {
            // summary:
            //      enable/disable the button if it has a min scale
            // newScale: Number
            console.log('app.mapControls.LayerItem:onMapScaleChange', arguments);

            if (this.minScale) {
                var disabled = newScale > this.minScale;
                domClass.toggle(this.domNode, 'disabled', disabled);
                this.toggleLayer(!disabled && domClass.contains(this.domNode, 'active'));
            }
        }
    });
});
