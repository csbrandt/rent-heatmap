var $ = require('jquery');
var _ = require('lodash');
var Backbone = require('backbone');
var d3 = require('d3');
require('../vendor/d3-timeline.js');

module.exports = Backbone.View.extend({
   model: new Backbone.Model(),
   initialize: function() {
      this.chart = d3.timeline()
         .rotateTicks(45)
         .tickFormat({
            format: d3.time.format("%Y"),
            tickTime: d3.time.year,
            tickInterval: 1,
            tickSize: 6
         })
         .click(function (d, i, datum) {
            var date = new Date(d.starting_time);
            this.model.set('selected', new Date(date.setFullYear(date.getFullYear() + 1)));
         }.bind(this));

         this.model.on('change', this.render, this);
   },
   render: function() {
      var dates = this.model.get('dates');
      var data = [{
         times: dates.map(function(date) {
            return {
               starting_time: Date.parse(date),
               display: 'circle',
               id: (date === this.model.get('selected')) ? 'selected' : null
            };
         }.bind(this))
      }];

      this.setChartRange(dates[0], dates[dates.length - 1]);

      d3.select('#' + this.id).selectAll("svg").remove();
      var svg = d3.select('#' + this.id)
         .append("svg")
         .attr("width", $('#' + this.id).width())
         .datum(data).call(this.chart);
   },
   setChartRange: function(start, end) {
      this.chart.beginning(Date.parse(start));
      this.chart.ending((new Date(new Date().getFullYear(), 0)).getTime());
   }

});
