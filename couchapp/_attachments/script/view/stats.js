var _ = require('lodash');
var Backbone = require('backbone');
var templateString = require('../template/stats.html');

module.exports = Backbone.View.extend({
   initialize: function() {
      _.templateSettings =  { interpolate : /{{(.+?)}}/g };
      this.template = _.template(templateString);
      this.model.on('change', this.render, this);
   },
   render: function() {
      var defaults = {
         displayName: '',
         min: '',
         max: ''
      };

      this.$el.html(this.template(Object.assign({}, defaults, this.model.attributes)));
      return this;
   }

});
