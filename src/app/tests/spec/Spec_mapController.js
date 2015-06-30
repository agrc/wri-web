require([
    'app/config',
    'app/mapController',

    'dojo/_base/lang'
],

function (
    config,
    mapController,

    lang
) {
    describe('app/mapController', function () {
        describe('selectFeature', function () {
            var data;
            var g;
            var defaultSymbol = { color: { a: 1 } };
            beforeEach(function () {
                g = {
                    attributes: {
                        FeatureID: 1139
                    },
                    getDojoShape: function () {
                        return {moveToFront: function () {}};
                    },
                    symbol: { color: { a: 1 } }
                };
                data = {
                    featureId: 1139,
                    origin: 'point'
                };
                g.setSymbol = jasmine.createSpy('setSymbol');
                mapController.layers.point = {
                    graphics: [g],
                    renderer: {
                        getSymbol: function () {
                            return defaultSymbol;
                        }
                    }
                };
            });
            it('no last graphic and no current symbol', function () {
                g.symbol = undefined;
                mapController.selectFeature(data);

                expect(g.setSymbol.calls.mostRecent().args[0].style)
                    .toEqual(config.symbols.selected.point.style);
                expect(mapController.lastSelectedGraphic).toBe(g);
                expect(mapController.lastSelectedOriginalSymbol).toBeUndefined();
            });
            it('no last graphic and current symbol', function () {
                mapController.selectFeature(data);

                expect(g.setSymbol.calls.mostRecent().args[0].style)
                    .toEqual(config.symbols.selected.point.style);
                expect(mapController.lastSelectedGraphic).toBe(g);
                expect(mapController.lastSelectedOriginalSymbol).toEqual(g.symbol);
            });
            it('existing last graphic no last symbol', function () {
                var lastGraphic = lang.clone(g);
                lastGraphic.setSymbol = jasmine.createSpy('setSymbol');
                mapController.lastSelectedGraphic = lastGraphic;
                mapController.lastSelectedOriginalSymbol = undefined;

                mapController.selectFeature(data);

                expect(lastGraphic.setSymbol).toHaveBeenCalledWith(defaultSymbol);
            });
            it('existing opacity on select graphic', function () {
                var opacity = 0.5;
                g.symbol.color.a = opacity;
                mapController.lastSelectedOriginalSymbol = undefined;

                mapController.selectFeature(data);

                expect(g.setSymbol.calls.mostRecent().args[0].color.a).toEqual(opacity);
            });
            it('opacity changed on last selected graphic', function () {
                var opacity = 0.3;
                var lastGraphic = lang.clone(g);
                lastGraphic.setSymbol = jasmine.createSpy('setSymbol');
                lastGraphic.symbol.color.a = opacity;
                mapController.lastSelectedGraphic = lastGraphic;
                mapController.lastSelectedOriginalSymbol = { color: { a: 1 } };

                mapController.selectFeature(data);

                expect(lastGraphic.setSymbol.calls.mostRecent().args[0].color.a).toBe(opacity);
            });
            it('opacity changed on last selected graphic with no symbol', function () {
                var opacity = 0.4;
                var lastGraphic = lang.clone(g);
                lastGraphic.setSymbol = jasmine.createSpy('setSymbol');
                lastGraphic.symbol.color.a = opacity;
                mapController.lastSelectedGraphic = lastGraphic;
                mapController.lastSelectedOriginalSymbol = undefined;

                mapController.selectFeature(data);

                expect(lastGraphic.setSymbol.calls.mostRecent().args[0].color.a).toBe(opacity);
            });
        });
    });
});
