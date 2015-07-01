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
    Query
) {
    return {
        // layers: Object
        //      POINT, LINE & POLY layers
        layers: {},

        // lastSelectedGraphic: Graphic
        //      Used to unselect when next feature is selected
        lastSelectedGraphic: null,

        // lastSelectedOriginalSymbol: Symbol
        //      Used to reapply the original symbol to the last selected graphic
        lastSelectedOriginalSymbol: null,

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

            topic.subscribe(config.topics.projectIdsChanged, lang.hitch(this, 'selectLayers'));
            topic.subscribe(config.topics.featureSelected, lang.hitch(this, 'selectFeature'));
            topic.subscribe(config.topics.opacityChanged, lang.hitch(this, 'changeOpacity'));
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
                lyrs.forEach(function (lyr) {
                    lyr.clearSelection();
                });

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
        getGraphicById: function (featureId, layer) {
            // summary:
            //      description
            // featureId: Number
            // layer: String (point | line | poly)
            console.log('app/mapController:getGraphicById', arguments);

            var lyr = this.layers[layer];
            var graphic;
            lyr.graphics.some(function (g) {
                if (g.attributes.FeatureID === featureId) {
                    graphic = g;
                    return true;
                } else {
                    return false;
                }
            });

            return graphic;
        },
        selectFeature: function (data) {
            // summary:
            //      Changes the color of the passed in graphic and reverts any previous ones
            // data: Object
            console.log('app/mapController:selectFeature', arguments);

            var graphic = this.getGraphicById(data.featureId, data.origin);

            if (this.lastSelectedGraphic) {
                var resetSymbol = this.lastSelectedOriginalSymbol ||
                    lang.clone(this.layers[data.origin].renderer.getSymbol(this.lastSelectedGraphic));
                if (this.lastSelectedGraphic.symbol) {
                    resetSymbol.color.a = this.lastSelectedGraphic.symbol.color.a;
                }
                this.lastSelectedGraphic.setSymbol(resetSymbol);
            }

            var newSelectionSymbol = config.symbols.selected[data.origin];

            // persist any existing opacity to selection symbol
            if (graphic.symbol) {
                newSelectionSymbol = lang.clone(newSelectionSymbol);
                newSelectionSymbol.color.a = graphic.symbol.color.a;
            }

            // store so that we can reset these on next selection
            this.lastSelectedOriginalSymbol = lang.clone(graphic.symbol);
            this.lastSelectedGraphic = graphic;

            graphic.setSymbol(newSelectionSymbol);
            graphic.getDojoShape().moveToFront();
        },
        changeOpacity: function (newValue, origin, featureId) {
            // summary:
            //      Updates the opacity for the feature
            // newValue: Number
            //      new opacity
            // origin: String
            // featureId: String
            console.log('app/mapController:changeOpacity', arguments);

            var graphic = this.getGraphicById(featureId, origin);
            var symbol = lang.clone(graphic.symbol || this.layers[origin].renderer.getSymbol(graphic));
            symbol.color.a = newValue;
            graphic.setSymbol(symbol);
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
