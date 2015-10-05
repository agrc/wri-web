define([
    'dojo/_base/declare'
], function (
    declare
) {
    var isArray = function (obj) {
        return obj instanceof Array;
    };

    var extend = function (destination, source) {
        for (var k in source) {
            if (source.hasOwnProperty(k)) {
                destination[k] = source[k];
            }
        }

        return destination;
    };

    var Point = function (input) {
        var args = Array.prototype.slice.call(arguments);

        if (input && input.type === 'Point' && input.coordinates) {
            extend(this, input);
        } else if (input && isArray(input)) {
            this.coordinates = input;
        } else if (args.length >= 2) {
            this.coordinates = args;
        } else {
            throw 'Terraformer: invalid input for Terraformer.Point';
        }

        this.type = 'Point';
    };

    /*
    GeoJSON MultiPoint Class
        new MultiPoint();
        new MultiPoint([[x,y], [x1,y1]]);
        new MultiPoint({
          type: "MultiPoint",
          coordinates: [x,y]
        });
    */
    var MultiPoint = function (input) {
        if (input && input.type === 'MultiPoint' && input.coordinates) {
            extend(this, input);
        } else if (isArray(input)) {
            this.coordinates = input;
        } else {
            throw 'Terraformer: invalid input for Terraformer.MultiPoint';
        }

        this.type = 'MultiPoint';
    };

    /*
    GeoJSON LineString Class
        new LineString();
        new LineString([[x,y], [x1,y1]]);
        new LineString({
          type: "LineString",
          coordinates: [x,y]
        });
    */
    function LineString(input) {
        if (input && input.type === 'LineString' && input.coordinates) {
            extend(this, input);
        } else if (isArray(input)) {
            this.coordinates = input;
        } else {
            throw 'Terraformer: invalid input for Terraformer.LineString';
        }

        this.type = 'LineString';
    }

    /*
    GeoJSON MultiLineString Class
        new MultiLineString();
        new MultiLineString([ [[x,y], [x1,y1]], [[x2,y2], [x3,y3]] ]);
        new MultiLineString({
          type: "MultiLineString",
          coordinates: [ [[x,y], [x1,y1]], [[x2,y2], [x3,y3]] ]
        });
    */
    var MultiLineString = function (input) {
        if (input && input.type === 'MultiLineString' && input.coordinates) {
            extend(this, input);
        } else if (isArray(input)) {
            this.coordinates = input;
        } else {
            throw 'Terraformer: invalid input for Terraformer.MultiLineString';
        }

        this.type = 'MultiLineString';
    };

    /*
    GeoJSON Polygon Class
        new Polygon();
        new Polygon([ [[x,y], [x1,y1], [x2,y2]] ]);
        new Polygon({
          type: "Polygon",
          coordinates: [ [[x,y], [x1,y1], [x2,y2]] ]
        });
    */
    var Polygon = function (input) {
        if (input && input.type === 'Polygon' && input.coordinates) {
            extend(this, input);
        } else if (isArray(input)) {
            this.coordinates = input;
        } else {
            throw 'Terraformer: invalid input for Terraformer.Polygon';
        }

        this.type = 'Polygon';
    };

    /*
    GeoJSON MultiPolygon Class
        new MultiPolygon();
        new MultiPolygon([ [ [[x,y], [x1,y1]], [[x2,y2], [x3,y3]] ] ]);
        new MultiPolygon({
          type: "MultiPolygon",
          coordinates: [ [ [[x,y], [x1,y1]], [[x2,y2], [x3,y3]] ] ]
        });
    */
    var MultiPolygon = function (input) {
        if (input && input.type === 'MultiPolygon' && input.coordinates) {
            extend(this, input);
        } else if (isArray(input)) {
            this.coordinates = input;
        } else {
            throw 'Terraformer: invalid input for Terraformer.MultiPolygon';
        }

        this.type = 'MultiPolygon';
    };

    var Primitive = function (geojson) {
        if (geojson) {
            switch (geojson.type) {
            case 'Point':
                return new Point(geojson);

            case 'MultiPoint':
                return new MultiPoint(geojson);

            case 'LineString':
                return new LineString(geojson);

            case 'MultiLineString':
                return new MultiLineString(geojson);

            case 'Polygon':
                return new Polygon(geojson);

            case 'MultiPolygon':
                return new MultiPolygon(geojson);

            default:
                throw new Error('Unknown type: ' + geojson.type);
            }
        }
    };

    Point.prototype = new Primitive();
    Point.prototype.constructor = Point;
    MultiPoint.prototype = new Primitive();
    MultiPoint.prototype.constructor = MultiPoint;
    LineString.prototype = new Primitive();
    LineString.prototype.constructor = LineString;
    MultiLineString.prototype = new Primitive();
    MultiLineString.prototype.constructor = MultiLineString;
    Polygon.prototype = new Primitive();
    Polygon.prototype.constructor = Polygon;
    MultiPolygon.prototype = new Primitive();
    MultiPolygon.prototype.constructor = MultiPolygon;

    return declare (null, {
        // checks if the first and last points of a ring are equal and closes the ring
        closeRing: function (coordinates) {
            if (!this.pointsEqual(coordinates[0], coordinates[coordinates.length - 1])) {
                coordinates.push(coordinates[0]);
            }

            return coordinates;
        },
        // checks if 2 x,y points are equal
        pointsEqual: function (a, b) {
            for (var i = 0; i < a.length; i++) {
                if (a[i] !== b[i]) {
                    return false;
                }
            }

            return true;
        },
        // shallow object clone for feature properties and attributes
        // from http://jsperf.com/cloning-an-object/2
        clone: function (obj) {
            var target = {};
            for (var i in obj) {
                if (obj.hasOwnProperty(i)) {
                    target[i] = obj[i];
                }
            }
            return target;
        },
        // determine if polygon ring coordinates are clockwise. clockwise signifies outer ring, counter-clockwise an inner ring
        // or hole. this logic was found at http://stackoverflow.com/questions/1165647/how-to-determine-if-a-list-of-polygon-
        // points-are-in-clockwise-order
        ringIsClockwise: function (ringToTest) {
            var total = 0;
            var i = 0;
            var rLength = ringToTest.length;
            var pt1 = ringToTest[i];
            var pt2;
            for (i; i < rLength - 1; i++) {
                pt2 = ringToTest[i + 1];
                total += (pt2[0] - pt1[0]) * (pt2[1] + pt1[1]);
                pt1 = pt2;
            }
            return (total >= 0);
        },
        // This : functionensures that rings are oriented in the right directions
        // outer rings are clockwise, holes are counterclockwise
        orientRings: function (poly) {
            var output = [];
            var polygon = poly.slice(0);
            var outerRing = this.closeRing(polygon.shift().slice(0));
            if (outerRing.length >= 4) {
                if (!this.ringIsClockwise(outerRing)) {
                    outerRing.reverse();
                }

                output.push(outerRing);

                for (var i = 0; i < polygon.length; i++) {
                    var hole = this.closeRing(polygon[i].slice(0));
                    if (hole.length >= 4) {
                        if (this.ringIsClockwise(hole)) {
                            hole.reverse();
                        }
                        output.push(hole);
                    }
                }
            }

            return output;
        },
        isNumber: function (n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        },
        edgeIntersectsEdge: function (a1, a2, b1, b2) {
            var ua_t = (b2[0] - b1[0]) * (a1[1] - b1[1]) - (b2[1] - b1[1]) * (a1[0] - b1[0]);
            var ub_t = (a2[0] - a1[0]) * (a1[1] - b1[1]) - (a2[1] - a1[1]) * (a1[0] - b1[0]);
            var u_b  = (b2[1] - b1[1]) * (a2[0] - a1[0]) - (b2[0] - b1[0]) * (a2[1] - a1[1]);

            if (u_b !== 0) {
                var ua = ua_t / u_b;
                var ub = ub_t / u_b;

                if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
                    return true;
                }
            }

            return false;
        },
        arraysIntersectArrays: function (a, b) {
            if (this.isNumber(a[0][0])) {
                if (this.isNumber(b[0][0])) {
                    for (var i = 0; i < a.length - 1; i++) {
                        for (var j = 0; j < b.length - 1; j++) {
                            if (this.edgeIntersectsEdge(a[i], a[i + 1], b[j], b[j + 1])) {
                                return true;
                            }
                        }
                    }
                } else {
                    for (var k = 0; k < b.length; k++) {
                        if (this.arraysIntersectArrays(a, b[k])) {
                            return true;
                        }
                    }
                }
            } else {
                for (var l = 0; l < a.length; l++) {
                    if (this.arraysIntersectArrays(a[l], b)) {
                        return true;
                    }
                }
            }

            return false;
        },
        coordinatesContainPoint: function (coordinates, point) {
            var contains = false;
            for (var i = -1, l = coordinates.length, j = l - 1; ++i < l; j = i) {
                if (((coordinates[i][1] <= point[1] && point[1] < coordinates[j][1]) ||
                     (coordinates[j][1] <= point[1] && point[1] < coordinates[i][1])) &&
                    (point[0] < (coordinates[j][0] - coordinates[i][0]) * (point[1] - coordinates[i][1]) / (coordinates[j][1] - coordinates[i][1]) + coordinates[i][0])) {
                    contains = !contains;
                }
            }
            return contains;
        },
        coordinatesContainCoordinates: function (outer, inner) {
            var intersects = this.arraysIntersectArrays(outer, inner);
            var contains = this.coordinatesContainPoint(outer, inner[0]);
            if (!intersects && contains) {
                return true;
            }

            return false;
        },
        // do any polygons in this array contain any other polygons in this array?
        // used for checking for holes in arcgis rings
        convertRingsToGeoJSON: function (rings) {
            var outerRings = [];
            var holes = [];

            // for each ring
            for (var r = 0; r < rings.length; r++) {
                var ring = this.closeRing(rings[r].slice(0));
                if (ring.length < 4) {
                    continue;
                }
                // is this ring an outer ring? is it clockwise?
                if (this.ringIsClockwise(ring)) {
                    var polygon = [ring];
                    outerRings.push(polygon); // push to outer rings
                } else {
                    holes.push(ring); // counterclockwise push to holes
                }
            }

            // while there are holes left...
            while (holes.length) {
                // pop a hole off out stack
                var hole = holes.pop();
                var matched = false;

                // loop over all outer rings and see if they contain our hole.
                for (var x = outerRings.length - 1; x >= 0; x--) {
                    var outerRing = outerRings[x][0];
                    if (this.coordinatesContainCoordinates(outerRing, hole)) {
                        // the hole is contained push it into our polygon
                        outerRings[x].push(hole);

                        // we matched the hole
                        matched = true;

                        // stop checking to see if other outer rings contian this hole
                        break;
                    }
                }

                // no outer rings contain this hole turn it into and outer ring (reverse it)
                if (!matched) {
                    outerRings.push([hole.reverse()]);
                }
            }

            if (outerRings.length === 1) {
                return {
                    type: 'Polygon',
                    coordinates: outerRings[0]
                };
            } else {
                return {
                    type: 'MultiPolygon',
                    coordinates: outerRings
                };
            }
        },
        // ArcGIS -> GeoJSON
        toGeoJson: function (arcgis, options) {
            var geojson = {};

            options = options || {};
            options.idAttribute = options.idAttribute || undefined;

            if (typeof arcgis.x === 'number' && typeof arcgis.y === 'number') {
                geojson.type = 'Point';
                geojson.coordinates = [arcgis.x, arcgis.y];
                if (arcgis.z || arcgis.m) {
                    geojson.coordinates.push(arcgis.z);
                }
                if (arcgis.m) {
                    geojson.coordinates.push(arcgis.m);
                }
            }

            if (arcgis.points) {
                geojson.type = 'MultiPoint';
                geojson.coordinates = arcgis.points.slice(0);
            }

            if (arcgis.paths) {
                if (arcgis.paths.length === 1) {
                    geojson.type = 'LineString';
                    geojson.coordinates = arcgis.paths[0].slice(0);
                } else {
                    geojson.type = 'MultiLineString';
                    geojson.coordinates = arcgis.paths.slice(0);
                }
            }

            if (arcgis.rings) {
                geojson = this.convertRingsToGeoJSON(arcgis.rings.slice(0));
            }

            return new Primitive(geojson);
        },
        toWkt: function (arcgis) {
            var primitive = this.toGeoJson(arcgis);

            switch (primitive.type) {
                case 'Point':
                    return this.pointToWKTPoint(primitive);
                case 'LineString':
                    return this.lineStringToWKTLineString(primitive);
                case 'Polygon':
                    return this.polygonToWKTPolygon(primitive);
                case 'MultiPoint':
                    return this.multiPointToWKTMultiPoint(primitive);
                case 'MultiLineString':
                    return this.multiLineStringToWKTMultiLineString(primitive);
                case 'MultiPolygon':
                    return this.multiPolygonToWKTMultiPolygon(primitive);
                default:
                    throw Error ('Unknown Type: ' + primitive.type);
            }
        },
        pointToWKTPoint: function (primitive) {
            var ret = 'POINT ';

            if (primitive.coordinates === undefined || primitive.coordinates.length === 0) {
                ret += 'EMPTY';

                return ret;
            } else if (primitive.coordinates.length === 3) {
                // 3d or time? default to 3d
                if (primitive.properties && primitive.properties.m === true) {
                    ret += 'M ';
                } else {
                    ret += 'Z ';
                }
            } else if (primitive.coordinates.length === 4) {
                // 3d and time
                ret += 'ZM ';
            }

            // include coordinates
            ret += '(' + primitive.coordinates.join(' ') + ')';

            return ret;
        },
        arrayToRing: function (arr) {
            var parts = [];
            var ret = '';

            for (var i = 0; i < arr.length; i++) {
                parts.push(arr[i].join(' '));
            }

            ret += '(' + parts.join(', ') + ')';

            return ret;
        },
        lineStringToWKTLineString: function (primitive) {
            var ret = 'LINESTRING ';

            if (primitive.coordinates === undefined || primitive.coordinates.length === 0 || primitive.coordinates[0].length === 0) {
                ret += 'EMPTY';

                return ret;
            } else if (primitive.coordinates[0].length === 3) {
                if (primitive.properties && primitive.properties.m === true) {
                    ret += 'M ';
                } else {
                    ret += 'Z ';
                }
            } else if (primitive.coordinates[0].length === 4) {
                ret += 'ZM ';
            }

            ret += this.arrayToRing(primitive.coordinates);

            return ret;
        },
        polygonToWKTPolygon: function (primitive) {
            var ret = 'POLYGON ';

            if (primitive.coordinates === undefined || primitive.coordinates.length === 0 || primitive.coordinates[0].length === 0) {
                ret += 'EMPTY';

                return ret;
            } else if (primitive.coordinates[0][0].length === 3) {
                if (primitive.properties && primitive.properties.m === true) {
                    ret += 'M ';
                } else {
                    ret += 'Z ';
                }
            } else if (primitive.coordinates[0][0].length === 4) {
                ret += 'ZM ';
            }

            ret += '(';
            var parts = [];
            for (var i = 0; i < primitive.coordinates.length; i++) {
                parts.push(this.arrayToRing(primitive.coordinates[i]));
            }

            ret += parts.join(', ');
            ret += ')';

            return ret;
        },
        multiPointToWKTMultiPoint: function (primitive) {
            var ret = 'MULTIPOINT ';

            if (primitive.coordinates === undefined || primitive.coordinates.length === 0 || primitive.coordinates[0].length === 0) {
                ret += 'EMPTY';

                return ret;
            } else if (primitive.coordinates[0].length === 3) {
                if (primitive.properties && primitive.properties.m === true) {
                    ret += 'M ';
                } else {
                    ret += 'Z ';
                }
            } else if (primitive.coordinates[0].length === 4) {
                ret += 'ZM ';
            }

            ret += this.arrayToRing(primitive.coordinates);

            return ret;
        },
        multiLineStringToWKTMultiLineString: function (primitive) {
            var ret = 'MULTILINESTRING ';

            if (primitive.coordinates === undefined || primitive.coordinates.length === 0 || primitive.coordinates[0].length === 0) {
                ret += 'EMPTY';

                return ret;
            } else if (primitive.coordinates[0][0].length === 3) {
                if (primitive.properties && primitive.properties.m === true) {
                    ret += 'M ';
                } else {
                    ret += 'Z ';
                }
            } else if (primitive.coordinates[0][0].length === 4) {
                ret += 'ZM ';
            }

            ret += '(';
            var parts = [];
            for (var i = 0; i < primitive.coordinates.length; i++) {
                parts.push(this.arrayToRing(primitive.coordinates[i]));
            }

            ret += parts.join(', ');
            ret += ')';

            return ret;
        },
        multiPolygonToWKTMultiPolygon: function (primitive) {
            var ret = 'MULTIPOLYGON ';

            if (primitive.coordinates === undefined || primitive.coordinates.length === 0 || primitive.coordinates[0].length === 0) {
                ret += 'EMPTY';

                return ret;
            } else if (primitive.coordinates[0][0][0].length === 3) {
                if (primitive.properties && primitive.properties.m === true) {
                    ret += 'M ';
                } else {
                    ret += 'Z ';
                }
            } else if (primitive.coordinates[0][0][0].length === 4) {
                ret += 'ZM ';
            }

            ret += '(';
            var inner = [];
            for (var c = 0; c < primitive.coordinates.length; c++) {
                var it = '(';
                var parts = [];
                for (var i = 0; i < primitive.coordinates[c].length; i++) {
                    parts.push(this.arrayToRing(primitive.coordinates[c][i]));
                }

                it += parts.join(', ');
                it += ')';

                inner.push(it);
            }

            ret += inner.join(', ');
            ret += ')';

            return ret;
        }
    });
});
