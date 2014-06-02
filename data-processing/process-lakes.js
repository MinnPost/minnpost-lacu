/**
 * Process lake data
 *
 */

// Modules
var path = require('path');
var fs = require('fs');
var shapefile = require('shapefile');
var topojson = require('topojson');
var topojsonClient = require('topojson/topojson');
var d3 = require('d3');
require('d3-geo-projection')(d3);

// Inputs and outputs
var lakesShapefile = path.join(__dirname, '../data/build/converted-4326-shps/water_dnr_hydrography.shp');
var lakesOutput = path.join(__dirname, '../data/lakes.json');
var finalLakes = {};

// Configuration
var idProp = 'DOWLKNUM';
var canvasWidth = 900;
var canvasHeight = 600;
var marginMin = 0.03;
var marginMax = 0.10;
var acreMin = 10;
var acreMax = 1000;

// Determine margin from acreage
function marginFromAcreage(acres) {
  if (acres > acreMax) {
    return marginMin;
  }
  return marginMax - (((acres - acreMin) / (acreMax - acreMin)) *
    (marginMax - marginMin));
}


// Get those shapes
console.log('Reading in lake shape file...');
shapefile.read(lakesShapefile, function(error, collection) {
  if (error) {
    console.error(error);
    return;
  }
  console.log('Processing lake shape file...');

  // We want to go through each item and project into our
  // canvas.  The Lake ID number is not unique, so we want to combine
  // if needed.
  collection.features.forEach(function(f, fi) {
    var geojson = { type: 'FeatureCollection', features: [f] };
    var acres = f.properties.ACRES;
    var id = f.properties[idProp];

    // Reproject
    geojson = d3.geo.project(geojson, d3.geo.albersUsa());

    // Make into topology
    var objects = { 'l': geojson };
    var topo = topojson.topology(objects, {
      id: function(d) { return d.properties[idProp]; },
      'property-transform': function(feature) {
        return {
          a: feature.properties.ACRES,
          id: feature.properties[idProp],
          n: feature.properties.LAKE_NAME,
          c: feature.properties.CTY_NAME
        };
      }
    });

    // Scale
    topo = topojson.scale(topo, {
      invert: false,
      width: canvasWidth,
      height: canvasHeight,
      margin: marginFromAcreage(acres) * canvasWidth
    });

    // Simplify
    if (acres > acreMax) {
      topo = topojson.simplify(topo, {
        'coordinate-system': 'cartesian',
        'retain-proportion': Math.max(0.05, 1 - (acres / 10000))
      });
    }

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
    return (x > y) ? -1 : ((x < y) ? 1 : 0);
    // Smallest first
    //return (x < y) ? -1 : ((x > y) ? 1 : 0);
  });
  fs.writeFileSync(lakesOutput, JSON.stringify(output));
});
