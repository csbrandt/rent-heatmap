var _ = require('lodash');
var turf = require('turf');
var fs = require('fs');
var PouchDB = require('pouchdb');
var collector = require('craigslist-wayback-apa');
var cityPointsUS = require('city-points-us');
var neighborhoodPointsSF = require('neighborhood-points-sf');

var cities = [
   'atlanta',
   'austin',
   'boston',
   'chicago',
   'dallas',
   'denver',
   'detroit',
   'houston',
   'lasvegas',
   'losangeles',
   'miami',
   'minneapolis',
   'newyork',
   'orangecounty',
   'philadelphia',
   'phoenix',
   'portland',
   'raleigh',
   'sacramento',
   'sandiego',
   'seattle',
   'sfbay',
   'washingtondc'
];

var states = [
   'GA',
   'TX',
   'MA',
   'IL',
   'TX',
   'CO',
   'MI',
   'TX',
   'NV',
   'CA',
   'FL',
   'MN',
   'NY',
   'CA',
   'PA',
   'AZ',
   'OR',
   'NC',
   'CA',
   'CA',
   'WA',
   'CA',
   'DC'
];

/*
var cities = [
   'sfbay'
];

var states = [
   'CA'
];*/

cities.forEach(function(city, index) {
   // collect posts
   /*
   collect(city, function(err, posts) {
      if (!err) {
         fs.writeFileSync(__dirname + '/docs/posts/' + city + '.json', JSON.stringify(posts));
      } else {
         console.log(err);
      }
   });*/

   // generate heatmap features
   /*
   var posts = JSON.parse(fs.readFileSync(__dirname + '/docs/posts/' + city + '.json'));
   fs.writeFileSync(__dirname + '/docs/heatmap/' + city + '.json', JSON.stringify(generateFeatures(posts, city, states[index])));
   */

   // check bad posts
   /*
   var posts = JSON.parse(fs.readFileSync(__dirname + '/docs/posts/' + city + '.json'));
   posts.forEach(function(post) {
      if (parseInt(post.price) >= 20000) {
         var test = 1;
      }
   });*/

   // save heatmap features to couchdb
   var features = JSON.parse(fs.readFileSync(__dirname + '/docs/heatmap/' + city + '.json'));
   var db = new PouchDB('http://localhost:5984/rent-heatmap');
   db.bulkDocs(features, function(err, response) {
      if (err) {
         return console.log(err);
      }
   });

   //fs.writeFileSync(__dirname + '/docs/histogram/' + city + '.json',  JSON.stringify(generateHistogram(posts)));
   //fs.writeFileSync(__dirname + '/docs/posts/' + city + '.json', JSON.stringify(posts));
});

function collect(city, cb) {
   collector.get({
      city: city
   }, function(err, posts) {
      if (!err) {
         posts = posts.filter(function(post) {
            return post.location;
         });

         cb(null, posts);
      } else {
         console.log(err);
      }
   });
}

function matchLocation(neighborhoodPoints, location, state) {
   var locations;
   var match = null;
   if (location) {
      locations = location.split(',');
      for (var c = 0; c < locations.length; c++) {

         if (neighborhoodPoints) {
            match = neighborhoodPoints.features.find(function(point) {
               if (point.properties.neighborhood.toLowerCase().trim() === locations[c].toLowerCase().trim()) {
                  return point;
               } else {
                  return false;
               }
            });
         }

         match = match || cityPointsUS.features.find(function(point) {
            if (point.properties.state === state && point.properties.city.toLowerCase().trim() === locations[c].toLowerCase().trim()) {
               return point;
            } else {
               return false;
            }
         });

         if (match) {
            break;
         }
      }
   }

   return match;
}

function generateFeatures(posts, city, state) {
   var points = {};
   posts.forEach(function(post) {
      var point = matchLocation((city === 'sfbay') ? neighborhoodPointsSF : null, post.location, state);
      var location;
      var year = (new Date(post.date)).getFullYear();
      var key;

      if (point) {
         location = point.properties.neighborhood || point.properties.city;
         key = location + year;
         console.log("Found: " + location + " for " + post.location.toLowerCase().trim());
         if (parseInt(post.price)) {
            if (points[key]) {
               points[key].properties.count++;
               points[key].properties.average += (parseInt(post.price) - points[key].properties.average) / points[key].properties.count;
            } else {
               points[key] = _.cloneDeep(point);
               points[key].properties.count = 1;
               points[key].properties.average = parseInt(post.price);
               points[key].properties.year = year;
               points[key].properties.region = city;
            }
         }
      } else {
         console.log("Not found: " + post.location);
      }
   });

   return Object.keys(points).map(function(key) {
      return points[key];
   });
}

function generateHistogram(posts) {
   var points = {};
   posts.forEach(function(post) {
      var date = new Date(post.date);
      var key = date.getFullYear();
      if (points[key]) {
         points[key].count++;
      } else {
         points[key] = {
            key: key,
            date: post.date,
            count: 1
         }
      }

   });
   return Object.keys(points).map(function(key) {
      return points[key];
   });
}
