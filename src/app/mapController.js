define([
    'agrc/widgets/map/BaseMap',
    'agrc/widgets/map/BaseMapSelector',

    'app/config',
    'app/router',
    'app/mapControls/CentroidSwitchButton',

    'dojo/_base/lang',
    'dojo/Deferred',
    'dojo/promise/all',
    'dojo/topic',

    'esri/dijit/HomeButton',
    'esri/geometry/Extent',
    'esri/layers/FeatureLayer',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/tasks/query'
], function (
    BaseMap,
    BaseMapSelector,

    config,
    router,

    CentroidSwitchButton,

    lang,
    Deferred,
    all,
    topic,

    HomeButton,
    Extent,
    FeatureLayer,
    SimpleMarkerSymbol,
    Query
) {
    return {
        // layers: Object
        //      POINT, LINE & POLY layers
        layers: {},

        // lastSelectedGraphic: Graphic
        //      Used to unselect when next feature is selected
        lastSelectedGraphic: null,

        initMap: function (mapDiv, toolbarNode) {
            // summary:
            //      Sets up the map and layers
            console.info('app/mapController/initMap', arguments);

            this.childWidgets = [];

            this.map = new BaseMap(mapDiv, {
                showAttribution: false,
                useDefaultBaseMap: false,
                sliderOrientation: 'horizontal'
            });

            var selector = new BaseMapSelector({
                map: this.map,
                id: 'tundra',
                position: 'TR',
                defaultThemeLabel: 'Hybrid'
            });

            var homeButton = new HomeButton({
                map: this.map,
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
            }).placeAt(toolbarNode, 'first');

            homeButton._css.home = 'home toolbar-item';

            var centroidButton = new CentroidSwitchButton({
            }).placeAt(toolbarNode, 'last');

            this.childWidgets.push(selector);
            this.childWidgets.push(homeButton);
            this.childWidgets.push(centroidButton);

            // suspend base map layer until we get the initial extent
            // trying to save requests to the server
            var baseLayer = this.map.getLayer(this.map.layerIds[0]);
            baseLayer.suspend();

            var that = this;
            this.addProjectViewLayers().then(function () {
                that.selectLayers().then(lang.hitch(baseLayer, 'resume'));
            });

            this.setupConnections();
        },
        setupConnections: function () {
            // summary:
            //      wire events, and such
            console.log('app/mapController::setupConnections', arguments);

            var that = this;

            topic.subscribe(config.topics.projectIdsChanged, lang.hitch(this, 'selectLayers'));
            topic.subscribe(config.topics.featureSelected, function (data) {
                that.lastSelectedGraphic = that.selectFeature(data, that.lastSelectedGraphic);
            });
            topic.subscribe(config.topics.layer.add, lang.hitch(this, 'addLayers'));
            this.map.on('extent-change', function (change) {
                topic.publish(config.topics.map.extentChange, change);
            });
        },
        selectLayers: function () {
            // summary:
            //      selects the feature layers based upon the current project ids
            // returns: Promise
            console.log('app/mapController:selectLayers', arguments);

            var def = new Deferred();
            var q = new Query();
            var lyrs = [this.layers.point, this.layers.line, this.layers.poly];

            q.where = router.getProjectsWhereClause();
            // don't show all features for feature layers
            if (q.where !== '1 = 1') {
                var deferreds = [];

                lyrs.forEach(function (lyr) {
                    deferreds.push(lyr.selectFeatures(q));
                });
                var that = this;
                all(deferreds).then(function (graphics) {
                    if (graphics === null) {
                        // state of utah extent
                        that.map.setExtent(new Extent({
                            xmax: 696328,
                            xmin: 207131,
                            ymax: 4785283,
                            ymin: 3962431,
                            spatialReference: {
                                wkid: 26912
                            }
                        }));
                    } else {
                        var extent = router.unionGraphicsIntoExtent(graphics);
                        that.map.setExtent(extent, true);
                    }
                    def.resolve();
                });
            } else {
                // TODO: show centroids
                def.resolve();
            }

            return def.promise;
        },
        addProjectViewLayers: function () {
            // summary:
            //      Adds the layers to the map
            console.log('app/mapController:addProjectViewLayers', arguments);

            var li = config.layerIndices;
            var deferreds = [];
            var typesLookup = {
                0: 'poly',
                1: 'line',
                2: 'point'
            };

            [li.poly, li.line, li.point].forEach(function (layerIndex, i) {
                var layer = new FeatureLayer(config.urls.mapService + '/' + layerIndex, {
                    mode: FeatureLayer.MODE_SELECTION,
                    id: typesLookup[i]
                });

                var deferred = new Deferred();

                layer.on('load', deferred.resolve);

                deferreds.push(deferred);
                this.layers[typesLookup[i]] = layer;
            }, this);

            var lyrs = this.layers;
            this.map.addLayers([lyrs.poly, lyrs.line, lyrs.point]);

            return all(deferreds);
        },
        selectFeature: function (data, lastGraphic) {
            // summary:
            //      description
            // data: Object
            // lastGraphic: Object (optional)
            // returns: Object[]
            console.log('app/mapController:selectFeature', arguments);

            if (lastGraphic) {
                lastGraphic.setSymbol(null);
            }

            var lyr = this.layers[data.origin];
            var graphic;
            lyr.graphics.some(function (g) {
                if (g.attributes.FeatureID === data.featureId) {
                    graphic = g;
                    return true;
                } else {
                    return false;
                }
            });
            graphic.setSymbol(new SimpleMarkerSymbol(config.symbols.selected[data.origin]));
            graphic.getDojoShape().moveToFront();

            return graphic;
        },
        addLayers: function (layers) {
            // summary:
            //      toggles layers in the map
            // layers: { graphicsLayers: [], dynamicLayers: [] }
            console.log('app/mapController::addLayers', arguments);

            var loaded = false;
            layers.graphicsLayers.forEach(function (layer) {
                loaded = this.map.graphicsLayerIds.some(function (id) {
                    return id === layer.id;
                }, this);

                if (!loaded) {
                    this.map.addLayer(layer);
                }
            }, this);

            layers.dynamicLayers.forEach(function (layer) {
                loaded = this.map.layerIds.some(function (id) {
                    return id === layer.id;
                }, this);

                if (!loaded) {
                    this.map.addLayer(layer);
                }
            }, this);
        },
        startup: function () {
            // summary:
            //      spin up and get everything set up
            console.log('app/mapController::startup', arguments);

            this.childWidgets.forEach(function (widget) {
                widget.startup();
            }, this);
        }
    };
});
