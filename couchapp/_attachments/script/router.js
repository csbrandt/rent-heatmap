var $ = require('jquery');
var _ = require('lodash');
var Backbone = require('backbone');
var MainView = require('./view/main');
var mainModel = new Backbone.Model();
var featureCollection = new Backbone.Collection();
require('./vendor/jquery.couch.js');

module.exports = Backbone.Router.extend({
   routes: {
      '': 'index',
      'region/:region': 'region'
   },
   initialize: function() {
      new MainView({
         el: 'body',
         model: mainModel,
         collection: featureCollection
      });

      mainModel.on('change:region', this.handleRegionChange, this);
   },
   index: function() {
      this.navigate('region/sfbay', {
         trigger: true
      });
   },
   region: function(region) {
      $.couch.db('rent-heatmap').view('rent-heatmap/byRegion', {
         key: region,
         reduce: false,
         success: function(data) {
            mainModel.set('region', region);
            featureCollection.reset(_.map(data.rows, 'value'));
         },
         error: function(status) {
            console.log(status);
         },
      });
   },
   handleRegionChange: function(model, region) {
      if (Backbone.history.getFragment().indexOf(region) === -1) {
         this.navigate('region/' + region, {
            trigger: true
         });
      }
   }

});
