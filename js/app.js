/**
 * Main application file for Lacu.
 */

// Some globals
var lakes;
var svgCanvas;
var lakeGroup;
var width = 900;
var height = 600;


// Let's get our massive dataset first
d3.json('data/lakes.topo.json', getReady);


// When data is loaded
function getReady(error, data) {
  if (error) {
    console.log(error);
    return;
  }

  lakes = data;
  sett();
}

// Some processing and setting up
function sett() {
  // Draw canvas
  svgCanvas = d3.select('#application-container').append('svg')
    .attr('width', width)
    .attr('height', height);
  lakeGroup = svgCanvas.append('g');

  // Remove intro
  d3.select('#intro-container').transition().style('opacity', 0).remove();

  go();
}

// Start everything
function go() {
  var path = d3.geo.path()
    .projection(null);

  var lakeIndex = 0;

  function showLake() {
    var lakeData = lakes[lakeIndex];
    var lakePath = topojson.feature(lakeData, lakeData.objects.l);
    var lake = lakeGroup.select('.lake-outline');

    if (!lake || !lake[0][0]) {
      lake = lakeGroup.append('path').attr('class', 'lake-outline');
    }

    if (!lake.attr('d')) {
      lake.attr('d', path(lakePath));
    }

    lake
      .transition().duration(500)
        .attr('d', path(lakePath))
      .delay(1500)
      .each('end', function() {
        lakeIndex++;
        showLake();
      });
  }

  showLake();

}
