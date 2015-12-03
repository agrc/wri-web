/* jshint maxlen:false */
define([
    'dojo/has',
    'dojo/request',
    'dojo/_base/lang',

    'esri/Color',
    'esri/config',
    'esri/geometry/Extent',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleMarkerSymbol',

    'dojo/domReady!'
], function (
    has,
    request,
    lang,

    Color,
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
    esriConfig.defaults.io.corsEnabledServers.push('wrimaps.at.utah.gov');
    esriConfig.defaults.io.corsEnabledServers.push('wrimaps.utah.gov');
    esriConfig.defaults.io.corsEnabledServers.push('maps.ffsl.utah.gov');
    esriConfig.defaults.io.corsEnabledServers.push('maps.dnr.utah.gov');
    esriConfig.defaults.io.corsEnabledServers.push('dwrapps.utah.gov');
    esriConfig.defaults.map.zoomSymbol.outline.color = [18, 192, 236, 255];

    var gisServerBaseUrl;
    var apiEndpoint;
    var serviceUrlTemplate = '/arcgis/rest/services/WRI/{name}/{type}Server';
    var googleImageryUrl = 'https://discover.agrc.utah.gov/login/path/delete-prefix-stretch-giant/';
    var plssUrl = 'https://__WRI_BASEURL__.utah.gov/arcgis/rest/services/UtahPLSS/MapServer';

    if (has('agrc-build') === 'prod') {
        gisServerBaseUrl = 'https://__WRI_BASEURL__.utah.gov';
        apiEndpoint = '/__WRI_CONFIGURATION__';
        serviceUrlTemplate = '/arcgis/rest/services/__WRI_CONFIGURATION__/{name}/{type}Server';
    } else {
        gisServerBaseUrl = 'http://' + window.location.host;
        apiEndpoint = '/wri';
        googleImageryUrl = 'https://discover.agrc.utah.gov/login/path/alabama-anvil-picnic-sunset/';
    }
    esriConfig.defaults.io.corsEnabledServers.push(gisServerBaseUrl);
    var selectionColor = [255, 220, 0];
    var landOwnershipLayerIndex = 4;
    var transparentColor = new Color([0, 0, 0, 0]);

    var config = {
        // app: app.App
        //      global reference to App
        app: null,

        // version.: String
        //      The version number.
        version: '0.13.1',

        // scaleTrigger: Number
        //      the basemap level to toggle centroids
        scaleTrigger: 13,

        // popupDelay: Number
        //      The delay (in milliseconds) that popups delay before showing
        popupDelay: 250,

        // switchToGoogleScale: Number
        //      The scale at which the base map switches to the google imagery
        switchToGoogleScale: 4000,

        // centerAndZoomLevel: Number
        //      The cache level to zoom to when zooming to a point
        centerAndZoomLevel: 18,

        // herbicideAction: String
        //      the name of the herbicide action
        herbicideActionName: 'HERBICIDE APPLICATION',

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
            featuresService: gisServerBaseUrl + lang.replace(serviceUrlTemplate, { name: 'Features', type: 'Map' }),
            centroidService: gisServerBaseUrl + lang.replace(serviceUrlTemplate, { name: 'Projects', type: 'Map' }) + '/0',
            reference: gisServerBaseUrl + lang.replace(serviceUrlTemplate, { name: 'Reference', type: 'Map' }),
            landOwnership: gisServerBaseUrl + lang.replace(serviceUrlTemplate, { name: 'Reference', type: 'Map' }) + '/' + landOwnershipLayerIndex,
            api: gisServerBaseUrl + apiEndpoint + '/api',
            plss: plssUrl,
            fireRiskIndex: 'https://maps.ffsl.utah.gov/arcgis/rest/services/Fire/FireRiskIndex/MapServer',
            rangeTrendApp: 'https://dwrapps.utah.gov/rangetrend/rtstart?SiteID=${GlobalID}',
            esriImagery: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
            esriLabels: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer',
            esriTransLabels: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer',
            googleImagery: googleImageryUrl,
            print: gisServerBaseUrl + lang.replace(serviceUrlTemplate, { name: 'Print', type: 'GP' }) + '/Export%20Web%20Map',
            upload: gisServerBaseUrl + lang.replace(serviceUrlTemplate, { name: 'Toolbox', type: 'GP'}) + '/uploads/upload',
            zipToGraphics: gisServerBaseUrl + lang.replace(serviceUrlTemplate, { name: 'Toolbox', type: 'GP'}) + '/ZipToGraphics',
            download: gisServerBaseUrl + lang.replace(serviceUrlTemplate, { name: 'ToolboxAsync', type: 'GP'}) + '/Download'
        },

        defaultXhrHeaders: {
            'Accept': 'application/json',
            'X-Requested-With': null
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
            1: 'POLY',
            2: 'POLY',
            3: 'POLY',
            4: 'POLY',
            5: 'POINT',
            6: 'POINT',
            7: 'POINT',
            8: 'POINT',
            9: 'POINT',
            10: 'LINE',
            11: 'LINE',
            12: 'LINE',
            13: 'POLY'
        },

        commentsFieldCategories: [
            'Other point feature',
            'Water control structure',
            'Trough'
        ],

        terrestrialAquaticCategories: [
            'Terrestrial Treatment Area',
            'Aquatic/Riparian Treatment Area'
        ],

        topics: {
            mapScaleChanged: 'wri/mapScaleChanged',
            projectIdsChanged: 'wri/projectIdsChanged',
            featureSelected: 'wri/featureSelected',
            selectionCleared: 'wri/selectionCleared',
            opacityChanged: 'wri/opacityChanged',
            filterQueryChanged: 'wri/filterQueryChanged',
            map: {
                extentChanged: 'wri/extentChanged',
                toggleCentroids: 'wri/toggle',
                setExtent: 'wri/setExtent',
                setMap: 'wri/setMap',
                rubberBandZoom: 'wri/rubberbanding',
                toggleAdjacent: 'wri/toggleAdjacent',
                featureSelected: 'wri/mapFeatureSelected',
                toggleWriProjects: 'wri/toggleWriProjects'
            },
            layer: {
                add: 'wri/add'
            },
            centroidController: {
                updateVisibility: 'wri/thisFeelsBad'
            },
            toggleReferenceLayer: 'wri/toggleReferenceLayer',
            toggleReferenceLayerLabels: 'wri/toggleReferenceLayerLabels',
            feature: {
                createFeature: 'wri/feature/createFeature',
                startDrawing: 'wri/feature/startDrawing',
                startEditing: 'wri/feature/startEditing',
                drawingComplete: 'wri/feature/drawingComplete',
                cutFeatures: 'wri/feature/cutFeatures',
                selectedForEditing: 'wri/feature/selectedForEditing',
                drawEditComplete: 'wri/feature/drawEditComplete',
                cancelDrawing: 'wri/feature/cancelDrawing',
                removeEditingGraphic: 'wri/feature/removeEditingGraphic',
                finishEditingCreating: 'wri/feature/finishEditingCreating'
            },
            toast: 'wri/toast',
            showProjectLoader: 'wri/showProjectLoader',
            hideProjectLoader: 'wri/hideProjectLoader',
            toggleSnapping: 'wri/toggleSnapping'
        },

        symbols: {
            selected: {
                point: new SimpleMarkerSymbol({
                    type: 'esriSMS',
                    style: 'esriSMSCircle',
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
                    type: 'esriSLS',
                    style: 'esriSLSSolid',
                    color: selectionColor,
                    width: 4
                }),
                poly: new SimpleFillSymbol({
                    type: 'esriSFS',
                    style: 'esriSFSSolid',
                    color: selectionColor,
                    outline: {
                        type: 'esriSLS',
                        style: 'esriSLSSolid',
                        color: [110, 110, 110, 255],
                        width: 0.5
                    }
                })
            },
            selectedPointForEditing: new SimpleMarkerSymbol({
                type: 'esriSMS',
                style: 'esriSMSCircle',
                color: [128, 128, 128, 128],
                size: 10,
                angle: 0,
                xoffset: 0,
                yoffset: 0,
                outline: {
                    color: [0, 0, 0, 255],
                    width: 1
                }
            }),
            empty: new SimpleFillSymbol().setColor(transparentColor).outline.setColor(transparentColor)
        },

        referenceLayerOpacity: 0.75
    };
    var flds = config.fieldNames;
    config.supportLayers = [{
        name: 'Land Ownership',
        reference: true,
        url: config.urls.reference,
        layerIndex: landOwnershipLayerIndex,
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
        highlightSymbol: config.symbols.selected.poly
    }, {
        name: 'Sage Grouse Areas',
        reference: true,
        url: config.urls.reference,
        layerIndex: 5,
        labelsIndex: 5,
        type: 'dynamic'
    }, {
        name: 'PLSS Sections',
        reference: true,
        url: config.urls.plss,
        type: 'cached',
        minScale: 1000000
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
        name: 'Fire Risk Index',
        reference: true,
        url: config.urls.fireRiskIndex,
        type: 'cached',
        legend: true,
        layerIndex: 0
    }, {
        name: 'NHD Streams',
        reference: true,
        url: config.urls.reference,
        layerIndex: 15,
        type: 'dynamic',
        minScale: 80000
    }, {
        name: 'WRI Project Name',
        search: true,
        url: config.urls.centroidService,
        searchFields: [flds.Title],
        highlightSymbol: config.symbols.selected.point
    },  {
        name: 'WRI Project ID',
        search: true,
        minCharacters: 1,
        url: config.urls.centroidService,
        searchFields: [flds.Project_ID],
        suggestionTemplate: '${' + flds.Project_ID + '}',
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

    request(require.baseUrl + 'jsonconfig/config.json', {
        handleAs: 'json',
        sync: true
    }).then(function (response) {
        config.domains = response;
    }, function () {
        throw 'Error getting config.json!';
    });

    return config;
});
