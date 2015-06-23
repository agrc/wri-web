require([
    'app/project/ProjectDetails',

    'dojo/dom-class',
    'dojo/dom-construct'
], function (
    WidgetUnderTest,

    domClass,
    domConstruct
) {
    describe('app/ProjectDetails', function () {
        var widget;
        var destroy = function (widget) {
            widget.destroyRecursive();
            widget = null;
        };

        beforeEach(function () {
            widget = new WidgetUnderTest({
                title: 'Title',
                projectId: 1234,
                status: 'Completed',
                description: 'asdf',
                acres: 123,
                streamMiles: 34,
                leadAgency: 'asdf',
                region: 'asdf',
                projectManagerName: 'Scott Davis'
            }, domConstruct.create('div', null, document.body));
            widget.startup();
        });

        afterEach(function () {
            if (widget) {
                destroy(widget);
            }
        });

        describe('Sanity', function () {
            it('should create a ProjectDetails', function () {
                expect(widget).toEqual(jasmine.any(WidgetUnderTest));
            });
        });
        describe('postCreate', function () {
            it('hides stream miles if none are passed in', function () {
                var widget2 = new WidgetUnderTest({
                    title: 'asdf',
                    projectId: 1234,
                    status: 'aasdf',
                    description: 'asdf',
                    acres: 123,
                    streamMiles: null,
                    leadAgency: 'asdf',
                    region: 'asdf',
                    projectManagerName: 'asdf'
                });
                expect(domClass.contains(widget2.streamMilesDiv, 'hidden')).toBe(true);
            });
        });
    });
});
