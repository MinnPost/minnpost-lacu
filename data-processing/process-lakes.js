/**
 * Process lake data
 *
 */

// Modules
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var shapefile = require('shapefile');
var topojson = require('topojson');
var mergeProperties = require('topojson/lib/topojson/merge-properties');
var d3 = require('d3');
require('d3-geo-projection')(d3);

// Inputs and outputs
var lakesShapefile = path.join(__dirname, '../data/build/converted-4326-shps/water_dnr_hydrography.shp');
var lakesShapefile = path.join(__dirname, '../data/build/converted-4326-shps/water_dnr_hydrography-TEST.shp');
var lakesOutput = path.join(__dirname, '../data/lakes.json');
var pcaConditionData = require('../data/build/pca_condition_summaries.json');
var pcaTSIData = require('../data/build/pca_summary_tsi.json');
var pcaTransparencyData = require('../data/build/pca_transparency_trends.json');
var pcaWaterData = require('../data/build/pca_water_units.json');
var finalLakes = {};

// Transparency data is not keyed as there is streams and stations in
// the data, so we group it by ID
pcaTransparencyData = _.groupBy(pcaTransparencyData, 'WID');

// Get list of Watersheds
var watersheds = _.sortBy(_.uniq(_.map(pcaWaterData, function(w, wi) {
  return w.WATERSHED_NAME;
})));

// Configuration
var canvasWidth = 1400;
var canvasHeight = canvasWidth * (10 / 16) * (1 / 3);
var lakeCanvasWidth = canvasWidth * (1 / 3);
var lakeCanvasMargin = 0.015;
var acreMin = 10;
var acreMax = 1000;
var uniqueID = 0;

// Get a unique ID
function makeUniqueID() {
  uniqueID++;
  return uniqueID;
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

  // Add PCA data
  p.ids.forEach(function(i, ii) {
    var pcaID = i.substring(0, 2) + '-' + i.substring(2, 6) + '-' + i.substring(6, 8);

    // Condition summaries
    var cs = pcaConditionData[pcaID];
    if (cs && cs.SUMMARY_STRING) {
      cs = cs.SUMMARY_STRING;
      p.nswim = (cs.match(/Not always suitable for swimming and wading/i) !== null) ? true : '';
      p.swim = (cs.match(/Suitable for swimming and wading,/i) !== null) ? true : '';
      p.bqual = (cs.match(/exceed the water quality standard/i) !== null) ? true : '';
      p.nfish = (cs.match(/May not support a thriving community of fish and other aquatic organisms/i) !== null) ? true : '';
      p.fish = (cs.match(/Available data indicate a thriving community of fish and other aquatic organisms/i) !== null) ? true : '';
    }

    // TSI (Trophic State Index)
    // http://www.lakeaccess.org/lakedata/datainfotsi.html
    //
    // Ecoregions
    // NLF - Northern Lakes & Forests
    // NCHF - North Central Hardwood Forests
    // WCBP - Western Corn Belt Plains
    // NGP - Northern Glaciated Plains
    var tsi = pcaTSIData[pcaID];
    if (tsi && tsi.ECOREGION) {
      p.r = (tsi.ECOREGION) ? tsi.ECOREGION : '';
      p.tsi = (parseInt(tsi.OVERALL_TSI, 10)) ? parseInt(tsi.OVERALL_TSI, 10) : '';
    }

    // Transparency data (grouped)
    var tr = pcaTransparencyData[pcaID];
    if (tr && tr.length > 0) {
      tr.forEach(function(t, ti) {
        var s = t.TREND_SUMMARY;
        var m;

        if (s.match(/this is (strong )?evidence/i) !== null) {
          m = s.match(/at this lake from [0-9]{4} to [0-9]{4} (decreased|increased) by ([0-9.]+) feet per decade/i);
          p.tchg = parseFloat(m[2]) * ((m[1] === 'decreased') ? -1 : 1);
        }
      });
    }

    // Water unit data
    var w = pcaWaterData[pcaID];
    if (w && w.WU_TYPE) {
      p.mdep = (parseInt(w.LAKE_DEPTH_MAX_FT, 10)) ? parseInt(w.LAKE_DEPTH_MAX_FT, 10) : '';

      // Use class.  Only get number
      // http://www.pca.state.mn.us/index.php/water/water-permits-and-rules/water-rulemaking/water-quality-standards.html#elements-of-standards
      p.use = _.map(w.WU_USE_CLASS.split(','), function(u, ui) {
        u = u.trim();
        u = u[0];
        return u;
      });
    }

  });

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
      width: lakeCanvasWidth,
      height: canvasHeight,
      margin: lakeCanvasWidth * lakeCanvasMargin
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
