require([
    'agrc-jasmine-matchers/topics',

    'app/config',
    'app/project/FeaturesGrid',

    'dojo/dom-construct',
    'dojo/query',
    'dojo/text!app/project/tests/data/features.json'
], function (
    topics,

    config,
    WidgetUnderTest,

    domConstruct,
    query,
    featuresTxt
) {
    describe('app/project/FeaturesGrid', function () {
        var widget;
        var destroy = function (widget) {
            widget.destroyRecursive();
            widget = null;
        };

        beforeEach(function () {
            widget = new WidgetUnderTest({
                features: JSON.parse(featuresTxt)
            }, domConstruct.create('div', null, document.body));
            widget.startup();
        });

        afterEach(function () {
            if (widget) {
                destroy(widget);
            }
        });

        describe('Sanity', function () {
            it('should create a FeaturesGrid', function () {
                expect(widget).toEqual(jasmine.any(WidgetUnderTest));
            });
        });
        describe('onRowSelected', function () {
            it('applies the selected css class to the clicked on row', function () {
                expect(query('.dgrid-row.selectable.selected', widget.domNode).length).toBe(0);

                widget.onRowSelected({element: query('.dgrid-row.selectable', widget.domNode)[0]});

                expect(query('.dgrid-row.selectable.selected', widget.domNode).length).toBe(1);

                widget.onRowSelected({element: query('.dgrid-row.selectable', widget.domNode)[1]});

                expect(query('.dgrid-row.selectable.selected', widget.domNode).length).toBe(1);
            });
        });
    });
});
