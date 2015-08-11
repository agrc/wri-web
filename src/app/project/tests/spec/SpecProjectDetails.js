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
        describe('constructor', function () {
            it('should strip out the spaces from project status', function () {
                var widget2 = new WidgetUnderTest({
                    title: 'Title',
                    projectId: 1234,
                    status: 'Pending Completed',
                    description: 'asdf',
                    acres: 123,
                    streamMiles: 34,
                    leadAgency: 'asdf',
                    region: 'asdf',
                    projectManagerName: 'Scott Davis'
                }, domConstruct.create('div', null, document.body));
                widget2.startup();

                expect(widget2.statusClass).toEqual('PendingCompleted');
                destroy(widget2);
            });
        });
    });
});
