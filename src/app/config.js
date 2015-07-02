/* jshint maxlen:false */
define([
    'dojo/has',
    'dojo/string',

    'esri/config',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleMarkerSymbol',

    'dojo/domReady!'
], function (
    has,
    dojoString,

    esriConfig,
    SimpleFillSymbol,
    SimpleLineSymbol,
    SimpleMarkerSymbol
) {
    // force api to use CORS on mapserv thus removing the test request on app load
    // e.g. http://mapserv.utah.gov/ArcGIS/rest/info?f=json
    esriConfig.defaults.io.corsEnabledServers.push('mapserv.utah.gov');
    esriConfig.defaults.io.corsEnabledServers.push('basemaps.utah.gov');

    var apiKey;
    var gisServerBaseUrl;
    var apiEndpoint;
    if (has('agrc-build') === 'prod') {
        // mapserv.utah.gov
        apiKey = 'AGRC-A94B063C533889';
        gisServerBaseUrl = 'https://wrimaps.utah.gov';
        apiEndpoint = '';
    } else if (has('agrc-build') === 'stage') {
        // test.mapserv.utah.gov
        apiKey = 'AGRC-AC122FA9671436';
        gisServerBaseUrl = 'https://wrimaps.at.utah.gov';
        apiEndpoint = '';
    } else {
        // localhost
        apiKey = 'AGRC-E5B94F99865799';
        gisServerBaseUrl = '';
        apiEndpoint = '/wri';
    }
    esriConfig.defaults.io.corsEnabledServers.push(gisServerBaseUrl);
    var selectionColor = [255, 255, 0];
    var serviceUrlTemplate = '/arcgis/rest/services/WRI/{{name}}/MapServer';
    var Project_ID = 'Project_ID';

    window.AGRC = {
        // errorLogger: ijit.modules.ErrorLogger
        errorLogger: null,

        // app: app.App
        //      global reference to App
        app: null,

        // version.: String
        //      The version number.
        version: '0.2.0',

        // apiKey: String
        //      The api key used for services on api.mapserv.utah.gov
        apiKey: apiKey, // acquire at developer.mapserv.utah.gov

        urls: {
            mapService: gisServerBaseUrl + serviceUrlTemplate.replace('{{name}}', 'MapService'),
            centroidService: gisServerBaseUrl + serviceUrlTemplate.replace('{{name}}', 'Projects') + '/0',
            api: gisServerBaseUrl + apiEndpoint + '/api'
        },

        layerIndices: {
            point: 0,
            line: 1,
            poly: 2
        },

        fieldNames: {
            Project_ID: Project_ID,
            Status: 'Status',
            TypeCode: 'TypeCode'
        },

        queryByFeaturesTxt: ['POINT', 'LINE', 'POLY'].reduce(function (previousValue, currentValue) {
            var query = dojoString.substitute('${0} IN (SELECT ${0} FROM ${1} WHERE {{query}})',
                [Project_ID, currentValue]);
            if (!previousValue) {
                return query;
            } else {
                return previousValue + ' OR ' + query;
            }
        }, false),

        domains: {
            projectStatus: [
                'Cancelled',
                'Complete',
                'Current',
                'Pending Complet',
                'Project',
                'Proposal',
                'Proposed'
            ],
            featureType: [
                ['Terrestrial', 0],
                ['Aquatic/Riparian', 1],
                ['Fish Passage Structure', 2],
                ['Easement/Aquisition', 3],
                ['Affected Area', 5],
                ['Dam', 6],
                ['Pipeline', 7],
                ['Fence', 8],
                ['Guzzler', 9],
                ['Trough', 10],
                ['Water Control Structure', 11],
                ['Other', 12]
            ]
        },

        topics: {
            projectIdsChanged: 'wri/projectIdsChanged',
            featureSelected: 'wri/featureSelected',
            opacityChanged: 'wri/opacityChanged',
            filterQueryChanged: 'wri/filterQueryChanged',
            map: {
                extentChange: 'wri/extentChange',
                toggleCentroids: 'wri/toggle'
            },
            layer: {
                add: 'wri/add'
            }
        },

        symbols: {
            selected: {
                point: new SimpleMarkerSymbol({
                    type: "esriSMS",
                    style: "esriSMSCircle",
                    color: selectionColor,
                    size: 10,
                    angle: 0,
                    xoffset: 0,
                    yoffset: 0,
                    outline: {
                        color: [0, 0, 0, 255],
                        width: 1
                    }
                }),
                line: new SimpleLineSymbol({
                    type: "esriSLS",
                    style: "esriSLSSolid",
                    color: selectionColor,
                    width: 4
                }),
                poly: new SimpleFillSymbol({
                    type: "esriSFS",
                    style: "esriSFSSolid",
                    color: selectionColor,
                    outline: {
                        type: "esriSLS",
                        style: "esriSLSSolid",
                        color: [110, 110, 110, 255],
                        width: 0.5
                    }
                })
            }
        }
    };

    return window.AGRC;
});
