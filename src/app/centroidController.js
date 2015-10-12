define([
    'app/config',
    'app/router',

    'dojo/Deferred',
    'dojo/dom-construct',
    'dojo/dom-style',
    'dojo/on',
    'dojo/promise/all',
    'dojo/text!app/templates/projectPopupTemplate.html',
    'dojo/topic',
    'dojo/_base/lang',

    'esri/dijit/InfoWindowLite',
    'esri/geometry/Extent',
    'esri/layers/FeatureLayer',
    'esri/tasks/query'
], function (
    config,
    router,

    Deferred,
    domConstruct,
    domStyle,
    on,
    all,
    projectPopupTemplate,
    topic,
    lang,

    InfoWindowLite,
    Extent,
    FeatureLayer,
    Query
) {
    return {
        // override: bool
        // summary:
        //      override the trigger
        override: false,

        // where:  String
        // summary:
        //      the expression used to hide the project being looked at or only show centroids
        //      for a certain collection of projects
        where: '1=1',

        // filter: String
        //      the definition query set by the filters
        filter: '',

        // centroidLayer: FeatureLayer
        // summary:
        //      the centroid feature layer
        centroidLayer: null,

        // explodedLayer: FeatureLayer
        // summary:
        //      the exploded projects
        explodedLayer: {},

        // enabled: boolean
        // summary:
        //      whether or not to care about this stuff
        enabled: true,

        // pausables: array
        //      an array of pausable event handlers
        pausables: [],

        featureQueryTxt: '{{Project_ID}} IN(SELECT {{Project_ID}} FROM PROJECT WHERE {{query}})'
            .replace(/{{Project_ID}}/g, config.fieldNames.Project_ID),

        centroidsVisible: true,

        // isDrawing: Boolean
        //      Used to disable clicking on adjacent features while drawing
        isDrawing: false,

        startup: function () {
            // summary:
            //      get everyting started and setup
            console.log('app.centroidController::startup', arguments);

            var that = this;
            topic.subscribe(config.topics.map.extentChanged, lang.hitch(this, 'onExtentChanged'));
            topic.subscribe(config.topics.map.toggleCentroids, lang.hitch(this, 'updateOverride'));
            topic.subscribe(config.topics.map.rubberBandZoom, lang.hitch(this, '_pauseEvent'));
            topic.subscribe(config.topics.filterQueryChanged, lang.hitch(this, 'onFilterQueryChanged'));
            topic.subscribe(config.topics.feature.drawEditComplete, function () {
                that.isDrawing = false;
            });
            topic.subscribe(config.topics.feature.startDrawing, function () {
                that.isDrawing = true;
            });

            this.dialog = new InfoWindowLite(null, domConstruct.create('div', null, document.body, 'last'));
            this.dialog._adjustContentArea = function () {};
            this.dialog.height = 'auto';
            this.dialog.startup();
            topic.publish(config.topics.map.setMap, this.dialog);
        },
        onExtentChanged: function (extent) {
            // summary:
            //      decides whether to show the centroids or not
            // extent: https://developers.arcgis.com/javascript/jsapi/map-amd.html#event-extent-change
            console.log('app.centroidController::onExtentChanged', arguments);

            // if the delta is null, it is the first load so
            // we need to show the centroids
            if (!this.layersLoaded || !this.enabled) {
                return;
            }

            this.centroidsVisible = extent.lod.level < config.scaleTrigger;

            if (this.override) {
                this.centroidsVisible = false;
            }

            this.centroidLayer.setVisibility(this.centroidsVisible);

            Object.keys(this.explodedLayer).forEach(function (key) {
                var layer = this.explodedLayer[key];

                layer.setVisibility(!this.centroidsVisible);
            }, this);

            this.showFeaturesFor();
        },
        updateOverride: function (value) {
            // summary:
            //      sets the override to true or false
            // value: boolean
            console.log('app.centroidController::updateOverride', arguments);

            this.override = value;

            topic.publish(config.topics.centroidController.updateVisibility, {});
        },
        ensureLayersLoaded: function () {
            // summary:
            //      adds the new layers if they haven't been yet
            console.log('app.centroidController::ensureLayersLoaded', arguments);

            if (this.layersLoaded) {
                return true;
            }

            if (Object.keys(this.explodedLayer) === 0 || !this.centroidLayer) {
                var li = config.layerIndices;
                var deferreds = [];
                var d = new Deferred();
                var typesLookup = {
                    0: 'polyExploded',
                    1: 'lineExploded',
                    2: 'pointExploded'
                };

                this.centroidLayer = new FeatureLayer(config.urls.centroidService, {
                    id: 'Centroid',
                    outFields: ['Title', 'Status', 'Project_ID']
                });
                this.centroidLayer.__where__ = '';

                this.centroidLayer.setVisibility(false);
                this.pausables.push(on.pausable(this.centroidLayer, 'mouse-over', lang.hitch(this, lang.partial(this._showPopupFor, true, true))));
                this.pausables.push(on.pausable(this.centroidLayer, 'mouse-out', lang.hitch(this, lang.partial(this._showPopupFor, false, true))));

                this.centroidLayer.on('click', lang.hitch(this, '_updateHash'));
                this.centroidLayer.on('mouse-down', lang.hitch(this, '_pauseEvent'));

                this.centroidLayer.on('load', d.resolve);

                deferreds.push(d);

                [li.poly, li.line, li.point].forEach(function (layerIndex, i) {
                    var layer = new FeatureLayer(config.urls.featuresService + '/' + layerIndex, {
                        id: typesLookup[i],
                        outFields: ['StatusDescription', 'Project_ID', 'Title']
                    });

                    layer.setVisibility(false);
                    layer.__where__ = '';

                    var deferred = new Deferred();

                    layer.on('load', deferred.resolve);
                    this.pausables.push(on.pausable(layer, 'mouse-over', lang.hitch(this, lang.partial(this._showPopupFor, true, false))));
                    this.pausables.push(on.pausable(layer, 'mouse-out', lang.hitch(this, lang.partial(this._showPopupFor, false, false))));
                    var that = this;
                    layer.on('click', function (evt) {
                        if (!that.isDrawing) {
                            that._updateHash(evt);
                        }
                    });
                    layer.on('mouse-down', lang.hitch(this, '_pauseEvent'));

                    deferreds.push(deferred);

                    this.explodedLayer[typesLookup[i]] = layer;
                }, this);

                this.layersLoaded = true;

                return all(deferreds);
            }

            return true;
        },
        updateLayerVisibilityFor: function (extent) {
            // summary:
            //      mimics the extent change event to trigger the decision tree of whether to show or hide centroids
            // extent: esri/Extent
            console.log('app.mapControls.centroidController::updateLayerVisibilityFor', arguments);

            if (!extent) {
                return;
            }

            this.onExtentChanged(extent);
        },
        showFeaturesFor: function (where) {
            // summary:
            //      selects features for the where clause
            // where: String
            console.log('app.centroidController::showFeaturesFor', arguments);

            var defExpression = where || this.where;
            this.where = defExpression;

            if (this.filter) {
                defExpression += ' AND ' + this.filter;
            }

            // guards against extra queries for invisible layers
            if (this.centroidsVisible) {
                if (this.centroidLayer.__where__ === defExpression) {
                    return;
                }

                this.centroidLayer.setDefinitionExpression(defExpression);
                this.centroidLayer.__where__ = defExpression;
            } else {
                defExpression = this.featureQueryTxt.replace('{{query}}', defExpression);
                if (this.explodedLayer.pointExploded.__where__ === defExpression) {
                    return;
                }

                Object.keys(this.explodedLayer).forEach(function (key) {
                    var layer = this.explodedLayer[key];

                    layer.setDefinitionExpression(defExpression);
                    layer.__where__ = defExpression;
                }, this);
            }

            if (where && where !== '1=1') {
                // no need to set query.where since FeatureLayer honors setDefinitionExpression
                return this.centroidLayer.queryExtent(new Query()).then(function (response) {
                    if (response.count > 0) {
                        return new Extent(response.extent);
                    } else {
                        topic.publish(config.topics.toast, { message: 'No project extents found!', type: 'danger' });
                    }
                });
            }
        },
        showAdjacentFeatures: function (where) {
            // summary:
            //      selects features
            // where
            console.log('app.centroidController::showAdjacentFeatures', arguments);

            if (where === '1=1') {
                return null;
            }

            this.centroidLayer.setVisibility(false);

            Object.keys(this.explodedLayer).forEach(function (key) {
                var layer = this.explodedLayer[key];

                var cssClass = 'adjacent';

                if (key === 'lineExploded') {
                    cssClass = 'adjacent-line';
                }

                layer.getNode().setAttribute('class', cssClass);

                layer.setDefinitionExpression(where);
                layer.setVisibility(true);

            }, this);
        },
        _showPopupFor: function (show, isProject, evt) {
            if (this.isDrawing) {
                return;
            }

            if (!show) {
                this.dialog.hide();

                domStyle.set(evt.target, {
                    cursor: ''
                });

                return;
            }

            domStyle.set(evt.target, {
                cursor: 'pointer'
            });

            // take space out of Pending Completed status
            if (evt.graphic.attributes.Status) {
                evt.graphic.attributes.statusClass = evt.graphic.attributes.Status.replace(' ', '');
            }

            if (evt.graphic.attributes.StatusDescription) {
                evt.graphic.attributes.statusClass = evt.graphic.attributes.StatusDescription.replace(' ', '');
                evt.graphic.attributes.Status = evt.graphic.attributes.StatusDescription;
            }

            this.dialog.setTitle(lang.replace('<strong>{graphic.attributes.Title}</strong>', evt));
            this.dialog.setContent(lang.replace(projectPopupTemplate, evt));

            this.dialog.show(evt.mapPoint, evt.mapPoint);
        },
        _updateHash: function (e) {
            // summary:
            //      pass the project_id to the router
            // e
            console.log('app.centroidController::_updateHash', arguments);

            this.dialog.hide();

            router.setHash({
                id: lang.getObject('graphic.attributes.Project_ID', null, e)
            });
        },
        _pauseEvent: function (dragging) {
            // summary:
            //      pauses the popup handlers if rubber band zooming.
            // dragging: bool, if rubber band zooming is true
            console.log('app.centroidController::_pauseEvent', arguments);

            if (dragging === true) {
                this.pausables.forEach(function (pausable) {
                    pausable.pause();
                });

                return;
            }

            this.pausables.forEach(function (pausable) {
                pausable.resume();
            });
        },
        onFilterQueryChanged: function (filters) {
            // summary:
            //      updates the def queries for all layers based on the filters
            // filters: {projectAndFeatureFilter: string, nonWriProjectFilter: string}
            console.log('app.centroidController:onFilterQueryChanged', arguments);

            if (!filters) {
                this.filter = undefined;
                return this.showFeaturesFor();
            }

            // create private props of all filters
            Object.keys(filters).forEach(function (key) {
                this['_' + key] = filters[key];
            }, this);

            var cleanFilters = [this._projectAndFeatureFilter, this._nonWriProjectFilter].filter(function (item) {
                return item;
            });

            this.filter = cleanFilters.join(' AND ');

            this.showFeaturesFor();
        }
    };
});
