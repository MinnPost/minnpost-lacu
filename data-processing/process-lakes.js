/**
 * Process lake data
 *
 * Properties for reference
 * {"ACRES":6,"SHORE_MI":0.4,"UTM_X":427696.4,"UTM_Y":5009655.8,"USCLASS":421,"DOWLKNUM":"86011800","MAIN_DOW":"86011800","DOW_VERIF":0,"LAKE_NAME":"Unnamed","ALT_NAME":null,"LAKE_CLASS":0,"REGION":3,"CTY_NAME":"Wright","FSH_OFFICE":null,"REDIG_SRC":"2010 FSA","SRCVERSION":"2011.03.11.1","FLID":17179}
 */

// Modules
var path = require('path');
var fs = require('fs');
var shapefile = require('shapefile');
var topojson = require('topojson');
var d3 = require('d3');
require('d3-geo-projection')(d3);

// Inputs and outputs
var lakesShapefile = path.join(__dirname, '../data/build/filtered_4326-shps/lake_dnrpy2.shp');
var lakesOutput = path.join(__dirname, '../data/lakes.json');
var finalLakes = [];

// Configuration
var idProp = 'DOWLKNUM';
var canvasWidth = 900;
var canvasHeight = 600;
var marginMin = 0.05;
var marginMax = 0.20;
var acreMin = 10;
var acreMax = 500;

// Determine margin from acreage
function marginFromAcreage(acres) {
  if (acres > acreMax) {
    return marginMin;
  }
  return marginMax - (((acres - acreMin) / (acreMax - acreMin)) *
    (marginMax - marginMin));
}


// Get those shapes
shapefile.read(lakesShapefile, function(error, collection) {
  if (error) {
    console.error(error);
    return;
  }

  // We want to go through each item and project into our
  // canvas
  collection.features.forEach(function(f, fi) {
    var geojson = { type: 'FeatureCollection', features: [f] };
    var acres = f.properties.ACRES;

    // Reproject
    geojson = d3.geo.project(geojson, d3.geo.albersUsa());

    // Make into topology
    var objects = { 'l': geojson };
    var topo = topojson.topology(objects, {
      id: function(d) { return d.properties[idProp]; },
      'property-transform': function(feature) {
        return {
          a: feature.properties.ACRES,
          sm: feature.properties.SHORE_MI,
          uc: feature.properties.USCLASS,
          id: feature.properties[idProp],
          n: feature.properties.LAKE_NAME,
          c: feature.properties.CTY_NAME
        };
      }
    });

    // Scale
    topo = topojson.scale(topo, {
      width: canvasWidth,
      height: canvasHeight,
      margin: marginFromAcreage(acres) * canvasWidth
    });

    // Remove bounding box
    delete topo.bbox

    // Add to final
    finalLakes.push(topo);
  });

  // Sort and save out final
  finalLakes.sort(function(a, b) {
    var x = a.objects.l.geometries[0].properties.a;
    var y = b.objects.l.geometries[0].properties.a;
    return (x < y) ? -1 : ((x > y) ? 1 : 0);
  });
  fs.writeFileSync(lakesOutput, JSON.stringify(finalLakes));
});
