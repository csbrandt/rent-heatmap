var $ = require('jquery');
var Backbone = require('backbone');
require('leaflet');

var MapModel = Backbone.Model.extend({
   defaults: {
      urlTemplate: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.{ext}',
      attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: 'abcd',
      zoom: 9,
      minZoom: 0,
      maxZoom: 20,
      ext: 'png'
   }
});

module.exports = Backbone.View.extend({
   model: new MapModel(),
   initialize: function() {
      var baseLayer = L.tileLayer(this.model.get('urlTemplate'), {
         attribution: this.model.get('attribution'),
         subdomains: this.model.get('subdomains'),
         minZoom: this.model.get('minZoom'),
         maxZoom: this.model.get('maxZoom'),
         ext: this.model.get('ext')
      });

      this.model.set("layers", [baseLayer]);
      baseLayer.on('load', function() {
         this.trigger('tilesloaded');
      }.bind(this));

      this.model.on('change', this.render, this);
   },
   render: function() {
      if (!this.map) {
         this.map = new L.Map(this.id, {
            center: this.model.get('center'),
            zoom: this.model.get('zoom'),
            layers: this.model.get('layers')
         });

         this.map.on('move', function() {
            this.model.set('center', this.map.getCenter());
         }.bind(this));

         this.map.fitBounds(this.model.get('bounds'));
      }
   }

});
