require([
    'app/graphicsUtils',
    'esri/graphic'
], function (
    util,
    Graphic
) {
    describe('app/graphicsUtils', function () {
        it('unions a 3 entry array of graphics when 2 are empty', function () {
            var json = {
                'geometry':
                {
                    'points': [
                        [0, 0],
                        [0, 1],
                        [1, 1]
                    ]
                }
            };

            var graphic = new Graphic(json);
            var extent = util.unionGraphicsIntoExtent([[graphic], [], []]);

            expect(extent.xmax).toEqual(1);
            expect(extent.ymax).toEqual(1);
            expect(extent.xmin).toEqual(0);
            expect(extent.ymin).toEqual(0);
        });

        it('unions an array of arrays of graphics', function () {
            var json = {
                'geometry':
                {
                    'points': [
                        [0, 0],
                        [0, 1],
                        [1, 1]
                    ]
                }
            };

            var json2 = {
                'geometry':
                {
                    'points': [
                        [0, 0],
                        [2, 1],
                        [2, 2]
                    ]
                }
            };

            var graphic = new Graphic(json);
            var graphic2 = new Graphic(json2);
            var extent = util.unionGraphicsIntoExtent([[graphic2], [graphic], [graphic2]]);

            expect(extent.xmax).toEqual(2);
            expect(extent.ymax).toEqual(2);
            expect(extent.xmin).toEqual(0);
            expect(extent.ymin).toEqual(0);
        });

        it('returns null when all 3 arrays are empty', function () {
            var extent = util.unionGraphicsIntoExtent([[], [], []]);

            expect(extent).toBe(null);
        });
    });
});
