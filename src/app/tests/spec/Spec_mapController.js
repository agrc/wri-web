require([
    'app/mapController'
],

function (
    mapController
    ) {
    describe('app/mapController', function () {
        describe('selectFeature', function () {
            var data;
            var setSymbolSpy;
            var g = {
                attributes: {
                    FeatureID: 1139
                }
            };
            beforeEach(function () {
                data = {
                    featureId: 1139,
                    origin: 'point'
                };
                g.setSymbol = setSymbolSpy = jasmine.createSpy('setSymbol');
                mapController.layers.point = {
                    graphics: [g]
                };
            });
            it('unselects the last graphic', function () {
                var lastGraphic = {
                    setSymbol: jasmine.createSpy('setSymbol')
                };

                mapController.selectFeature(data, lastGraphic);

                expect(lastGraphic.setSymbol).toHaveBeenCalledWith(null);
            });
            it('sets the selection graphic symbol', function () {
                var rtn = mapController.selectFeature(data);

                expect(setSymbolSpy).toHaveBeenCalled();
                expect(rtn).toBe(g);
            });
        });
    });
});
