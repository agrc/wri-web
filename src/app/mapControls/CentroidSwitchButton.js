define([
    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/_base/declare',
    'dojo/text!app/mapControls/templates/CentroidSwitchButton.html',

    'xstyle/css!app/mapControls/resources/CentroidSwitchButton.css'
], function (
    _TemplatedMixin,
    _WidgetBase,

    declare,
    template
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        // description:
        //      swaps centroids into projects and visa versa
        templateString: template,
        baseClass: 'centroid-switch-button',

        // Properties to be sent into constructor

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            console.log('app.mapControls.CentroidSwitchButton::postCreate', arguments);

            this.setupConnections();

            this.inherited(arguments);
        },
        setupConnections: function () {
            // summary:
            //      wire events, and such
            console.log('app.mapControls.CentroidSwitchButton::setupConnections', arguments);

        }
    });
});
