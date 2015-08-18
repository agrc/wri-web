/* jshint maxlen:false */
define([
    'dojo/has',

    'esri/config',
    'esri/geometry/Extent',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleMarkerSymbol',

    'dojo/domReady!'
], function (
    has,

    esriConfig,
    Extent,
    SimpleFillSymbol,
    SimpleLineSymbol,
    SimpleMarkerSymbol
) {
    // force api to use CORS on mapserv thus removing the test request on app load
    // e.g. http://mapserv.utah.gov/ArcGIS/rest/info?f=json
    esriConfig.defaults.io.corsEnabledServers.push('mapserv.utah.gov');
    esriConfig.defaults.io.corsEnabledServers.push('basemaps.utah.gov');
    esriConfig.defaults.map.zoomSymbol.outline.color = [18, 192, 236, 255];

    var gisServerBaseUrl;
    var apiEndpoint;
    var serviceUrlTemplate = '/arcgis/rest/services/WRI/{{name}}/MapServer';
    var googleImageryUrl = 'https://discover.agrc.utah.gov/login/path/delete-prefix-stretch-giant/';

    if (has('agrc-build') === 'prod') {
        gisServerBaseUrl = 'https://wrimaps.utah.gov';
        apiEndpoint = '';
    } else if (has('agrc-build') === 'stage') {
        gisServerBaseUrl = 'https://wrimaps.at.utah.gov';
        apiEndpoint = '/__WRI_CONFIGURATION__';
        serviceUrlTemplate = '/arcgis/rest/services/__WRI_CONFIGURATION__/{{name}}/MapServer';
    } else {
        gisServerBaseUrl = '';
        apiEndpoint = '/wri';
        googleImageryUrl = 'https://discover.agrc.utah.gov/login/path/alabama-anvil-picnic-sunset/';
    }
    esriConfig.defaults.io.corsEnabledServers.push(gisServerBaseUrl);
    var selectionColor = [255, 220, 0];

    var config = {
        // app: app.App
        //      global reference to App
        app: null,

        // version.: String
        //      The version number.
        version: '0.5.0',

        // scaleTrigger: Number
        //      the basemap level to toggle centroids
        scaleTrigger: 8,

        // popupDelay: Number
        //      The delay (in milliseconds) that popups delay before showing
        popupDelay: 250,

        // switchToGoogleScale: Number
        //      The scale at which the base map switches to the google imagery
        switchToGoogleScale: 4000,

        // defaultExtent: Extent
        //      The default extent of the map. (The state of utah)
        defaultExtent: new Extent({
            xmax: -12010849.397533866,
            xmin: -12898741.918094235,
            ymax: 5224652.298632992,
            ymin: 4422369.249751998,
            spatialReference: {
                wkid: 3857
            }
        }),

        urls: {
            featuresService: gisServerBaseUrl + serviceUrlTemplate.replace('{{name}}', 'Features'),
            centroidService: gisServerBaseUrl + serviceUrlTemplate.replace('{{name}}', 'Projects') + '/0',
            reference: gisServerBaseUrl + serviceUrlTemplate.replace('{{name}}', 'Reference'),
            api: gisServerBaseUrl + apiEndpoint + '/api',
            plss: '//basemaps.utah.gov/arcgis/rest/services/UtahPLSS/MapServer',
            rangeTrendApp: 'http://dwrapps.utah.gov/rangetrend/rtstart?SiteID=${GlobalID}',
            esriImagery: 'http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
            esriLabels: 'http://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer',
            esriTransLabels: 'http://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer',
            googleImagery: googleImageryUrl
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
            LABEL_FEDERAL: 'LABEL_FEDERAL',
            FeatureID: 'FeatureID',

            // range trend SiteInfo
            GlobalID: 'GlobalID',
            STUDY_NAME: 'STUDY_NAME'
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
                'Draft',
                'Proposed',
                'Current',
                'Pending Completed',
                'Completed',
                'Cancelled'
            ],
            featureType: [
                ['Terrestrial', 1],
                ['Aquatic/Riparian', 2],
                ['Affected Area', 3],
                ['Easement/Aquisition', 4],
                ['Guzzler', 5],
                ['Trough', 6],
                ['Water Control Structure', 7],
                ['Other', 8],
                ['Fish Passage Structure', 9],
                ['Fence', 10],
                ['Pipeline', 11],
                ['Dam', 12],
                ['Research', 13]
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
                toggleAdjacent: 'wri/toggleAdjacent',
                featureSelected: 'wri/mapFeatureSelected'
            },
            layer: {
                add: 'wri/add'
            },
            centroidController: {
                updateVisibility: 'wri/thisFeelsBad'
            },
            toggleReferenceLayer: 'wri/toggleReferenceLayer',
            toggleReferenceLayerLabels: 'wri/toggleReferenceLayerLabels',
            toast: 'wri/toast'
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
        },

        referenceLayerOpacity: 0.75
    };
    var flds = config.fieldNames;
    config.supportLayers = [{
        name: 'Land Ownership',
        reference: true,
        url: config.urls.reference,
        layerIndex: 4,
        type: 'dynamic',
        legend: true
    }, {
        name: 'UWRI Regions',
        reference: true,
        search: true,
        url: config.urls.reference,
        layerIndex: 6,
        labelsIndex: 9,
        type: 'dynamic',
        searchFields: [flds.DWR_REGION],
        displayField: flds.DWR_REGION,
        highlightSymbol: config.symbols.selected.poly
    }, {
        name: 'UWRI Focus Areas',
        reference: true,
        url: config.urls.reference,
        layerIndex: 0,
        type: 'dynamic',
        legend: true
    }, {
        name: 'BLM Districts',
        reference: true,
        search: true,
        url: config.urls.reference,
        layerIndex: 1,
        labelsIndex: 10,
        type: 'dynamic',
        searchFields: [flds.FO_NAME],
        displayField: flds.FO_NAME,
        highlightSymbol: config.symbols.selected.poly,
        legend: true
    }, {
        name: 'Forest Service',
        reference: true,
        search: true,
        url: config.urls.reference,
        layerIndex: 2,
        labelsIndex: 11,
        type: 'dynamic',
        searchFields: [flds.LABEL_FEDERAL],
        displayField: flds.LABEL_FEDERAL,
        highlightSymbol: config.symbols.selected.poly,
        legend: true
    }, {
        name: 'Sage Grouse Areas',
        reference: true,
        url: config.urls.reference,
        layerIndex: 5,
        labelsIndex: 5,
        type: 'dynamic',
        legend: true
    }, {
        name: 'PLSS Sections',
        reference: true,
        url: config.urls.plss,
        type: 'cached'
    }, {
        name: 'HUCs',
        reference: true,
        url: config.urls.reference,
        layerIndex: 3,
        labelsIndex: 13,
        type: 'dynamic'
    }, {
        name: 'Range Trend Sites',
        reference: true,
        url: config.urls.reference + '/8',
        type: 'range'
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
        url: config.urls.reference,
        layerIndex: 7,
        searchFields: [flds.Name],
        displayField: flds.Name,
        highlightSymbol: config.symbols.selected.poly
    }];

    return config;
});
