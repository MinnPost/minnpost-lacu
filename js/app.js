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
  this.playing = false;

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
    this.resetLakeIndex();

    this.lakes = data;
    this.sett();
    data = null;
  }

  // Some processing and setting up
  this.sett = function() {
    var thisApp = this;

    // Determine time per lake
    this.lakeTime = Math.min((this.sparkDuration / this.lakes.length).toFixed(2), 5);

    // Make reference to container
    this.container = d3.select('#application-container');

    // Center canvas in window
    d3.select('#application-container')
      .style('top', ((window.innerHeight - this.height) / 2) + 'px')
      .style('left', ((window.innerWidth - this.width) / 2) + 'px');

    // Draw canvas
    this.svgCanvas = this.container.select('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    // Remove intro
    d3.select('#intro-container').transition().style('opacity', 0).remove();

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

    // Lake shape
    this.lakeGroup = this.svgCanvas.append('g');
    this.lake = this.lakeGroup.append('path')
      .attr('class', 'lake-outline')
      //.attr('filter', 'url(#turbulence)');

    // Lake name
    this.name = this.container.select('#lake-name');

    // Handle keys
    d3.select('body').on('keydown', function() {
      if (d3.event.keyCode === 32) {
        thisApp.playing = !thisApp.playing;
        thisApp.go(thisApp.lakeIndex);
      }
      else if (d3.event.keyCode === 39) {
        thisApp.playing = false;
        thisApp.go(++thisApp.lakeIndex);
      }
      else if (d3.event.keyCode === 37) {
        thisApp.playing = false;
        thisApp.go(--thisApp.lakeIndex);
      }
    });

    // By default start animation
    thisApp.playing = true;
    this.go(this.lakeIndex);
  }

  // Function for looping
  this.go = function(index) {
    var thisApp = this;

    // Set new index
    this.lakeIndex = index;
    this.setLakeIndex(this.lakeIndex);

    // Get lake data
    var lakeData = this.lakes[this.lakeIndex];

    // Make sure we have data
    if (!lakeData) {
      return;
    }

    // Current lake
    var lakeGeom = topojson.feature(lakeData, lakeData.objects.l);
    var properties = lakeGeom.features[0].properties;
    var lake = this.lakeGroup.select('.lake-outline');

    // Transition to new lake
    this.lake
      .attr('d', this.path(lakeGeom))
      .transition()
        .ease('sin')
        .duration(this.lakeTime * .15 * 1000)
        .style('opacity', 1)
      .transition()
        .delay(this.lakeTime * .7 * 1000)
      .transition()
        .ease('sin')
        .duration(this.lakeTime * .05 * 1000)
        .style('opacity', 0)
      .each('end', function() {
        if (thisApp.playing) {
          thisApp.go(++thisApp.lakeIndex);
        }
      });

    // Handle name
    this.name
      .data([properties])
      .classed('unnamed', function(d) {
        return !d.n || d.n.toLowerCase() === 'unnamed';
      })
      .text(function(d) { return ((d.n) ? d.n : 'unnamed') + ' (' + d.c + ')'; });

    // Update progress
    this.updateProgress();
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
