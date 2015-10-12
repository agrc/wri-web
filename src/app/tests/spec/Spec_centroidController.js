require([
    'app/centroidController',

    'dojo/dom-construct'
],

function (
    centroidController,

    domConstruct
) {
    describe('app/centroidController', function () {
        describe('showFeaturesFor', function () {
            it('combines with filter query', function () {
                centroidController.filter = 'blah';
                centroidController.centroidsVisible = true;
                centroidController.centroidLayer = {
                    setDefinitionExpression: function () {},
                    queryExtent: function () {
                        return {then: function () {}};
                    }
                };

                centroidController.showFeaturesFor('blah2');

                expect(centroidController.centroidLayer.__where__).toEqual('blah2 AND blah');
            });
        });
        describe('onFilterQueryChanged', function () {
            beforeEach(function () {
                spyOn(centroidController, 'showFeaturesFor');
            });
            it('ignores undefined properties', function () {
                var newFilter = {
                    projectAndFeatureFilter: 'blah'
                    //nonWriProjectFilter: undefined
                };

                centroidController.onFilterQueryChanged(newFilter);

                expect(centroidController.filter).toEqual(newFilter.projectAndFeatureFilter);
            });
            it('undefined removes filter', function () {
                var newFilter = {
                    projectAndFeatureFilter: undefined,
                    nonWriProjectFilter: undefined
                };

                centroidController.onFilterQueryChanged(newFilter);

                expect(centroidController.filter).toEqual('');
            });
            it('combines filters with and', function () {
                var newFilter = {
                    projectAndFeatureFilter: 'blah',
                    nonWriProjectFilter: 'yada'
                };

                centroidController.onFilterQueryChanged(newFilter);

                expect(centroidController.filter).toEqual(newFilter.projectAndFeatureFilter + ' AND ' + newFilter.nonWriProjectFilter);
            });
            it('calls showFeaturesFor', function () {
                centroidController.onFilterQueryChanged();

                expect(centroidController.showFeaturesFor).toHaveBeenCalled();
            });
        });
        describe('_showPopupFor', function () {
            var setContentSpy;
            beforeEach(function () {
                centroidController.startup();
                setContentSpy = spyOn(centroidController.dialog, 'setContent');
            });
            it('strips space from Pending Completed class name', function () {
                // for projects
                centroidController._showPopupFor(true, true, {
                    target: domConstruct.create('div'),
                    graphic: {
                        attributes: {
                            Status: 'Pending Completed'
                        }
                    }
                });

                expect(setContentSpy.calls.mostRecent().args[0]).toContain('PendingCompleted');

                // for features
                centroidController._showPopupFor(true, false, {
                    target: domConstruct.create('div'),
                    graphic: {
                        attributes: {
                            StatusDescription: 'Pending Completed'
                        }
                    }
                });

                expect(setContentSpy.calls.mostRecent().args[0]).toContain('PendingCompleted');
            });
            it('doesn\'t do anything if the user is drawing', function () {
                centroidController.isDrawing = true;

                centroidController._showPopupFor(true, false, {
                    target: domConstruct.create('div'),
                    graphic: {
                        attributes: {
                            StatusDescription: 'Pending Completed'
                        }
                    }
                });

                expect(setContentSpy).not.toHaveBeenCalled();
            });
        });
    });
});
