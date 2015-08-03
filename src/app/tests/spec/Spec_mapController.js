require([
    'app/config',
    'app/mapController',

    'dojo/_base/lang',

    'esri/layers/ArcGISDynamicMapServiceLayer'
],

function (
    config,
    mapController,

    lang,

    ArcGISDynamicMapServiceLayer
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
                expect(mapController.lastSelectedOriginalSymbol).toEqual(defaultSymbol);
            });
            it('no last graphic and existing current symbol', function () {
                mapController.selectFeature(data);

                expect(g.setSymbol.calls.mostRecent().args[0].style)
                    .toEqual(config.symbols.selected.point.style);
                expect(mapController.lastSelectedGraphic).toBe(g);
                expect(mapController.lastSelectedOriginalSymbol).toEqual(g.symbol);
            });
            it('existing opacity on select graphic', function () {
                var opacity = 0.5;
                g.symbol.color.a = opacity;

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
        });
        describe('toggleReferenceLayer', function () {
            beforeEach(function () {
                mapController.referenceLayers = {};
            });
            it('creates a new layer if there is not an existing one for that name', function () {
                mapController.toggleReferenceLayer({
                    name: 'blah',
                    type: 'dynamic',
                    url: 'blahurl'
                }, true);

                expect(mapController.referenceLayers.blah.layer).toEqual(jasmine.any(ArcGISDynamicMapServiceLayer));
            });
            it('calls show or hide', function () {
                mapController.referenceLayers = {
                    blah: {
                        layer: {
                            setVisibility: jasmine.createSpy('setVisibility')
                        }
                    }
                };

                mapController.toggleReferenceLayer({name: 'blah'}, true);

                expect(mapController.referenceLayers.blah.layer.setVisibility).toHaveBeenCalledWith(true);
            });
        });
        describe('toggleReferenceLayerLabels', function () {
            var setVisibleLayersSpy;
            beforeEach(function () {
                setVisibleLayersSpy = jasmine.createSpy('setVisibleLayers');
                mapController.referenceLayers = {
                    layerone: {
                        type: 'dynamic',
                        layer: {
                            setVisibleLayers: setVisibleLayersSpy
                        }
                    },
                    layertwo: {
                        type: 'somethingelse',
                        layer: {
                            setVisibleLayers: setVisibleLayersSpy
                        }
                    },
                    layerthree: {
                        type: 'dynamic',
                        layerIndex: 1,
                        labelsIndex: 2,
                        layer: {
                            setVisibleLayers: setVisibleLayersSpy
                        }
                    }
                };
            });
            it('sets the showReferenceLayerLabels property', function () {
                mapController.showReferenceLayerLabels = false;

                mapController.toggleReferenceLayerLabels(true);

                expect(mapController.showReferenceLayerLabels).toBe(true);

                mapController.toggleReferenceLayerLabels(false);

                expect(mapController.showReferenceLayerLabels).toBe(false);
            });
            it('loop through existing reference layers and set visible layers', function () {
                mapController.toggleReferenceLayerLabels(true);

                expect(setVisibleLayersSpy.calls.count()).toBe(2);
                expect(setVisibleLayersSpy.calls.mostRecent().args)
                    .toEqual([[1, 2]]);

                mapController.toggleReferenceLayerLabels(false);

                expect(setVisibleLayersSpy.calls.mostRecent().args).toEqual([[1]]);
            });
        });
    });
});
