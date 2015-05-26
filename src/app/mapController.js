define([
    'agrc/widgets/map/BaseMap'
], function (
    BaseMap
) {
    return {
        initMap: function (mapDiv) {
            // summary:
            //      Sets up the map
            console.info('app.App::initMap', arguments);

            this.map = new BaseMap(mapDiv, {
                showAttribution: false,
                defaultBaseMap: "Hybrid"
            });
        }
    };
});
