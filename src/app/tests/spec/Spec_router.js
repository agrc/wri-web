require([
    'app/router',

    'dojo/hash',
    'dojo/promise/Promise'
], function (
    router,

    hash,
    Promise
) {
    describe('app/router', function () {
        afterEach(function () {
            hash('');
        });

        describe('setHash', function () {
            it('sets the correct URL parameters', function () {
                router.setHash({id: 1});

                expect(hash()).toContain('id=1');

                router.setHash({id: [1, 2, 3]});

                expect(hash()).toContain('id=1&id=2&id=3');
            });
        });
        describe('onHashChange', function () {
            beforeEach(function () {
                spyOn(router, 'onIdsChange');
            });
            it('updates the properties of the router', function () {
                router.onHashChange('id=1');

                expect(router.projectIds).toEqual(['1']);

                router.onHashChange('id=1&id=2&id=3');

                expect(router.projectIds).toEqual(['1', '2', '3']);

                router.onHashChange('test=1');

                expect(router.projectIds).toEqual([]);
            });
            it('calls update functions if new values', function () {
                router.projectIds = [];
                router.onHashChange('id=1');
                router.onHashChange('id=1&id=2');
                router.onHashChange('id=1');

                expect(router.onIdsChange.calls.count()).toBe(3);
            });
            it('doesn\'t call update if not new values', function () {
                router.projectIds = ['1'];
                router.onHashChange('id=1');
                router.projectIds = ['1', '2'];
                router.onHashChange('id=2&id=1');

                expect(router.onIdsChange).not.toHaveBeenCalled();
            });
        });
        describe('getProjectIdsExtent', function () {
            it('returns null if there are no project ids', function () {
                router.projectIds = [];

                expect(router.getProjectIdsExtent()).toBeNull();
            });
            it('returns a promise if there are project ids', function () {
                router.projectIds = ['1', '2'];

                expect(router.getProjectIdsExtent()).toEqual(jasmine.any(Promise));
            });
        });
        describe('getProjectsWhereClause', function () {
            it('returns 1=1 if not project ids are specified', function () {
                router.projectIds = [];
                expect(router.getProjectsWhereClause()).toBe('1 = 1');
            });
        });
    });
});
