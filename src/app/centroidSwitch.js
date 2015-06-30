define([
  'app/config',
  'app/mapController',

  'dojo/_base/lang',
  'dojo/Deferred',
  'dojo/promise/all',
  'dojo/topic',
  'dojo/when',

  'esri/layers/FeatureLayer'
], function (
  config,
  mapController,

  lang,
  Deferred,
  all,
  topic,
  when,

  FeatureLayer
) {
    var obj = {
      // scaleTrigger: int
      // summary:
      //      the trigger value to where the centroids explode to featureSelected
      scaleTrigger:  8,

      // override: bool
      // summary:
      //      override the trigger
      override: false,

      // definitionExpression: String
      // summary:
      //      the expression used to hide the project being looked at or only show centroids
      //      for a certain collection of projects
      definitionExpression: '',

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
          console.log('app.centroidSwitch::startup', arguments);

          topic.subscribe(config.topics.projectIdsChanged, lang.hitch(this, 'switchLayersFromProject'));
          topic.subscribe(config.topics.map.extentChange, lang.hitch(this, 'switchLayersFromExtent'));
          topic.subscribe(config.topics.map.toggleCentroids, lang.hitch(this, 'updateOverride'));
      },
      switchLayersFromProject: function (ids) {
          // summary:
          //      decides whether to show the centroids or not
          // ids
          console.log('app.centroidSwitch::switchLayersFromProject', arguments);

          if (!ids || ids.length === 1) {
              this.enabled = false;

              if (this.centroidLayer) {
                  this.centroidLayer.setVisibility(false);
              }

              if (this.explodedLayer) {
                  Object.keys(this.explodedLayer).forEach(function (key) {
                      var layer = this.explodedLayer[key];
                      layer.setVisibility(true);
                  }, this);
              }

              return;
          }

          this.enabled = true;
      },
      switchLayersFromExtent: function (extent) {
          // summary:
          //      decides whether to show the centroids or not
          // extent: https://developers.arcgis.com/javascript/jsapi/map-amd.html#event-extent-change
          console.log('app.centroidSwitch::switchLayersFromExtent', arguments);

          if (!this.enabled) {
              return;
          }

          // if they are just panning don't worry about it
          // if the delta is null, it is the first load so
          // we need to show the centroids
          if (!extent.levelChange && extent.delta) {
              return;
          }

          when(this._loadLayers(), lang.hitch(this, function () {
              if (this.override) {
                  this.centroidLayer.setVisibility(false);
                  Object.keys(this.explodedLayer).forEach(function (key) {
                      var layer = this.explodedLayer[key];
                      layer.setVisibility(true);
                  }, this);

                  return;
              }

              this.centroidLayer.setVisibility(extent.lod.level < this.scaleTrigger);
              Object.keys(this.explodedLayer).forEach(function (key) {
                  var layer = this.explodedLayer[key];
                  layer.setVisibility(extent.lod.level >= this.scaleTrigger);
              }, this);
          }));
      },
      updateOverride: function (value) {
          // summary:
          //      sets the override to true or false
          // value: boolean
          console.log('app.centroidSwitch::updateOverride', arguments);

          this.override = value;

          var lod = {};
          lang.setObject('level', mapController.map.getLevel(), lod);

          this.switchLayersFromExtent({
              levelChange: true,
              extent: mapController.map.extent,
              lod: lod,
              delta: true
          });
      },
      _loadLayers: function () {
          // summary:
          //      adds the new layers if they haven't been yet
          console.log('app.centroidSwitch::_loadLayers', arguments);

          if (Object.keys(this.explodedLayer) === 0 || !this.centroidLayer) {
              var li = config.layerIndices;
              var deferreds = [];
              var typesLookup = {
                  0: 'poly-exploded',
                  1: 'line-exploded',
                  2: 'point-exploded'
              };

              [li.poly, li.line, li.point].forEach(function (layerIndex, i) {
                  var layer = new FeatureLayer(config.urls.mapService + '/' + layerIndex, {
                      id: typesLookup[i]
                  });

                  var deferred = new Deferred();

                  layer.on('load', deferred.resolve);

                  deferreds.push(deferred);

                  this.explodedLayer[typesLookup[i]] = layer;
              }, this);

              this.centroidLayer = new FeatureLayer(config.urls.centroidService, {
                  id: 'Centroid'
              });

              topic.publish(config.topics.layer.add, {
                  graphicsLayers: [this.explodedLayer['poly-exploded'],
                                   this.explodedLayer['line-exploded'],
                                   this.explodedLayer['point-exploded'],
                                   this.centroidLayer
                               ],
                  dynamicLayers: []
              });

              return all(deferreds);
          }

          return true;
      }
  };

    return obj;
});
