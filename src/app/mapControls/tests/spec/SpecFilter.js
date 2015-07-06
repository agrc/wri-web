require([
    'app/mapControls/Filter'
], function (
    Filter
) {
    describe('app/filters/Filter', function () {
        var testWidget;
        beforeEach(function () {
            testWidget = new Filter({
                items: [
                    ['desc1', 'value1'],
                    ['desc2', 'value2'],
                    ['desc3', 'value3']
                ],
                fieldName: 'FieldName',
                fieldType: Filter.TYPE_TEXT,
                anyAllToggle: true,
                name: 'Name'
            });
        });
        afterEach(function () {
            if (testWidget) {
                if (testWidget.destroy) {
                    testWidget.destroy();
                }

                testWidget = null;
            }
        });
        it('should create a Filter', function () {
            expect(testWidget).toEqual(jasmine.any(Filter));
        });
        describe('postCreate', function () {
            it('creates bubbles', function () {
                expect(testWidget.buttonContainer.children.length).toBe(3);
            });
        });
        describe('itemClicked', function () {
            it('add to the selected items array', function () {
                testWidget.itemClicked('1');
                expect(testWidget.selectedValues).toEqual(['1']);

                testWidget.itemClicked('2');
                expect(testWidget.selectedValues).toEqual(['1', '2']);
            });
            it('removes if it\'s already been selected', function () {
                testWidget.itemClicked('1');
                testWidget.itemClicked('2');

                testWidget.itemClicked('1');
                expect(testWidget.selectedValues).toEqual(['2']);
            });
        });
        describe('getQuery', function () {
            it('returns undefined if no items are selected', function () {
                expect(testWidget.getQuery()).not.toBeDefined();
            });
            it('returns a def query if some are selected', function () {
                testWidget.itemClicked('1');
                testWidget.itemClicked('2');

                expect(testWidget.getQuery()).toBe("FieldName IN('1','2')");

                testWidget.fieldType = Filter.TYPE_NUMBER;

                expect(testWidget.getQuery()).toBe("FieldName IN(1,2)");
            });
            it('handles "all" queries', function () {
                testWidget.any = false;
                testWidget.itemClicked('1');
                testWidget.itemClicked('2');
                var expected = "FieldName='1' AND FieldName='2'";

                expect(testWidget.getQuery()).toBe(expected);
            });
            it('related table any query', function () {
                testWidget.relatedTableQuery = true;
                testWidget.any = true;
                var expected = ["Project_ID IN(SELECT Project_ID FROM POINT WHERE FieldName IN('1','2') ",
                                "union SELECT Project_ID FROM LINE WHERE FieldName IN('1','2') ",
                                "union SELECT Project_ID FROM POLY WHERE FieldName IN('1','2'))"].join('');
                testWidget.itemClicked('1');
                testWidget.itemClicked('2');

                expect(testWidget.getQuery()).toBe(expected);
            });
            it('related table all query two layers', function () {
                testWidget.relatedTableQuery = true;
                testWidget.fieldType = Filter.TYPE_NUMBER;
                testWidget.any = false;
                var expected = ["Project_ID IN(",
                                "SELECT Project_ID FROM POLY WHERE FieldName IN(1,2) ",
                                "intersect SELECT Project_ID FROM LINE WHERE FieldName IN(7))"].join('');
                testWidget.itemClicked(1); // POLY
                testWidget.itemClicked(2); // POLY
                testWidget.itemClicked(7); // LINE

                expect(testWidget.getQuery()).toBe(expected);
            });
            it('related table all query all layers', function () {
                testWidget.relatedTableQuery = true;
                testWidget.fieldType = Filter.TYPE_NUMBER;
                testWidget.any = false;
                var expected = ["Project_ID IN(SELECT Project_ID FROM POLY WHERE FieldName IN(1,2) ",
                                "intersect SELECT Project_ID FROM LINE WHERE FieldName IN(7) ",
                                "intersect SELECT Project_ID FROM POINT WHERE FieldName IN(10,12))"].join('');
                testWidget.itemClicked(1); // POLY
                testWidget.itemClicked(2); // POLY
                testWidget.itemClicked(7); // LINE
                testWidget.itemClicked(10); // POINT
                testWidget.itemClicked(12); // POINT

                expect(testWidget.getQuery()).toBe(expected);
            });
        });
    });
});
