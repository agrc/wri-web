define([
    'agrc/widgets/map/BaseMap',
    'agrc/widgets/map/BaseMapSelector',

    'app/config',
    'app/router',

    'dojo/_base/lang',
    'dojo/Deferred',
    'dojo/promise/all',
    'dojo/topic',

    'esri/geometry/Extent',
    'esri/layers/FeatureLayer',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/tasks/query'
], function (
    BaseMap,
    BaseMapSelector,

    config,
    router,

    lang,
    Deferred,
    all,
    topic,

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

        initMap: function (mapDiv) {
            // summary:
            //      Sets up the map and layers
            console.info('app/mapController/initMap', arguments);

            this.map = new BaseMap(mapDiv, {
                showAttribution: false,
                useDefaultBaseMap: false,
                sliderOrientation: 'horizontal'
            });

            new BaseMapSelector({
                map: this.map,
                id: 'tundra',
                position: 'TR',
                defaultThemeLabel: 'Hybrid'
            });

            // suspend base map layer until we get the initial extent
            // trying to save requests to the server
            var baseLayer = this.map.getLayer(this.map.layerIds[0]);
            baseLayer.suspend();

            var that = this;
            this.addLayers().then(function () {
                that.selectLayers().then(lang.hitch(baseLayer, 'resume'));
            });

            topic.subscribe(config.topics.projectIdsChanged, lang.hitch(this, 'selectLayers'));
            topic.subscribe(config.topics.featureSelected, function (data) {
                that.lastSelectedGraphic = that.selectFeature(data, that.lastSelectedGraphic);
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
        addLayers: function () {
            // summary:
            //      Adds the layers to the map
            console.log('app/mapController:addLayers', arguments);

            var li = config.layerIndices;
            var that = this;
            var deferreds = [];
            var typesLookup = {
                0: 'poly',
                1: 'line',
                2: 'point'
            };

            [li.poly, li.line, li.point].forEach(function (index, i) {
                var layer = new FeatureLayer(config.urls.mapService + '/' + index, {
                    mode: FeatureLayer.MODE_SELECTION
                });

                var deferred = new Deferred();

                layer.on('load', function () {
                    deferred.resolve();
                });

                deferreds.push(deferred);
                that.layers[typesLookup[i]] = layer;
            });

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

            return graphic;
        }
    };
});
