define([
    'app/config',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/dom-class',
    'dojo/topic',
    'dojo/text!app/mapControls/templates/CentroidSwitchButton.html'
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
        //      swaps centroids into projects and visa versa
        templateString: template,
        baseClass: 'centroid-switch-button',

        // visible: Boolean
        //      override for showing/hiding the button
        visible: true,

        // Properties to be sent into constructor
        postCreate: function () {
            // summary:
            //      Fires when
            console.log('app.mapControls.CentroidSwitchButton::postCreate', arguments);

            this.inherited(arguments);

            this.setupConnections();
        },
        setupConnections: function () {
            // summary:
            //      wire events, and such
            console.log('app.mapControls.CentroidSwitchButton::setupConnections', arguments);

            this.own(
                topic.subscribe(config.topics.projectIdsChanged,
                     lang.hitch(this, 'toggleSelf')),
                topic.subscribe(config.topics.map.extentChanged, lang.hitch(this, '_onExtentChanged'))
            );
        },
        toggleSelf: function (ids) {
            // summary:
            //      determines whether widget should be displayed or not
            // ids: {5:type or return: type}
            console.log('app.mapControls.CentroidSwitchButton::toggleSelf', arguments);

            var hide = ids && ids.length === 1;
            domClass.toggle(this.domNode, 'hidden', hide);
            this.visible = !hide;
        },
        toggleCentroids: function (e) {
            // summary:
            //      turns on and off the centroids
            console.log('app.mapControls.CentroidSwitchButton::toggleCentroids', arguments);

            domClass.toggle(e.target, 'toggle');

            topic.publish(config.topics.map.toggleCentroids, domClass.contains(e.target, 'toggle'));
        },
        _onExtentChanged: function (extent) {
            // summary:
            //      hides and shows the button based on map extent
            // extent
            console.log('app.mapControls.CentroidSwitchButton::_onExtentChanged', arguments);

            this.level = extent.lod.level;

            var show = this.visible && extent.lod.level < config.scaleTrigger;
            domClass.toggle(this.domNode, 'hidden', !show);
        }
    });
});
