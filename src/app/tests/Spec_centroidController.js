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
            it('sets filter prop', function () {
                var newFilter = 'blah';
                centroidController.onFilterQueryChanged(newFilter);

                expect(centroidController.filter).toEqual(newFilter);
            });
            it('calls showFeaturesFor', function () {
                centroidController.onFilterQueryChanged();

                expect(centroidController.showFeaturesFor).toHaveBeenCalled();
            });
        });
        describe('_showPopupFor', function () {
            it('strips space from Pending Completed class name', function () {
                centroidController.startup();
                var setContentSpy = spyOn(centroidController.dialog, 'setContent');

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
        });
    });
});
