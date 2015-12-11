define([
    'agrc/widgets/map/BaseMap',

    'app/centroidController',
    'app/config',
    'app/graphicsUtils',
    'app/mapControls/CentroidSwitchButton',
    'app/mapControls/DownloadButton',
    'app/mapControls/NonWriButton',
    'app/mapControls/PrintButton',
    'app/router',

    'dojo/aspect',
    'dojo/Deferred',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/promise/all',
    'dojo/topic',
    'dojo/when',
    'dojo/_base/fx',
    'dojo/_base/lang',

    'esri/dijit/HomeButton',
    'esri/dijit/Search',
    'esri/geometry/Point',
    'esri/graphic',
    'esri/InfoTemplate',
    'esri/layers/ArcGISDynamicMapServiceLayer',
    'esri/layers/ArcGISTiledMapServiceLayer',
    'esri/layers/FeatureLayer',
    'esri/renderers/SimpleRenderer',
    'esri/tasks/query',

    'layer-selector'
], function (
    BaseMap,

    centroidController,
    config,
    graphicsUtils,
    CentroidSwitchButton,
    DownloadButton,
    NonWriButton,
    PrintButton,
    router,

    aspect,
    Deferred,
    domAttr,
    domClass,
    all,
    topic,
    when,
    fx,
    lang,

    HomeButton,
    Search,
    Point,
    Graphic,
    InfoTemplate,
    ArcGISDynamicMapServiceLayer,
    ArcGISTiledMapServiceLayer,
    FeatureLayer,
    SimpleRenderer,
    Query,

    LayerSelector
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

        // referenceLayers: Object
        //      Container to store reference layer objects
        referenceLayers: {},

        // showReferenceLayerLabels: Boolean
        showReferenceLayerLabels: true,

        // isEditing: Boolean
        //      Used to disabled feature selection during feature editing
        isEditing: false,

        // snappingLayers: Object
        //      Stores references to the layers available for snapping
        snappingLayers: {
            project: [],
            adjacent: [],
            land: []
        },

        // activeSnappingLayers: Object
        //      Stores the snapping state of all of the snapping layers
        activeSnappingLayers: {
            project: false,
            adjacent: false,
            land: false
        },

        initMap: function (mapDiv, toolbarNode) {
            // summary:
            //      Sets up the map and layers
            console.info('app/mapController/initMap', arguments);

            var that = this;

            this.childWidgets = [];

            this.map = new BaseMap(mapDiv, {
                showAttribution: false,
                useDefaultBaseMap: false,
                sliderOrientation: 'horizontal',
                extent: config.defaultExtent
            });

            this.layerSelector = new LayerSelector({
                map: this.map,
                quadWord: config.quadWord,
                baseLayers: ['Lite', 'Hybrid', 'Terrain', 'Topo', 'Color IR'],
                overlays: ['Overlay']
            });

            this.map.on('load', function () {
                that.map.disableDoubleClickZoom();
                that.map.on('extent-change', function (change) {
                    topic.publish(config.topics.map.extentChanged, change);
                });
                that.map.on('mouse-drag-start', function (evt) {
                    if (evt.shiftKey) {
                        topic.publish(config.topics.map.rubberBandZoom, true);
                    }
                });
                that.map.on('mouse-drag-end', function (evt) {
                    if (evt.shiftKey) {
                        topic.publish(config.topics.map.rubberBandZoom, false);
                    }
                });
                that.map.on('click', function (evt) {
                    if (!evt.graphic && !that.isEditing) {
                        that.clearSelectedFeature();
                    }
                });
                var btn = that.map.addButton(that.map.buttons.back, {
                    placeAt: toolbarNode
                });
                domClass.add(btn, 'toolbar-item');
                domAttr.set(btn, 'title', 'Previous Extent');

                btn = that.map.addButton(that.map.buttons.forward, {
                    placeAt: toolbarNode
                });
                domClass.add(btn, 'toolbar-item');
                domAttr.set(btn, 'title', 'Next Extent');
            });

            this.map.on('zoom-end', function () {
                topic.publish(config.topics.mapScaleChanged, that.map.getScale());
            });

            var homeButton = new HomeButton({
                map: this.map,
                // hard-wire state of utah extent in case the
                // initial page load is not utah
                extent: config.defaultExtent
            }).placeAt(toolbarNode);

            domClass.add(homeButton.domNode, 'pull-left');

            var centroidButton = new CentroidSwitchButton({}).placeAt(toolbarNode, 'last');
            var printButton = new PrintButton({}).placeAt(toolbarNode, 'last');
            var nonWriButton = new NonWriButton({}).placeAt(toolbarNode, 'last');
            var downloadButton = new DownloadButton({}).placeAt(toolbarNode, 'last');

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
                var url = l.url;
                if (l.layerIndex) {
                    url += '/' + l.layerIndex;
                }

                l.featureLayer = new FeatureLayer(url);
                l.exactMatch = false;
                l.minCharacters = l.minCharacters || 3;
            });

            search.on('search-results', lang.hitch(this, function (result) {
                if (result && result.numResults === 1) {
                    var geometry = result.results[result.activeSourceIndex][0].feature.geometry;

                    if (geometry.type === 'point') {
                        this.map.centerAndZoom(geometry, config.scaleTrigger - 1);
                    } else {
                        this.map.setExtent(geometry.getExtent(), true);
                    }

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

            this.childWidgets = this.childWidgets.concat([
                homeButton,
                printButton,
                centroidButton,
                search,
                nonWriButton,
                downloadButton,
                this.layerSelector
            ]);

            // suspend base map layers until we get the initial extent
            // trying to save requests to the server
            this.toggleBaseLayers('suspend');

            this.setupConnections();
        },
        setupConnections: function () {
            // summary:
            //      wire events, and such
            console.log('app/mapController::setupConnections', arguments);

            var that = this;
            var onEditingChange = function (start) {
                domClass.toggle(that.map.root, 'drawing', start);
                that.isEditing = start;
            };
            topic.subscribe(config.topics.centroidController.updateVisibility, lang.hitch(this, 'updateCentroidVisibility'));

            topic.subscribe(config.topics.feature.createFeature, function () {
                that.clearSelectedFeature();
                onEditingChange(true);
            });
            topic.subscribe(config.topics.feature.startEditing, lang.partial(onEditingChange, true));

            topic.subscribe(config.topics.feature.finishEditingCreating, lang.partial(onEditingChange, false));

            topic.subscribe(config.topics.featureSelected, lang.hitch(this, 'selectFeature'));
            topic.subscribe(config.topics.layer.add, lang.hitch(this, 'addLayers'));
            topic.subscribe(config.topics.map.setExtent, lang.hitch(this, 'setExtent'));
            topic.subscribe(config.topics.map.setMap, lang.hitch(this, '_setMap'));
            topic.subscribe(config.topics.map.toggleAdjacent, lang.hitch(this, 'toggleAdjacent'));
            topic.subscribe(config.topics.map.toggleWriProjects, lang.hitch(this, 'toggleProjectsFundedByWri'));
            topic.subscribe(config.topics.opacityChanged, lang.hitch(this, 'changeOpacity'));
            topic.subscribe(config.topics.projectIdsChanged, lang.hitch(this, 'selectLayers'));
            topic.subscribe(config.topics.toggleReferenceLayer, lang.hitch(this, 'toggleReferenceLayer'));
            topic.subscribe(config.topics.toggleReferenceLayerLabels, lang.hitch(this, 'toggleReferenceLayerLabels'));
            topic.subscribe(config.topics.toggleSnapping, lang.hitch(this, 'toggleSnapping'));
            topic.subscribe(config.topics.feature.drawEditComplete, function () {
                if (that.snappingLayers.land[0]) {
                    that.snappingLayers.land[0].hide();
                }
            });
            topic.subscribe(config.topics.feature.startDrawing, function () {
                if (that.snappingLayers.land[0]) {
                    that.snappingLayers.land[0].setVisibility(that.activeSnappingLayers.land);
                }
            });
        },
        toggleSnapping: function (token, enable) {
            // summary:
            //      toggles snapping on the map
            // token: String (project | adjacent | land)
            //      The name of the layer to toggle
            // enable: Boolean
            console.log('app.mapController:toggleSnapping', arguments);

            if (!this.map.snappingManager) {
                this.map.enableSnapping({alwaysSnap: true});
                aspect.before(this.map.snappingManager, '_extractPointsAndLines', function (features, options) {
                    // explode multipoints
                    var newFeatures = [];
                    features.forEach(function (f) {
                        if (f.geometry.type === 'multipoint') {
                            f.geometry.points.forEach(function (coords) {
                                newFeatures.push(new Graphic(new Point(coords, f.geometry.spatialReference)));
                            });
                        } else {
                            newFeatures.push(f);
                        }
                    });

                    return [newFeatures, options];
                });
            }

            this.activeSnappingLayers[token] = enable;

            if (token === 'land') {
                if (!this.snappingLayers[token][0]) {
                    var landLayer = new FeatureLayer(config.urls.landOwnership);
                    landLayer.setRenderer(new SimpleRenderer(config.symbols.empty));
                    this.map.addLayer(landLayer);
                    this.snappingLayers[token] = [landLayer];
                } else {
                    this.snappingLayers[token][0].setVisibility(enable);
                }
            }

            var layerInfos = [];
            Object.keys(this.activeSnappingLayers).forEach(function getLayer(key) {
                if (this.activeSnappingLayers[key]) {
                    layerInfos = layerInfos.concat(this.snappingLayers[key].map(function getLayerInfo(layer) {
                        return {layer: layer};
                    }));
                }
            }, this);

            this.map.snappingManager.setLayerInfos(layerInfos);
        },
        selectLayers: function (ids) {
            // summary:
            //      selects the feature layers based upon the current project ids
            // ids: [int] of project ids
            // returns: Promise
            console.log('app/mapController:selectLayers', arguments);

            // so that reference layer buttons get disabled for min scales
            topic.publish(config.topics.mapScaleChanged, this.map.getScale());

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

                    this._resetAdjacentProjectFilters();

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

                            this.toggleBaseLayers('resume');

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

                this._resetAdjacentProjectFilters();

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

                            that.toggleBaseLayers('resume');
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
                var layer = new FeatureLayer(config.urls.featuresService + '/' + layerIndex, {
                    mode: FeatureLayer.MODE_SELECTION,
                    outFields: [config.fieldNames.FeatureID],
                    id: typesLookup[i]
                });

                var deferred = new Deferred();
                var that = this;

                layer.on('load', deferred.resolve);
                layer.on('click', function (evt) {
                    if (!that.isEditing) {
                        topic.publish(config.topics.map.featureSelected, {
                            featureId: evt.graphic.attributes[config.fieldNames.FeatureID],
                            origin: typesLookup[i]
                        });
                    }
                });

                deferreds.push(deferred);
                this.layers[typesLookup[i]] = layer;
                this.snappingLayers.project.push(layer);
            }, this);

            var lyrs = this.layers;
            var layerList = [lyrs.poly, lyrs.line, lyrs.point];
            this.map.addLayers(layerList);

            layerList.forEach(function (layer) {
                this.map.addLoaderToLayer(layer);
            }, this);

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

            this.clearSelectedFeature();

            var newSelectionSymbol = config.symbols.selected[data.origin];

            // persist any existing opacity to selection symbol
            if (graphic) {
                if (graphic.symbol) {
                    newSelectionSymbol = lang.clone(newSelectionSymbol);
                    newSelectionSymbol.color.a = graphic.symbol.color.a;
                }

                // store so that we can reset these on next selection
                this.lastSelectedOriginalSymbol = lang.clone(graphic.symbol ||
                    this.layers[data.origin].renderer.getSymbol(graphic));
                this.lastSelectedGraphic = graphic;

                graphic.setSymbol(newSelectionSymbol);
                var shape = graphic.getDojoShape();
                if (shape) {
                    shape.moveToFront();
                }
            }
        },
        clearSelectedFeature: function () {
            // summary:
            //      resets the symbol of the previously selected feature
            console.log('app.mapController:clearSelectedFeature', arguments);

            if (this.lastSelectedGraphic) {
                var resetSymbol = this.lastSelectedOriginalSymbol;
                if (this.lastSelectedGraphic.symbol) {
                    resetSymbol.color.a = this.lastSelectedGraphic.symbol.color.a;
                }
                this.lastSelectedGraphic.setSymbol(resetSymbol);
            }

            topic.publish(config.topics.selectionCleared);
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
                    this.map.addLoaderToLayer(layer);
                }
            }, this);

            layers.dynamicLayers.forEach(function (layer) {
                loaded = this.map.layerIds.some(function (id) {
                    return id === layer.id;
                }, this);

                if (!loaded) {
                    this.map.addLayer(layer);
                    this.map.addLoaderToLayer(layer);
                }
            }, this);
        },
        setExtent: function (extent) {
            // summary:
            //      sets the map extent
            // extent: esri Extent. if null use full extent
            console.log('app/mapController::setExtent', arguments);

            if (!extent) {
                extent = config.defaultExtent;

                this.map.setExtent(extent, false);
            } else if (extent.type && extent.type === 'point') {
                // extent is actually a point geometry (see CreateEditFeature:onGeometryDefined)
                this.map.centerAndZoom(extent, config.centerAndZoomLevel);
            } else if (!extent.getWidth() && !extent.getHeight()) {
                // we are looking at the extent of a point
                this.map.centerAndZoom(new Point(extent.xmin, extent.ymin, this.map.spatialReference),
                    config.centerAndZoomLevel);
            } else {
                this.map.setExtent(extent, true);
            }

            return extent;
        },
        updateCentroidVisibility: function () {
            // summary:
            //      creates the extent event object and invokes the method
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
                layer.getNode().setAttribute('class', '');
                layer.setVisibility(false);
                layer.setDefinitionExpression('');
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
        _resetAdjacentProjectFilters: function () {
            // summary:
            //      removes any definition expression
            //      removes any classes to change style
            console.log('app.mapController:_resetAdjacentProjectFilters', arguments);

            Object.keys(centroidController.explodedLayer).forEach(function (key) {
                var layer = this.explodedLayer[key];
                if (layer.getNode()) {
                    layer.getNode().removeAttribute('class');
                }
                layer.setVisibility(false);
                layer.setDefinitionExpression('');
            }, centroidController);
        },
        startup: function () {
            // summary:
            //      spin up and get everything set up
            console.log('app/mapController::startup', arguments);

            this.childWidgets.forEach(function (widget) {
                widget.startup();
            }, this);

            centroidController.startup();
        },
        toggleReferenceLayer: function (layerItem, show) {
            // summary:
            //      creates and toggles reference layer
            // layerItem: LayerItem
            // show: Boolean
            console.log('app.mapController:toggleReferenceLayer', arguments);

            var lyr;
            var that = this;
            if (!this.referenceLayers[layerItem.name]) {
                var layerTypes = {
                    dynamic: {
                        'class': ArcGISDynamicMapServiceLayer,
                        options: {opacity: config.referenceLayerOpacity}
                    },
                    cached: {
                        'class': ArcGISTiledMapServiceLayer,
                        options: {}
                    },
                    range: {
                        'class': FeatureLayer,
                        options: {
                            outFields: [config.fieldNames.GlobalID, config.fieldNames.STUDY_NAME],
                            infoTemplate: new InfoTemplate(
                                '${' + config.fieldNames.STUDY_NAME + '}',
                                '<a href="' + config.urls.rangeTrendApp + '" target="blank">Range Trend App</a>'
                            )
                        }
                    }
                };
                var layerType = layerTypes[layerItem.type];
                lyr = new layerType['class'](layerItem.url, layerType.options);
                if (layerItem.type === 'dynamic') {
                    var vLayers = [layerItem.layerIndex];
                    if (layerItem.labelsIndex && this.showReferenceLayerLabels) {
                        vLayers.push(layerItem.labelsIndex);
                    }
                    lyr.setVisibleLayers(vLayers);
                }
                lyr.on('load', function () {
                    that.map.addLayer(lyr);
                    that.map.addLoaderToLayer(lyr);
                });
                layerItem.layer = lyr;
                this.referenceLayers[layerItem.name] = layerItem;
            } else {
                lyr = this.referenceLayers[layerItem.name].layer;
            }

            lyr.setVisibility(show);
        },
        toggleReferenceLayerLabels: function (show) {
            // summary:
            //      toggles the labels for the visible reference layers
            // show: Boolean
            console.log('app.mapController:toggleReferenceLayerLabels', arguments);

            for (var layerName in this.referenceLayers) {
                if (this.referenceLayers.hasOwnProperty(layerName)) {
                    var layerItem = this.referenceLayers[layerName];
                    if (layerItem.type === 'dynamic') {
                        var vLayers = [layerItem.layerIndex];
                        if (show) {
                            vLayers.push(layerItem.labelsIndex);
                        }
                        layerItem.layer.setVisibleLayers(vLayers);
                    }
                }
            }

            this.showReferenceLayerLabels = show;
        },
        toggleBaseLayers: function (action) {
            // summary:
            //      suspends or resumes group layers
            // action: String (suspend | resume)
            console.log('app.mapController:toggleBaseLayers', arguments);

            var visibleLayers = this.layerSelector.get('visibleLayers');
            if (visibleLayers && visibleLayers.length > 0) {
                visibleLayers.forEach(function (l) {
                    l[action]();
                });
            }
        },
        toggleProjectsFundedByWri: function (hide) {
            // summary:
            //      turn on or off projects/features without uwri as a funding sources
            // hide bool
            console.log('app.mapController:toggleProjectsFundedByWri', arguments);

            topic.publish(config.topics.filterQueryChanged, {
                nonWriProjectFilter: hide ? 'Project_ID in (SELECT Project_ID from PROJECTCATEGORYFUNDING funding WHERE funding.CategoryFundingID=1)' : undefined
            });
        }
    };
});
