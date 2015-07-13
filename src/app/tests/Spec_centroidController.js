require([
    'app/centroidController'
],

function (
    centroidController
) {
    describe('app/centroidController', function () {
        describe('showFeaturesFor', function () {
            it('combines with filter query', function () {
                centroidController.filter = 'blah';
                centroidController.centroidsVisible = true;
                centroidController.centroidLayer = {
                    selectFeatures: function () {}
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
    });
});
