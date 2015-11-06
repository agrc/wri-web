define([
    'app/config'
], function (
    config
) {
    return {
        getGeometryTypeFromCategory: function (category) {
            // summary:
            //      returns the geometry type for the specified category
            // category: String
            console.log('app.helpers:getGeometryTypeFromCategory', arguments);

            var categoryNum = config.domains.featureType.filter(function (t) {
                return t[0] === category;
            })[0][1];
            return config.featureTypesInTables[categoryNum];
        }
    };
});
