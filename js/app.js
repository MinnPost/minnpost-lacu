/**
 * Main application file for Lacu.
 * 9:01PM 5:26AM = 8 hr 25 min = 505 minutes = 30,300 seconds =
 */

// Class for application
function Lacu() {
  // Common properties
  this.width = 900;
  this.height = 600;
  this.localStoragePrefix = 'lacu-';
  this.sparkDuration = 30300;

  // Let's get our massive dataset first
  this.data = function() {
    var thisApp = this;
    d3.json('data/lakes.json', function(error, data) {
      thisApp.getReady(error, data);
    });
  }

  // When data is loaded
  this.getReady = function(error, data) {
    if (error) {
      console.log(error);
      return;
    }

    // Reset lake index.  Only use when testing
    //this.resetLakeIndex();

    this.lakes = data;
    this.sett();
    data = null;
  }

  // Some processing and setting up
  this.sett = function() {
    // Determine time per lake
    this.lakeTime = (this.sparkDuration / this.lakes.length).toFixed(2);

    // Center canvas in window
    d3.select('#application-container')
      .style('top', ((window.innerHeight - this.height) / 2) + 'px')
      .style('left', ((window.innerWidth - this.width) / 2) + 'px');

    // Draw canvas
    this.svgCanvas = d3.select('#application-container svg')
      .attr('width', this.width)
      .attr('height', this.height);
    this.lakeGroup = this.svgCanvas.append('g');

    // Remove intro
    d3.select('#intro-container').transition().style('opacity', 0).remove();

    // Start animation
    this.go();
  }

  // Start everything
  this.go = function() {
    var thisApp = this;

    // Create path projection for lake data
    this.path = d3.geo.path()
      .projection(null);
    this.lakeIndex = this.getLakeIndex();

    // Progress bar
    var progressData = this.lakeIndex / (this.lakes.length - 1);
    this.progress = this.svgCanvas.selectAll('.progress')
      .data([progressData]);
    this.progress
      .enter()
        .append('rect')
          .attr('class', 'progress')
          .attr('filter', 'url(#blur-small)')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', this.width * 0.05)
          .attr('height', function(d) { return thisApp.height * d; });

    // Start the magic
    this.showLake();
  }

  // Function for looping
  this.showLake = function() {
    var thisApp = this;
    var lakeData = this.lakes[this.lakeIndex];

    // Make sure we have data
    if (!lakeData) {
      return;
    }

    // Current lake
    var lakeGeom = topojson.feature(lakeData, lakeData.objects.l);
    var lake = this.lakeGroup.select('.lake-outline');

    // Previous and next
    var previousLake = this.lakes[this.lakeIndex - 1];
    var previousLakeGeom = (previousLake) ? topojson.feature(previousLake, previousLake.objects.l) : null;
    var nextLake = this.lakes[this.lakeIndex - 1];

    // Ensure that there is a path in the first place
    if (!lake || !lake[0][0]) {
      lake = this.lakeGroup.append('path').attr('class', 'lake-outline');
      lake.attr('filter', 'url(#turbulence)');
    }

    // If not path set, then find one
    if (!lake.attr('d')) {
      lake.attr('d', this.path((previousLake) ? previousLakeGeom : lakeGeom))
    }

    // Set index and update progress
    this.setLakeIndex(this.lakeIndex);
    this.updateProgress();

    // Transition to new lake
    lake
      .transition()
        .ease('sin')
        .duration(this.lakeTime * .4 * 1000)
        .attr('d', this.path(lakeGeom))
      .delay(this.lakeTime * .6 * 1000)
      .each('end', function() {
        thisApp.lakeIndex++;
        thisApp.showLake();
      });
  }

  // Update progress
  this.updateProgress = function() {
    var thisApp = this;
    this.progress = this.svgCanvas.selectAll('.progress')
      .data([ this.lakeIndex / (this.lakes.length - 1) ])
      .attr('height', function(d) { return thisApp.height * d; });
  }

  // Get lake index
  this.getLakeIndex = function() {
    // Store index locally, so we don't have to start over
    // every reload
    var index = localStorage.getItem(this.localStoragePrefix + '-index');
    if (index) {
      return parseInt(index, 10);
    }
    else {
      this.setLakeIndex(0);
      return 0;
    }
  }

  // Set lake index
  this.setLakeIndex = function(index) {
    localStorage.setItem(this.localStoragePrefix + '-index', index);
    return index;
  }

  // Reset lake index
  this.resetLakeIndex = function() {
    localStorage.removeItem(this.localStoragePrefix + '-index');
    return 0;
  }
}

// Make application go
var lacu = new Lacu();
lacu.data();
