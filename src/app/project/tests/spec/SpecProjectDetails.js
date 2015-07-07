require([
    'app/project/ProjectDetails',

    'dojo/dom-construct'
], function (
    WidgetUnderTest,

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
    });
});
