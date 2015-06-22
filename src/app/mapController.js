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
            var deferreds = [];

            [li.poly, li.line, li.point].forEach(function (i) {
                var layer = new FeatureLayer(config.urls.mapService + '/' + i, {
                    mode: FeatureLayer.MODE_SELECTION
                });

                var deferred = new Deferred();

                layer.on('load', function () {
                    deferred.resolve();
                });

                deferreds.push(deferred);
                that.layers.push(layer);
            });

            this.map.addLayers(this.layers);

            return all(deferreds);
        }
    };
});
