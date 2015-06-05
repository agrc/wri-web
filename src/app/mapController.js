define([
    'agrc/widgets/map/BaseMap',

    'app/config',
    'app/router',

    'dojo/_base/lang',
    'dojo/Deferred',
    'dojo/topic',
    'dojo/when',

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
    when,

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
            //      Sets up the map
            console.info('app/mapController/initMap', arguments);

            var that = this;
            that.map = new BaseMap(mapDiv, {
                showAttribution: false,
                defaultBaseMap: "Hybrid"
            });
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
            //      selects the feature layers appropriate for the current project ids
            // returns: Promise
            console.log('app/mapController:selectLayers', arguments);

            var def = new Deferred();
            var q = new Query();
            q.where = router.getProjectsWhereClause();
            if (q.where !== '1 = 1') {
                this.layers.forEach(function (lyr) {
                    lyr.selectFeatures(q);
                });
                var that = this;
                when(router.getProjectIdsExtent(), function (extent) {
                    if (extent === null) {
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
                        that.map.setExtent(extent, true);
                    }
                    def.resolve();
                });
            } else {
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
