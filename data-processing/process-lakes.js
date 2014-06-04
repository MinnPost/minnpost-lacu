/**
 * Process lake data
 *
 */

// Modules
var path = require('path');
var fs = require('fs');
var shapefile = require('shapefile');
var topojson = require('topojson');
var mergeProperties = require('topojson/lib/topojson/merge-properties');
var d3 = require('d3');
require('d3-geo-projection')(d3);

// Inputs and outputs
var lakesShapefile = path.join(__dirname, '../data/build/converted-4326-shps/water_dnr_hydrography.shp');
var lakesShapefile = path.join(__dirname, '../data/build/converted-4326-shps/water_dnr_hydrography-TEST.shp');
var lakesOutput = path.join(__dirname, '../data/lakes.json');
var finalLakes = {};

// Configuration
var canvasWidth = 900;
var canvasHeight = 600;
var marginMin = 0.03;
var marginMax = 0.10;
var acreMin = 10;
var acreMax = 1000;
var uniqueID = 0;

// Get a unique ID
function makeUniqueID() {
  uniqueID++;
  return uniqueID;
}

// Determine margin from acreage
function marginFromAcreage(acres) {
  if (acres > acreMax) {
    return marginMin;
  }
  return marginMax - (((acres - acreMin) / (acreMax - acreMin)) *
    (marginMax - marginMin));
}

// Process properties
function transformProperties(feature) {
  var p = feature.properties;
  var regexSubName = /unnamed\s*\((.*)\)/;

  // Create array instead of list
  p.ids = p.ids.split(',');

  // Reduce county name and remove duplicates
  p.c = (!p.c) ? '' : p.c;
  p.c = p.c.split(',').reduce(function(p, c, i, a) {
    if (p.indexOf(c) === -1 && ['not in mn', 'sd', 'nd', 'canada', 'wi'].indexOf(c.toLowerCase()) === -1) {
      p.push(c);
    }
    return p;
  }, []);

  // Find smallest name and remove any (content) if different.
  p.n = (!p.n) ? '' : p.n;
  p.n = p.n.split(',');
  p.n = (p.n.length === 1) ? p.n[0] :
    p.n.reduce(function(p, c, i, a) {
      c = (c.indexOf('(') > 0 && c !== p) ? c.substring(0, c.indexOf('(') - 1).trim() : c
      return (!p) ? c : (p.length >= c.length) ? c : p;
    }, '');
  p.n = (p.n.toLowerCase().match(regexSubName)) ? p.n.toLowerCase().match(regexSubName)[1] : p.n;

  return p;
}


// Get those shapes
console.log('Reading in lake shape file...');
shapefile.read(lakesShapefile, function(error, collection) {
  if (error) {
    console.error(error);
    return;
  }
  console.log('Lakes found in shape file: ' + collection.features.length);


  console.log('Topologizing lake shapes...');
  // Then we want to reproject and process for our canvas and performance
  collection.features.forEach(function(c, ci) {
    var c = { type: 'FeatureCollection', features: [c] };
    var acres = c.features[0].properties.a;
    var id = c.features[0].properties.id;

    // Reproject
    var geojson = d3.geo.project(c, d3.geo.albersUsa());

    // Make into topology.
    var objects = { 'l': geojson };
    var topo = topojson.topology(objects, {
      id: function(d) { return id; },
      'property-transform': transformProperties
    });

    // Scale
    topo = topojson.scale(topo, {
      invert: false,
      width: canvasWidth,
      height: canvasHeight,
      margin: marginFromAcreage(acres) * canvasWidth
    });

    // Simplify based on acreage
    if (acres > acreMax) {
      //console.log(JSON.stringify(topo, null, 2));
      topo = topojson.simplify(topo, {
        //verbose: true,
        'coordinate-system': 'cartesian',
        'retain-proportion': Math.min(1, Math.max(0.2, 1 - (acres / 10000)))
      });
    }

    // Prune
    topo = topojson.prune(topo);

    // Remove bounding box
    delete topo.bbox

    // Push to final collection
    finalLakes[id] = topo;
  });

  // Sort and save out final
  console.log('Sorting and writing final application data file.');
  var output = [];
  var output = Object.keys(finalLakes).map(function(k) {
    return finalLakes[k];
  });
  output.sort(function(a, b) {
    var x = a.objects.l.geometries[0].properties.a;
    var y = b.objects.l.geometries[0].properties.a;
    // Largest first
    //return (x > y) ? -1 : ((x < y) ? 1 : 0);
    // Smallest first
    return (x < y) ? -1 : ((x > y) ? 1 : 0);
  });
  fs.writeFileSync(lakesOutput, JSON.stringify(output));
});
