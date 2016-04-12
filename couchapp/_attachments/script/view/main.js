var $ = require('jquery');
var _ = require('lodash');
var Backbone = require('backbone');
var extent = require('turf-extent');
var nearest = require('turf-nearest');
var regions = require('../regions.json');
var point = require('turf-point');
var featurecollection = require('turf-featurecollection');
var BaseMap = require('./map.js');
var Timeline = require('./timeline.js');
require('leaflet');
require('heatmap.js');
var HeatmapOverlay = require('../vendor/leaflet-heatmap.js');

var heatmapConfig = {
   // radius should be small ONLY if scaleRadius is true (or small radius is intended)
   radius: 70,
   maxOpacity: .8,
   // scales the radius based on map zoom
   scaleRadius: false,
   // if set to false the heatmap uses the global maximum for colorization
   // if activated: uses the data maximum within the current map boundaries
   //   (there will always be a red spot with useLocalExtremas true)
   useLocalExtrema: true,
   // which field name in your data represents the latitude - default "lat"
   latField: 'latitude',
   // which field name in your data represents the longitude - default "lng"
   lngField: 'longitude',
   // which field name in your data represents the data value - default "value"
   valueField: 'average'
};

module.exports = Backbone.View.extend({
   initialize: function() {
      this.heatmapLayer = new HeatmapOverlay(heatmapConfig);

      this.timeline = new Timeline({
         id: 'heatmap-timeline'
      });

      this.map = new BaseMap({
         id: 'map-canvas'
      });

      this.collection.on('reset', this.update, this);
      this.timeline.model.on('change:selected', this.handleDateSelect, this);
      this.map.model.on('change:center', _.debounce(this.handleCenterChange, 500), this);
   },
   update: function(features) {
      var years = this.getUniqYears(features.toJSON());
      var bbox = extent(featurecollection(features.toJSON()));

      this.map.model.set({
         bounds: [[bbox[1], bbox[0]], [bbox[3], bbox[2]]],
         layers: this.map.model.get('layers').concat(this.heatmapLayer)
      });

      this.setHeatmap(features.toJSON(), years[0]);

      this.timeline.model.set({
         selected: years[0],
         dates: years
      });
   },
   getHeatmap: function(features, year) {
      return _.map(_.filter(features, {properties: {year: year}}), function(feature) {
         return  {
            latitude: feature.geometry.coordinates[1],
            longitude: feature.geometry.coordinates[0],
            average: feature.properties.average
         };
      });
   },
   setHeatmap: function(features, year) {
      var heatmapData = this.getHeatmap(features, year);
      this.heatmapLayer.setData({
         max: _.max(_.map(heatmapData, 'average')),
         data: heatmapData
      });
   },
   getUniqYears: function(features) {
      return _.uniq(_.map(_.map(features, 'properties'), 'year')).sort(function(a, b) {
         return a - b;
      });
   },
   handleDateSelect: function(model, date) {
      if (date instanceof Date) {
         this.timeline.model.set({
            selected: date.getFullYear()
         });

         this.setHeatmap(this.collection.toJSON(), date.getFullYear());
      }
   },
   handleCenterChange: function(model, center) {
      var nearestRegion = nearest(point([center.lng, center.lat]), featurecollection(regions));
      this.model.set('region', nearestRegion.properties.region);
   }

});
