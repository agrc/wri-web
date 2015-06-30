define([
    './config',

    'app/centroidSwitch',
    'app/mapController',
    'app/project/ProjectContainer',
    'app/router',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/_base/array',
    'dojo/_base/declare',
    'dojo/text!app/templates/App.html'
], function (
    config,

    centroidSwitch,
    mapController,
    ProjectContainer,
    router,

    _TemplatedMixin,
    _WidgetBase,
    _WidgetsInTemplateMixin,

    array,
    declare,
    template
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        // summary:
        //      The main widget for the app

        widgetsInTemplate: true,
        templateString: template,
        baseClass: 'app',

        // childWidgets: Object[]
        //      container for holding custom child widgets
        childWidgets: null,

        constructor: function () {
            // summary:
            //      first function to fire after page loads
            console.info('app.App::constructor', arguments);

            config.app = this;
            this.childWidgets = [];
            this.childObjects = [mapController, router, centroidSwitch];

            this.inherited(arguments);
        },
        postCreate: function () {
            // summary:
            //      Fires when
            console.log('app.App::postCreate', arguments);

            this.inherited(arguments);

            mapController.initMap(this.mapDiv, this.toolbarNode);

            this.projectContainer = new ProjectContainer({
            }, this.projectContainerNode);

            this.childWidgets.push(this.projectContainer);

            this.setupConnections();
        },
        setupConnections: function () {
            // summary:
            //      wire events, and such
            console.log('app.App::setupConnections', arguments);

        },
        startup: function () {
            // summary:
            //      Fires after postCreate when all of the child widgets are finished laying out.
            console.log('app.App::startup', arguments);

            this.childWidgets.forEach(function (widget) {
                this.own(widget);
                widget.startup();
            }, this);

            this.childObjects.forEach(function (object) {
                object.startup();
            }, this);

            this.inherited(arguments);
        }
    });
});
