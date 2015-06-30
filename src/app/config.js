/* jshint maxlen:false */
define([
    'dojo/has',

    'esri/config',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleMarkerSymbol',

    'dojo/domReady!'
], function (
    has,

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
            Project_ID: 'Project_ID'
        },

        topics: {
            projectIdsChanged: 'wri/projectIdsChanged',
            featureSelected: 'wri/featureSelected',
            opacityChanged: 'wri/opacityChanged'
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
