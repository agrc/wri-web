require([
    'app/router',

    'dojo/hash'
], function (
    router,

    hash
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
    });
});
