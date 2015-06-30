define([
  'app/config',
  'app/graphicsUtils',
  'app/router',

  'dojo/_base/lang',
  'dojo/Deferred',
  'dojo/dom-construct',
  'dojo/dom-style',
  'dojo/promise/all',
  'dojo/text!app/templates/projectPopupTemplate.html',
  'dojo/topic',

  'esri/dijit/InfoWindowLite',
  'esri/layers/FeatureLayer',
  'esri/SpatialReference',
  'esri/tasks/query'
], function (
  config,
  graphicsUtils,
  router,

  lang,
  Deferred,
  domConstruct,
  domStyle,
  all,
  projectPopupTemplate,
  topic,

  InfoWindowLite,
  FeatureLayer,
  SpatialReference,
  Query
) {
    return {
      // scaleTrigger: int
      // summary:
      //      the trigger value to where the centroids explode to featureSelected
      scaleTrigger:  8,

      // override: bool
      // summary:
      //      override the trigger
      override: false,

      // where:  String
      // summary:
      //      the expression used to hide the project being looked at or only show centroids
      //      for a certain collection of projects
      where: '',

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

      startup: function () {
          // summary:
          //      get everyting started and setup
          console.log('app.centroidController::startup', arguments);

          topic.subscribe(config.topics.map.extentChanged, lang.hitch(this, 'onExtentChanged'));
          topic.subscribe(config.topics.map.toggleCentroids, lang.hitch(this, 'updateOverride'));

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

          // if they are just panning don't worry about it
          // if the delta is null, it is the first load so
          // we need to show the centroids
          if (!this.layersLoaded || !this.enabled || (!extent.levelChange && extent.delta)) {
              return;
          }

          if (this.override) {
              this.centroidsVisible = false;

              this.showFeaturesFor(this.where);

              Object.keys(this.explodedLayer).forEach(function (key) {
                  var layer = this.explodedLayer[key];

                  layer.setVisibility(true);
              }, this);

              this.centroidLayer.setVisibility(false);

              return;
          }

          this.centroidsVisible = extent.lod.level < this.scaleTrigger;

          this.centroidLayer.setVisibility(this.centroidsVisible);

          Object.keys(this.explodedLayer).forEach(function (key) {
              var layer = this.explodedLayer[key];

              layer.setVisibility(extent.lod.level >= this.scaleTrigger);
          }, this);
      },
      updateOverride: function (value) {
          // summary:
          //      sets the override to true or false
          // value: boolean
          console.log('app.centroidController::updateOverride', arguments);

          this.override = value;

          this._updateHash(null);

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
                  0: 'poly-exploded',
                  1: 'line-exploded',
                  2: 'point-exploded'
              };

              this.centroidLayer = new FeatureLayer(config.urls.centroidService, {
                  id: 'Centroid',
                  mode: FeatureLayer.MODE_SELECTION,
                  outFields: ['Title', 'Status', 'Project_ID']
              });

              this.centroidLayer.setVisibility(false);
              this.centroidLayer.on('mouse-over', lang.hitch(this, lang.partial(this._showPopupForProject, true)));
              this.centroidLayer.on('mouse-out', lang.hitch(this, lang.partial(this._showPopupForProject, false)));
              this.centroidLayer.on('click', lang.hitch(this, '_updateHash'));

              this.centroidLayer.on('load', d.resolve);

              deferreds.push(d);

              [li.poly, li.line, li.point].forEach(function (layerIndex, i) {
                  var layer = new FeatureLayer(config.urls.mapService + '/' + layerIndex, {
                      id: typesLookup[i],
                      mode: FeatureLayer.MODE_SELECTION
                  });

                  layer.setVisibility(false);

                  var deferred = new Deferred();

                  layer.on('load', deferred.resolve);

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
          // extent: {5:type or return: type}
          console.log('app.mapControls.centroidController::updateLayerVisibilityFor', arguments);

          if (!extent) {
              return;
          }

          this.onExtentChanged(extent);
      },
      showFeaturesFor: function (where) {
          // summary:
          //      selects features for the where clause
          // where: {5:type or return: type}
          console.log('app.centroidController::showFeaturesFor', arguments);

          var q = new Query();
          q.where = where || this.where;

          this.where = where;

          var deferreds = [];

          if (this.centroidsVisible) {
              deferreds.push(this.centroidLayer.selectFeatures(q));
          } else {
              Object.keys(this.explodedLayer).forEach(function (key) {
                  var layer = this.explodedLayer[key];
                  deferreds.push(layer.selectFeatures(q));
              }, this);
          }

          if (this.where === '1 = 1') {
              return null;
          }

          return all(deferreds).then(
              function (graphics) {
                  if (graphics === null) {
                      // state of utah extent
                      return null;
                  } else {
                      return graphicsUtils.unionGraphicsIntoExtent(graphics);
                  }
              }
          );
      },
      _showPopupForProject: function (show, evt) {
          // summary:
          //      shows the dialog popup
          // evt: https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
          console.log('app.centroidController::_showPopupForProject', arguments);

          domStyle.set(evt.target, {cursor: 'pointer'});
          if (!show) {
              this.dialog.hide();
              return;
          }

          var point = evt.graphic.geometry;
          point.setSpatialReference(new SpatialReference(26912));

          this.dialog.setTitle(lang.replace('<strong>{graphic.attributes.Title}</strong>', evt));
          this.dialog.setContent(lang.replace(projectPopupTemplate, evt));
          this.dialog.show(point, point);
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
      }
  };
});
