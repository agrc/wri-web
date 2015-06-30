define([
    'esri/graphicsUtils'
], function (
    graphicsUtils
) {
    return {
        unionGraphicsIntoExtent: function (graphics) {
            // summary:
            //      gets the extent from graphics. It will always be
            //      and array of 3 arrays
            // graphics [[], [], []]
            console.log('app/graphicsUtils::unionGraphicsIntoExtent', arguments);

            graphics = graphics.reduce(function (a, b) {
                return a.concat(b);
            });

            if (graphics.length === 0) {
                return null;
            }

            return graphicsUtils.graphicsExtent(graphics);
        }
    };
});
