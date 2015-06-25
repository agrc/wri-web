/* jshint maxlen:false */
define(['dojo/has', 'esri/config'], function (has, esriConfig) {
    // force api to use CORS on mapserv thus removing the test request on app load
    // e.g. http://mapserv.utah.gov/ArcGIS/rest/info?f=json
    esriConfig.defaults.io.corsEnabledServers.push('mapserv.utah.gov');
    esriConfig.defaults.io.corsEnabledServers.push('basemaps.utah.gov');

    var apiKey;
    var gisServerBaseUrl;
    if (has('agrc-build') === 'prod') {
        // mapserv.utah.gov
        apiKey = 'AGRC-A94B063C533889';
        gisServerBaseUrl = 'https://wrimaps.utah.gov';
    } else if (has('agrc-build') === 'stage') {
        // test.mapserv.utah.gov
        apiKey = 'AGRC-AC122FA9671436';
        gisServerBaseUrl = 'https://wrimaps.at.utah.gov';
    } else {
        // localhost
        apiKey = 'AGRC-E5B94F99865799';
        gisServerBaseUrl = 'http://localhost/wri';
    }
    esriConfig.defaults.io.corsEnabledServers.push(gisServerBaseUrl);

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
            mapService: gisServerBaseUrl + '/arcgis/rest/services/WRI/MapService/MapServer',
            api: gisServerBaseUrl + '/api'
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
            projectIdsChanged: 'wri/projectIdsChanged'
        }
    };

    return window.AGRC;
});
