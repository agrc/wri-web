require([
    'agrc-jasmine-matchers/topics',

    'app/config',
    'app/mapControls/FiltersContainer',

    'dojo/dom-construct'
], function (
    topics,

    config,
    WidgetUnderTest,

    domConstruct
) {
    describe('app/mapControls/FiltersContainer', function () {
        var widget;
        var destroy = function (widget) {
            widget.destroyRecursive();
            widget = null;
        };

        beforeEach(function () {
            widget = new WidgetUnderTest(null, domConstruct.create('div', null, document.body));
            topics.listen(config.topics.filterQueryChanged);
            widget.startup();
        });

        afterEach(function () {
            if (widget) {
                destroy(widget);
            }
        });

        describe('Sanity', function () {
            it('should create a FiltersContainer', function () {
                expect(widget).toEqual(jasmine.any(WidgetUnderTest));
            });
        });
        describe('postCreate', function () {
            it('creates the filters', function () {
                expect(widget.filters.length > 0).toBe(true);
            });
        });
        describe('onFilterChange', function () {
            beforeEach(function () {
                widget.filters = [{
                    getQuery: function () {
                        return 'one';
                    }
                }, {
                    getQuery: function () {
                        return 'two';
                    }
                }];
            });
            it('builds a def query from all of the existing filters', function () {
                widget.onFilterChange();

                expect(config.topics.filterQueryChanged)
                    .toHaveBeenPublishedWith('one AND two');
            });
        });
    });
});
