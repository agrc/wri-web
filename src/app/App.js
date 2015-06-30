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
    'dojo/text!app/templates/App.html',

    'esri/dijit/HomeButton',
    'esri/geometry/Extent'
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
    template,

    HomeButton,
    Extent
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

            this.inherited(arguments);
        },
        postCreate: function () {
            // summary:
            //      Fires when
            console.log('app.App::postCreate', arguments);

            // this.childWidgets.push(
            // );

            this.inherited(arguments);

            mapController.initMap(this.mapDiv);

            var homeBtn = new HomeButton({
                map: mapController.map,

                // hard-wire state of utah extent in case the
                // initial page load is not utah
                extent: new Extent({
                    xmax: 696328,
                    xmin: 207131,
                    ymax: 4785283,
                    ymin: 3962431,
                    spatialReference: {
                        wkid: 26912
                    }
                })
            }, this.homeButtonDiv);

            this.projectContainer = new ProjectContainer({

            }, this.projectContainerNode);

            this.childWidgets.push(homeBtn);
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

            var that = this;
            array.forEach(this.childWidgets, function (widget) {
                that.own(widget);
                widget.startup();
            });

            router.startup();
            centroidSwitch.startup();

            this.inherited(arguments);
        }
    });
});
