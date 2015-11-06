require([
    'app/config',
    'app/helpers',

    'dojo/_base/lang'
], function (
    config,
    helpers,

    lang
) {
    describe('app/helpers', function () {
        describe('getGeometryTypeFromCategory', function () {
            var originalDomains;
            var originalFeatureTypesInTables;
            beforeEach(function () {
                originalDomains = lang.clone(config.domains);
                originalFeatureTypesInTables = lang.clone(config.featureTypesInTables);
            });
            afterEach(function () {
                config.domains = originalDomains;
                config.featureTypesInTables = originalFeatureTypesInTables;
            });
            it('returns the correct geometry type', function () {
                config.domains = {
                    featureType: [['Poly', 1], ['Point', 2]]
                };
                config.featureTypesInTables = {
                    1: 'POLY',
                    2: 'POINT'
                };

                expect(helpers.getGeometryTypeFromCategory('Poly')).toEqual('POLY');
                expect(helpers.getGeometryTypeFromCategory('Point')).toEqual('POINT');
            });
        });
    });
});
