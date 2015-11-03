require([
    'app/config',

    'dojo/_base/lang'
], function (
    config,

    lang
) {
    describe('app/config', function () {
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

                expect(config.getGeometryTypeFromCategory('Poly')).toEqual('POLY');
                expect(config.getGeometryTypeFromCategory('Point')).toEqual('POINT');
            });
        });
    });
});
