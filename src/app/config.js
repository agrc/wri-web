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
    esriConfig.defaults.map.zoomSymbol.outline.color = [18, 192, 236, 255];

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

    var config = {
        // errorLogger: ijit.modules.ErrorLogger
        errorLogger: null,

        // app: app.App
        //      global reference to App
        app: null,

        // version.: String
        //      The version number.
        version: '0.3.0',

        // apiKey: String
        //      The api key used for services on api.mapserv.utah.gov
        apiKey: apiKey, // acquire at developer.mapserv.utah.gov

        // scaleTrigger: int
        // summary:
        //      the basemap level to toggle centroids
        scaleTrigger: 8,

        urls: {
            mapService: gisServerBaseUrl + serviceUrlTemplate.replace('{{name}}', 'MapService'),
            centroidService: gisServerBaseUrl + serviceUrlTemplate.replace('{{name}}', 'Projects') + '/0',
            reference: gisServerBaseUrl + serviceUrlTemplate.replace('{{name}}', 'Reference'),
            api: gisServerBaseUrl + apiEndpoint + '/api'
        },

        layerIndices: {
            point: 0,
            line: 1,
            poly: 2
        },

        fieldNames: {
            Project_ID: 'Project_ID',
            Status: 'Status',
            TypeCode: 'TypeCode',
            Title: 'Title',
            Name: 'Name',
            DWR_REGION: 'DWR_REGION',
            FO_NAME: 'FO_NAME',
            LABEL_FEDERAL: 'LABEL_FEDERAL'
        },

        featureTypesInTables: {
            0: 'POLY',
            1: 'POLY',
            2: 'POINT',
            3: 'POLY',
            5: 'POLY',
            6: 'LINE',
            7: 'LINE',
            8: 'LINE',
            9: 'POINT',
            10: 'POINT',
            11: 'POINT',
            12: 'POINT'
        },

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
                extentChanged: 'wri/extentChanged',
                toggleCentroids: 'wri/toggle',
                setExtent: 'wri/setExtent',
                setMap: 'wri/setMap',
                rubberBandZoom: 'wri/rubberbanding',
                toggleAdjacent: 'wri/toggleAdjacent'
            },
            layer: {
                add: 'wri/add'
            },
            centroidController: {
                updateVisibility: 'wri/thisFeelsBad'
            },
            toggleReferenceLayer: 'wri/toggleReferenceLayer'
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
    var flds = config.fieldNames;
    config.supportLayers = [{
        name: 'UWRI Focus Areas',
        reference: true,
        url: config.urls.reference + '/0'
    }, {
        name: 'BLM Districts',
        reference: true,
        search: true,
        url: config.urls.reference + '/1',
        searchFields: [flds.FO_NAME],
        displayField: flds.FO_NAME,
        highlightSymbol: config.symbols.selected.poly
    }, {
        name: 'Forest Service',
        reference: true,
        search: true,
        url: config.urls.reference + '/2',
        searchFields: [flds.LABEL_FEDERAL],
        displayField: flds.LABEL_FEDERAL,
        highlightSymbol: config.symbols.selected.poly
    }, {
        name: 'HUC',
        reference: true,
        url: config.urls.reference + '/3'
    }, {
        name: 'Land Ownership',
        reference: true,
        url: config.urls.reference + '/4'
    }, {
        name: 'Sage Grouse Areas',
        reference: true,
        url: config.urls.reference + '/5'
    }, {
        name: 'UWRI Regions',
        reference: true,
        search: true,
        url: config.urls.reference + '/6',
        searchFields: [flds.DWR_REGION],
        displayField: flds.DWR_REGION,
        highlightSymbol: config.symbols.selected.poly
    }, {
        name: 'WRI Projects',
        search: true,
        url: config.urls.centroidService,
        searchFields: [flds.Project_ID, flds.Title],
        displayField: flds.Title,
        highlightSymbol: config.symbols.selected.point
    }, {
        name: 'SGID Places',
        search: true,
        url: config.urls.reference + '/7',
        searchFields: [flds.Name],
        displayField: flds.Name,
        highlightSymbol: config.symbols.selected.poly
    }];

    return config;
});
