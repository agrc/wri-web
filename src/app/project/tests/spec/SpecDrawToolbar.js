require([
    'agrc-jasmine-matchers/topics',

    'app/config',
    'app/project/DrawToolbar',

    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/keys',
    'dojo/_base/lang',

    'esri/map',
    'esri/toolbars/draw',

    'stubmodule'
], function (
    topics,

    config,
    WidgetUnderTest,

    domClass,
    domConstruct,
    keys,
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
            jasmine.addMatchers({
                toBeHidden: function () {
                    return {
                        compare: function (node) {
                            var result = {};
                            result.pass = domClass.contains(node, 'hidden');
                            if (result.pass) {
                                result.message = 'Expected ' + node + ' not to be hidden';
                            } else {
                                result.message = 'Expected ' + node + ' to be hidden';
                            }
                            return result;
                        }
                    };
                }
            });
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
                                ['type3', 97],
                                ['poly', 99],
                                ['line', 97],
                                ['point', 98]
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
            it('shows the appropriate draw buttons based on geometry type', function () {
                widget2.show();

                widget2.onStartDrawingFeature('poly');

                expect(widget2.drawBtnArea).not.toBeHidden();
                expect(widget2.drawBtnLine).not.toBeHidden();
                expect(widget2.drawBtnPoint).toBeHidden();

                widget2.onStartDrawingFeature('line');

                expect(widget2.drawBtnArea).toBeHidden();
                expect(widget2.drawBtnLine).not.toBeHidden();
                expect(widget2.drawBtnPoint).toBeHidden();

                widget2.onStartDrawingFeature('point');

                expect(widget2.drawBtnArea).toBeHidden();
                expect(widget2.drawBtnLine).toBeHidden();
                expect(widget2.drawBtnPoint).not.toBeHidden();
            });
        });
        describe('onDrawComplete', function () {
            it('requires polygons to have at least three unique points', function () {
                var geometry = {
                    type: 'polygon',
                    rings: [[
                        [-12396133.91773127, 4976196.977454647],
                        [-12396377.560758937, 4975905.561284303],
                        [-12396133.91773127, 4976196.977454647]
                    ]]
                };
                topics.listen(config.topics.feature.drawingComplete);
                domClass.add(widget.drawBtnArea, 'active');

                widget.onDrawComplete({geometry: geometry});

                expect(config.topics.feature.drawingComplete).not.toHaveBeenPublished();

                geometry = {
                    type: 'polygon',
                    rings: [[
                        [-12396133.91773127, 4976196.977454647],
                        [-12396377.560758937, 4975905.561284303],
                        [-22396377.560758937, 3975905.561284303],
                        [-12396133.91773127, 4976196.977454647]
                    ]]
                };

                widget.onDrawComplete({geometry: geometry});

                expect(config.topics.feature.drawingComplete).toHaveBeenPublished();
            });
        });
        describe('onKeyUp', function () {
            it('fires the event only if there is a selected graphic and DELETE was pressed', function () {
                var deactivateSpy = jasmine.createSpy('deactivate');
                widget.editToolbar = {
                    deactivate: deactivateSpy,
                    getCurrentState: function () {
                        return {tool: 0};
                    }
                };

                widget.onKeyUp({
                    keyCode: 1
                });
                expect(deactivateSpy).not.toHaveBeenCalled();

                widget.onKeyUp({
                    keyCode: keys.DELETE
                });
                expect(deactivateSpy).not.toHaveBeenCalled();

                widget.editToolbar.getCurrentState = function () {
                    return {tool: 1};
                };
                widget.onKeyUp({
                    keyCode: keys.DELETE
                });
                expect(deactivateSpy).toHaveBeenCalled();
            });
        });
    });
});
