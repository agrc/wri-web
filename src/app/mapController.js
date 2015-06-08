define([
    'agrc/widgets/map/BaseMap',

    'app/config',
    'app/router',

    'dojo/_base/lang',
    'dojo/Deferred',
    'dojo/topic',
    'dojo/promise/all',

    'esri/geometry/Extent',
    'esri/layers/FeatureLayer',
    'esri/tasks/query'
], function (
    BaseMap,

    config,
    router,

    lang,
    Deferred,
    topic,
    all,

    Extent,
    FeatureLayer,
    Query
) {
    return {
        // layers: FeatureLayer[]
        //      POINT, LINE & POLY layers
        layers: [],

        initMap: function (mapDiv) {
            // summary:
            //      Sets up the map and layers
            console.info('app/mapController/initMap', arguments);

            var that = this;
            that.map = new BaseMap(mapDiv, {
                showAttribution: false,
                defaultBaseMap: "Hybrid"
            });

            // suspend base map layer until we get the initial extent
            // trying to save requests to the server
            var baseLayer = that.map.getLayer(that.map.layerIds[0]);
            baseLayer.suspend();

            that.addLayers();

            that.map.on('load', function () {
                that.selectLayers().then(lang.hitch(baseLayer, 'resume'));
            });

            topic.subscribe(config.topics.projectIdsChanged, lang.hitch(that, 'selectLayers'));
        },
        selectLayers: function () {
            // summary:
            //      selects the feature layers based upon the current project ids
            // returns: Promise
            console.log('app/mapController:selectLayers', arguments);

            var def = new Deferred();
            var q = new Query();

            q.where = router.getProjectsWhereClause();
            // don't show all features for feature layers
            if (q.where !== '1 = 1') {
                var deferreds = [];

                this.layers.forEach(function (lyr) {
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
            [li.poly, li.line, li.point].forEach(function (i) {
                that.layers.push(new FeatureLayer(config.urls.mapService + '/' + i, {
                    mode: FeatureLayer.MODE_SELECTION
                }));
            });

            this.map.addLayers(this.layers);
        }
    };
});
