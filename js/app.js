/**
 * Main application file for Lacu.
 */

// Some globals
var lakes;
var svgCanvas;
var lakeGroup;
var width = 900;
var height = 600;
var localStoragePrefix = 'lacu-';


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
  // Center canvas in window
  d3.select('#application-container')
    .style('top', ((window.innerHeight - height) / 2) + 'px')
    .style('left', ((window.innerWidth - width) / 2) + 'px');

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
  var lakeIndex = getLakeIndex();

  // Function for looping
  function showLake() {
    setLakeIndex(lakeIndex);
    var lakeData = lakes[lakeIndex];

    // Make sure we have data
    if (!lakeData) {
      return;
    }

    // Get parts we will need
    var lakePath = topojson.feature(lakeData, lakeData.objects.l);
    var lake = lakeGroup.select('.lake-outline');

    // Ensure that there is a path in the first place
    if (!lake || !lake[0][0]) {
      lake = lakeGroup.append('path').attr('class', 'lake-outline');
    }

    // If not path set, then make this one the first
    if (!lake.attr('d')) {
      lake.attr('d', path(lakePath));
    }

    // Transition to new lake
    lake
      .transition().duration(500)
        .attr('d', path(lakePath))
      .delay(1500)
      .each('end', function() {
        lakeIndex++;
        showLake();
      });
  }

  // Start the magic
  showLake();
}

// Get lake index
function getLakeIndex() {
  // Store index locally, so we don't have to start over
  // every reload
  var index = localStorage.getItem(localStoragePrefix + '-index');
  if (index) {
    return parseInt(index, 10);
  }
  else {
    setLakeIndex(0);
    return 0;
  }
}

// Set lake index
function setLakeIndex(index) {
  localStorage.setItem(localStoragePrefix + '-index', index);
  return index;
}

// Reset lake index
function resetLakeIndex() {
  localStorage.removeItem(localStoragePrefix + '-index');
  return 0;
}
