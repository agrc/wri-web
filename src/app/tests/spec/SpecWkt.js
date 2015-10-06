require([
    'app/Wkt',

    'dojo/text!app/tests/data/esri_geometries.json',

    'esri/geometry/Multipoint',
    'esri/geometry/Point',
    'esri/geometry/Polygon',
    'esri/geometry/Polyline'
], function (
    Wkt,

    geometriesJson,

    Multipoint,
    Point,
    Polygon,
    Polyline
) {
    var esriGeometries = JSON.parse(geometriesJson);

    describe('app/Wkt', function () {
        var convert = new Wkt();
        it('converts esri geometry to wkt', function () {
            var line = new Polyline(esriGeometries.esri.line);
            expect(convert.toWkt(line)).toBe(esriGeometries.wkt.line);

            var multiline = new Polyline(esriGeometries.esri.multiline);
            expect(convert.toWkt(multiline)).toBe(esriGeometries.wkt.multiline);

            var multipoint = new Multipoint(esriGeometries.esri.multipoint);
            expect(convert.toWkt(multipoint)).toBe(esriGeometries.wkt.multipoint);

            var multipoly = new Polygon(esriGeometries.esri.multipolygon);
            expect(convert.toWkt(multipoly)).toBe(esriGeometries.wkt.multipolygon);

            var point = new Point(esriGeometries.esri.point);
            expect(convert.toWkt(point)).toBe(esriGeometries.wkt.point);

            var poly = new Polygon(esriGeometries.esri.polygon);
            expect(convert.toWkt(poly)).toBe(esriGeometries.wkt.polygon);
        });
    });
});
