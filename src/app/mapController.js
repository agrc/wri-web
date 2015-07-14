define([
    'agrc/widgets/map/BaseMap',
    'agrc/widgets/map/BaseMapSelector',

    'app/config',
    'app/router',
    'app/graphicsUtils',
    'app/centroidController',
    'app/mapControls/CentroidSwitchButton',

    'dojo/_base/fx',
    'dojo/_base/lang',
    'dojo/Deferred',
    'dojo/promise/all',
    'dojo/when',
    'dojo/topic',

    'esri/dijit/HomeButton',
    'esri/dijit/Search',
    'esri/geometry/Extent',
    'esri/layers/FeatureLayer',
    'esri/tasks/query'
], function (
    BaseMap,
    BaseMapSelector,

    config,
    router,
    graphicsUtils,
    centroidController,
    CentroidSwitchButton,

    fx,
    lang,
    Deferred,
    all,
    when,
    topic,

    HomeButton,
    Search,
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
            homeButton.on('home', function () {
                router.setHash();
            });

            var search = new Search({
                enableButtonMode: true,
                enableSourcesMenu: true, // missing css or something for menu
                enableLabel: false,
                enableInfoWindow: false,
                showInfoWindowOnSelect: false,
                autoNavigate: false,
                autoSelect: true,
                enableHighlight: true,
                maxResults: 3,
                sources: [],
                map: this.map
            }).placeAt(this.map.root, 'last');

            var sources = config.supportLayers.filter(function (l) {
                return l.search;
            });
            sources.forEach(function (l) {
                l.featureLayer = new FeatureLayer(l.url);
                l.exactMatch = false;
                l.minCharacters = 3;
            });

            search.on('search-results', lang.hitch(this, function (result) {
                if (result && result.numResults === 1) {
                    var geometry = result.results[result.activeSourceIndex][0].feature.geometry;

                    if (geometry.type === 'point') {
                        this.map.centerAndZoom(geometry, config.scaleTrigger - 1);
                    } else {
                        this.map.setExtent(geometry.getExtent(), true);
                    }

                    var that = this;
                    setTimeout(function () {
                        // remove graphic after a period of time
                        fx.fadeOut({
                            node: search.highlightGraphic.getNode(),
                            onEnd: function () {
                                that.map.graphics.remove(search.highlightGraphic);
                            }}).play();
                    }, 3000);
                }
            }));

            search.set('sources', sources);

            this.childWidgets.push(selector);
            this.childWidgets.push(homeButton);
            this.childWidgets.push(centroidButton);
            this.childWidgets.push(search);

            // suspend base map layer until we get the initial extent
            // trying to save requests to the server
            this.baseLayer = this.map.getLayer(this.map.layerIds[0]);
            this.baseLayer.suspend();

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
            topic.subscribe(config.topics.map.setExtent, lang.hitch(this, 'setExtent'));
            topic.subscribe(config.topics.map.toggleAdjacent, lang.hitch(this, 'toggleAdjacent'));
            topic.subscribe(config.topics.map.setMap, lang.hitch(this, '_setMap'));
            topic.subscribe(config.topics.centroidController.updateVisibility, lang.hitch(this, 'updateCentroidVisibility'));

            this.map.on('extent-change', function (change) {
                topic.publish(config.topics.map.extentChanged, change);
            });
            this.map.on('mouse-drag-start', function (evt) {
                if (evt.shiftKey) {
                    topic.publish(config.topics.map.rubberBandZoom, true);
                }
            });
            this.map.on('mouse-drag-end', function (evt) {
                if (evt.shiftKey) {
                    topic.publish(config.topics.map.rubberBandZoom, false);
                }
            });
        },
        selectLayers: function (ids) {
            // summary:
            //      selects the feature layers based upon the current project ids
            // ids: [int] of project ids
            // returns: Promise
            console.log('app/mapController:selectLayers', arguments);

            if (!ids || ids.length === 0 || ids.length > 1) {
                // ids is null or has no project id's
                // load centroids and exploded
                // hide all other layers and clear all selections
                // zoom to full extent

                centroidController.enabled = true;

                when(centroidController.ensureLayersLoaded(), lang.hitch(this, function (result) {
                    if (result !== true) {
                        this.addLayers({
                            graphicsLayers: result.map(function (layers) {
                                return layers.layer;
                            }),
                            dynamicLayers: []
                        });
                    }

                    this.map.graphicsLayerIds.forEach(function (id) {
                        this.map.getLayer(id).setVisibility(false);
                    }, this);

                    when(centroidController.showFeaturesFor(router.getProjectsWhereClause()), lang.hitch(this,
                        function (extent) {
                            if (extent === null) {
                                // state of utah extent
                                extent = this.setExtent();
                            } else {
                                this.setExtent(extent);
                            }

                            this.baseLayer.resume();

                            this.updateCentroidVisibility();
                        }
                    ));
                }));
            } else {
                // single project view
                // load point, line, polygon
                // hide other layers and clear their selections
                // set selection on point, line, polygon
                // zoom to extent
                this.map.graphicsLayerIds.forEach(function (id) {
                    this.map.getLayer(id).setVisibility(false);
                }, this);

                var q = new Query();
                q.where = router.getProjectsWhereClause();

                centroidController.enabled = false;

                if (q.where === '1=1') {
                    return;
                }

                when(this.ensureProjectLayersAdded(), lang.hitch(this,
                    function () {
                        var deferreds = [];

                        [this.layers.poly, this.layers.line, this.layers.point].forEach(function (lyr) {
                            deferreds.push(lyr.selectFeatures(q));
                            lyr.setVisibility(true);
                        });

                        var that = this;
                        all(deferreds).then(function (graphics) {
                            if (graphics === null) {
                                // state of utah extent
                                that.setExtent();
                            } else {
                                var extent = graphicsUtils.unionGraphicsIntoExtent(graphics);
                                that.setExtent(extent);
                            }

                            that.baseLayer.resume();
                        });
                    })
                );
            }
        },
        ensureProjectLayersAdded: function () {
            // summary:
            //      Adds the layers to the map
            console.log('app/mapController:ensureProjectLayersAdded', arguments);

            if (this.layersLoaded) {
                return true;
            }

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

            this.layersLoaded = true;

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
        setExtent: function (extent) {
            // summary:
            //      sets the map extent
            // extent: esri Extent. if null use full extent
            console.log('app/mapController::setExtent', arguments);

            if (!extent) {
                extent = new Extent({
                    xmax: 696328,
                    xmin: 207131,
                    ymax: 4785283,
                    ymin: 3962431,
                    spatialReference: {
                        wkid: 26912
                    }
                });

                this.map.setExtent(extent, false);

                return extent;
            }

            this.map.setExtent(extent, true);

            return extent;
        },
        updateCentroidVisibility: function () {
            // summary:
            //      creates the extent event object and invokes the method
            // : {5:type or return: type}
            console.log('app/mapController::updateCentroidVisibility', arguments);

            var extent = {
                levelChange: true,
                extent: this.map.extent,
                lod:  {
                    level: this.map.getLevel()
                },
                delta: true
            };

            centroidController.updateLayerVisibilityFor(extent);
        },
        toggleAdjacent: function (enabled) {
            // summary:
            //      turns on the adjacent project features
            // enabled
            console.log('app/mapController::toggleAdjacent', arguments);

            if (enabled) {
                when(centroidController.ensureLayersLoaded(), lang.hitch(this, function (result) {
                    if (result !== true) {
                        this.addLayers({
                            graphicsLayers: result.map(function (layers) {
                                return layers.layer;
                            }),
                            dynamicLayers: []
                        });
                    }

                    centroidController.showAdjacentFeatures(router.getProjectsWhereClause({
                        negate: true
                    }));
                }));

                return;
            }

            Object.keys(centroidController.explodedLayer).forEach(function (key) {
                var layer = this.explodedLayer[key];

                layer.setVisibility(false);
            }, centroidController);
        },
        _setMap: function (obj) {
            // summary:
            //      calls setMap on the obj
            // obj
            console.log('app/mapController::_setMap', arguments);

            if (!obj.setMap) {
                return;
            }

            obj.setMap(this.map);
        },
        startup: function () {
            // summary:
            //      spin up and get everything set up
            console.log('app/mapController::startup', arguments);

            this.childWidgets.forEach(function (widget) {
                widget.startup();
            }, this);

            centroidController.startup();
        }
    };
});
