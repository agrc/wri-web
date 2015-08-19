require([
    'app/config',
    'app/mapControls/Print',
    'dojo/text!app/tests/spec/webmapjson.json',

    'dojo/dom-construct'
], function (
    config,
    WidgetUnderTest,
    webmapJson,

    domConstruct
) {
    describe('app/mapControls/Print', function () {
        var widget;
        var destroy = function (widget) {
            widget.destroyRecursive();
            widget = null;
        };

        beforeEach(function () {
            widget = new WidgetUnderTest(null, domConstruct.create('div', null, document.body));
            widget.startup();
        });

        afterEach(function () {
            if (widget) {
                destroy(widget);
            }
        });

        describe('Sanity', function () {
            it('should create a Print', function () {
                expect(widget).toEqual(jasmine.any(WidgetUnderTest));
            });
        });
        describe('patchMapServiceUrls', function () {
            it('replaces all https with http', function () {
                if (!String.prototype.startsWith) {
                    /*jshint -W121 */
                    String.prototype.startsWith = function (searchString, position) {
                        position = position || 0;
                        return this.indexOf(searchString, position) === position;
                    };
                    /*jshint +W121 */
                }

                var requestArgs = {
                    url: config.urls.print + '/submitJob',
                    content: {
                        Web_Map_as_JSON: webmapJson
                    }
                };

                var args = widget.patchMapServiceUrls(requestArgs);
                JSON.parse(args.content.Web_Map_as_JSON).operationalLayers.forEach(function (layer) {
                    if (layer.url) {
                        expect(layer.url.startsWith('http://')).toBe(true);
                    }
                    if (layer.urlTemplate) {
                        expect(layer.urlTemplate.startsWith('http://')).toBe(true);
                    }
                });
            });
        });
    });
});
