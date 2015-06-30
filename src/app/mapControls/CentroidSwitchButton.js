define([
    'app/config',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/_base/declare',
    'dojo/dom-class',
    'dojo/topic',
    'dojo/text!app/mapControls/templates/CentroidSwitchButton.html'
], function (
    config,

    _TemplatedMixin,
    _WidgetBase,

    declare,
    domClass,
    topic,
    template
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      swaps centroids into projects and visa versa
        templateString: template,
        baseClass: 'centroid-switch-button',

        // Properties to be sent into constructor

        toggle: function (e) {
            // summary:
            //      wire events, and such
            console.log('app.mapControls.CentroidSwitchButton::toggle', arguments);

            domClass.toggle(e.target, 'toggle');
            var hasClass = domClass.contains(e.target, 'toggle');

            topic.publish(config.topics.map.toggleCentroids, hasClass);
        }
    });
});
