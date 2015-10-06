require([
    'app/Wkt',

    'dojo/text!app/tests/data/esri_geometries.json'
], function (
    Wkt,

    geometriesJson
) {
    var esriGeometries = JSON.parse(geometriesJson);

    describe('app/Wkt', function () {
        var convert = new Wkt();
        it('converts esri geometry to wkt', function () {
            var line = esriGeometries.esri.line;
            expect(convert.toWkt(line)).toBe(esriGeometries.wkt.line);

            var multiline = esriGeometries.esri.multiline;
            expect(convert.toWkt(multiline)).toBe(esriGeometries.wkt.multiline);

            var multipoint = esriGeometries.esri.multipoint;
            expect(convert.toWkt(multipoint)).toBe(esriGeometries.wkt.multipoint);

            var multipoly = esriGeometries.esri.multipolygon;
            expect(convert.toWkt(multipoly)).toBe(esriGeometries.wkt.multipolygon);

            var point = esriGeometries.esri.point;
            expect(convert.toWkt(point)).toBe(esriGeometries.wkt.point);

            var poly = esriGeometries.esri.polygon;
            expect(convert.toWkt(poly)).toBe(esriGeometries.wkt.polygon);
        });
    });
});
