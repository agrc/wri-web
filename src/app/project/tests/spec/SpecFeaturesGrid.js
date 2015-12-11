require([
    'agrc-jasmine-matchers/topics',

    'app/config',

    'dojo/dom-construct',
    'dojo/query',
    'dojo/text!app/project/tests/data/features.json',

    'stubmodule'
], function (
    topics,

    config,

    domConstruct,
    query,
    featuresTxt,

    stubModule
) {
    describe('app/project/FeaturesGrid', function () {
        var widget;
        var WidgetUnderTestClass;
        var destroy = function (widget) {
            widget.destroyRecursive();
            widget = null;
        };

        beforeEach(function (done) {
            stubModule('app/project/FeaturesGrid', {
                'app/mapController': {}
            }).then(function (StubbedModule) {
                WidgetUnderTestClass = StubbedModule;
                widget = new WidgetUnderTestClass({
                    features: JSON.parse(featuresTxt)
                }, domConstruct.create('div', null, document.body));
                widget.startup();
                done();
            });
        });

        afterEach(function () {
            if (widget) {
                destroy(widget);
            }
        });

        describe('Sanity', function () {
            it('should create a FeaturesGrid', function () {
                expect(widget).toEqual(jasmine.any(WidgetUnderTestClass));
            });
        });
        describe('onRowSelected', function () {
            it('applies the selected css class to the clicked on row', function () {
                expect(query('.dgrid-row.selectable.selected', widget.domNode).length).toBe(0);

                widget.onRowSelected({
                    element: query('.dgrid-row.selectable', widget.domNode)[0],
                    data: {}
                });

                expect(query('.dgrid-row.selectable.selected', widget.domNode).length).toBe(1);

                widget.onRowSelected({
                    element: query('.dgrid-row.selectable', widget.domNode)[1],
                    data: {}
                });

                expect(query('.dgrid-row.selectable.selected', widget.domNode).length).toBe(1);
            });
        });
    });
});
