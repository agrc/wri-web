require([
    'app/config',
    'app/mapControls/CentroidSwitchButton',

    'dojo/dom-construct',
    'dojo/dom-class'
], function (
    config,
    WidgetUnderTest,

    domConstruct,
    domClass
) {
    describe('app/mapControls/CentroidSwitchButton', function () {
        var widget;
        var node;
        var destroy = function (widget) {
            widget.destroyRecursive();
            widget = null;
            node = null;
        };

        beforeEach(function () {
            widget = new WidgetUnderTest(null, domConstruct.create('div', null, document.body));
            widget.startup();
            node = domConstruct.create('div', null, document.body);
        });

        afterEach(function () {
            if (widget) {
                destroy(widget);
            }
        });

        describe('Sanity', function () {
            it('should create a CentroidSwitchButton', function () {
                expect(widget).toEqual(jasmine.any(WidgetUnderTest));
            });
        });

        describe('toggleCentroids', function () {
            it('should be added on first click', function () {
                widget.toggleCentroids({
                    target: node
                });

                expect(node.getAttribute('class')).toEqual('toggle');
            });
            it('should be removed on second click', function () {
                widget.toggleCentroids({
                    target: node
                });

                widget.toggleCentroids({
                    target: node
                });

                expect(node.getAttribute('class')).toEqual('');
            });
        });

        describe('toggleSelf', function () {
            it('should be shown for an empty array', function () {
                widget.toggleSelf([]);

                expect(domClass.contains(widget.domNode, 'hidden')).toBeFalsy();
            });
            it('should be hidden for an array of 1 ids', function () {
                widget.toggleSelf([1]);

                expect(domClass.contains(widget.domNode, 'hidden')).toBeTruthy();
            });
            it('should be shown for an array of multiple ids', function () {
                widget.toggleSelf([1, 2, 3]);

                expect(domClass.contains(widget.domNode, 'hidden')).toBeFalsy();
            });
            it('sets visible property', function () {
                widget.toggleSelf([1]);

                expect(widget.visible).toBe(false);

                widget.toggleSelf([]);

                expect(widget.visible).toBe(true);
            });
        });

        describe('_onExtentChanged', function () {
            it('sets this.level', function () {
                var lvl = 5;
                widget._onExtentChanged({lod: {level: lvl}});

                expect(widget.level).toBe(lvl);
            });
            it('hides', function () {
                var ext = {lod: {level: config.scaleTrigger}};

                widget._onExtentChanged(ext);

                expect(domClass.contains(widget.domNode, 'hidden')).toBe(true);
            });
            it('shows', function () {
                var ext = {lod: {level: config.scaleTrigger - 1}};

                widget._onExtentChanged(ext);

                expect(domClass.contains(widget.domNode, 'hidden')).toBe(false);
            });
            it('is overriden by visible property', function () {
                var ext = {lod: {level: config.scaleTrigger - 1}};
                widget.visible = false;

                widget._onExtentChanged(ext);

                expect(domClass.contains(widget.domNode, 'hidden')).toBe(true);
            });
        });
    });
});
