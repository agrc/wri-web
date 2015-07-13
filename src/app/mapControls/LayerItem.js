define([
    'app/config',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/dom-class',
    'dojo/topic',

    'dojo/text!app/mapControls/templates/LayerItem.html',
    'bootstrap-stylus/js/button'
], function (
    config,

    _TemplatedMixin,
    _WidgetBase,

    declare,
    lang,
    domClass,
    topic,
    template
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

            this.own(
                topic.subscribe(config.topics.toggleReferenceLayer, lang.hitch(this, 'onToggleReferenceLayerTopic'))
            );
        },
        onToggleReferenceLayerTopic: function (name, show) {
            // summary:
            //      callback for config.topics.toggleReferenceLayer
            //      updates the button state if the name matches this widget
            // name: String
            // show: Boolean
            console.log('app.mapControls.LayerItems:onToggleReferenceLayerTopic', arguments);

            if (name === this.name && this.checkbox.checked !== show) {
                this.toggleBtn(show);
            }
        },
        onClick: function () {
            // summary:
            //      the widget is clicked
            console.log('app.mapControls.LayerItem:onClick', arguments);

            var that = this;
            window.setTimeout(function () {
                that.toggleLayer(that.checkbox.checked);
            }, 0);
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

            topic.publish(config.topics.toggleReferenceLayer, this.name, show);
        }
    });
});
