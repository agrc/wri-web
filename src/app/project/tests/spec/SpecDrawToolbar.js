require([
    'app/config',
    'app/project/DrawToolbar',

    'dojo/dom-construct',
    'dojo/_base/lang',

    'esri/map',
    'esri/toolbars/draw',

    'stubmodule'
], function (
    config,
    WidgetUnderTest,

    domConstruct,
    lang,

    Map,
    Draw,

    stubmodule
) {
    describe('app/project/DrawToolbar', function () {
        var widget;
        var destroy = function (widget) {
            widget.destroyRecursive();
            widget = null;
        };
        var map;

        beforeEach(function () {
            map = new Map(domConstruct.create('div'));
            widget = new WidgetUnderTest({
                map: map
            }, domConstruct.create('div', null, document.body));
            widget.startup();
        });

        afterEach(function () {
            if (widget) {
                destroy(widget);
            }
        });

        describe('Sanity', function () {
            it('should create a DrawToolbar', function () {
                expect(widget).toEqual(jasmine.any(WidgetUnderTest));
            });
        });
        describe('startDrawing', function () {
            var widget2;
            var testType = 'TEST Type';
            beforeEach(function (done) {
                stubmodule('app/project/DrawToolbar', {
                    'app/config': {
                        featureTypesInTables: {
                            99: 'POLY',
                            98: 'POINT',
                            97: 'LINE'
                        },
                        domains: {
                            featureType: [
                                [testType, 99],
                                ['type2', 98],
                                ['type3', 97]
                            ]
                        },
                        topics: config.topics
                    }
                }).then(function (Widget2) {
                    widget2 = new Widget2({map: map}, domConstruct.create('div', null, document.body));
                    widget2.startup();
                    done();
                });
            });
            afterEach(function () {
                destroy(widget2);
            });
            it('passes appropriate geometry type to draw toolbar', function () {
                widget2.show();
                spyOn(widget2.drawToolbar, 'activate');

                widget2.onStartDrawingFeature(testType);

                expect(widget2.drawToolbar.activate).toHaveBeenCalledWith(Draw.POLYGON);

                destroy(widget2);
            });
            it('disables the cut tool for point geometry type', function () {
                widget2.show();

                expect(widget2.cutBtn.disabled).toBe(false);

                widget2.onStartDrawingFeature('type2');

                expect(widget2.cutBtn.disabled).toBe(true);

                widget2.onStartDrawingFeature(testType);

                expect(widget2.cutBtn.disabled).toBe(false);

                destroy(widget2);
            });
        });
    });
});