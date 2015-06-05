define([
    'agrc/widgets/map/BaseMap',

    'app/router',

    'dojo/when'
], function (
    BaseMap,

    router,

    when
) {
    return {
        initMap: function (mapDiv) {
            // summary:
            //      Sets up the map
            console.info('mapController/initMap', arguments);

            when(router.getInitialExtent(), function (extent) {
                this.map = new BaseMap(mapDiv, {
                    showAttribution: false,
                    defaultBaseMap: "Hybrid",
                    extent: extent
                });
            });
        }
    };
});
