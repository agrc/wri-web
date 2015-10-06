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
        describe('getProjectIdWhereClause', function () {
            it('handles no project id', function () {
                router.projectIds = null;
                expect(router.getProjectsWhereClause()).toEqual('1=1');
                router.projectIds = [];
                expect(router.getProjectsWhereClause()).toEqual('1=1');
            });
            it('handles bad project id', function () {
                router.projectIds = 'abcde';
                expect(router.getProjectsWhereClause()).toEqual('1=1');
                router.projectIds = ['abcde'];
                expect(router.getProjectsWhereClause()).toEqual('1=1');
            });
            it('handles single project id', function () {
                router.projectIds = [1];
                expect(router.getProjectsWhereClause()).toEqual('Project_ID IN(1)');
            });
            it('handles multiple project ids', function () {
                router.projectIds = [1, 2];
                expect(router.getProjectsWhereClause()).toEqual('Project_ID IN(1,2)');
            });
            it('handles single project id with negate arg', function () {
                router.projectIds = [1];
                expect(router.getProjectsWhereClause({
                    negate: false
                })).toEqual('Project_ID IN(1)');
            });
            it('handles multiple project ids with negate arg', function () {
                router.projectIds = [1, 2];
                expect(router.getProjectsWhereClause({
                    negate: false
                })).toEqual('Project_ID IN(1,2)');
            });
            it('can negate no project id', function () {
                router.projectIds = null;
                expect(router.getProjectsWhereClause({
                    negate: true
                })).toEqual('1=1');
            });
            it('can negate single project id', function () {
                router.projectIds = [1];
                expect(router.getProjectsWhereClause({
                    negate: true
                })).toEqual('Project_ID NOT IN(1)');
            });
            it('can negate multiple project ids', function () {
                router.projectIds = [1, 2];
                expect(router.getProjectsWhereClause({
                    negate: true
                })).toEqual('Project_ID NOT IN(1,2)');
            });
        });
        describe('getProjectId', function () {
            it('returns the current project id', function () {
                router.projectIds = [2];

                expect(router.getProjectId()).toBe(2);
            });
            it('throws an error if there are multiple or no ids', function () {
                router.projectIds = [1, 2];

                expect(router.getProjectId.bind(router)).toThrow();

                router.projectIds = [];

                expect(router.getProjectId.bind(router)).toThrow();
            });
        });
    });
});
