/**
 * Main application file for Lacu.
 * 9:01PM 5:26AM = 8 hr 25 min = 505 minutes = 30,300 seconds =
 */

// Class for application
function Lacu() {
  // Common properties
  this.width = 1440;
  this.height = this.width * (10 / 16) * (1 / 3);
  this.lakeCanvasWidth = this.width * (1 / 3);
  this.localStoragePrefix = 'lacu-';
  this.sparkDuration = 30300;
  this.playing = true;

  // Let's get our massive dataset first
  this.data = function() {
    var thisApp = this;
    d3.json('data/lakes.json', function(error, data) {
      thisApp.setData(error, data);
    });
  }

  // When data is loaded
  this.setData = function(error, data) {
    if (error) {
      console.log(error);
      return;
    }

    // Reset lake index.  Only use when testing
    this.resetLakeIndex();

    this.lakes = data;
    this.createCanvas();
    data = null;
  }

  // Some processing and setting up
  this.createCanvas = function() {
    var thisApp = this;

    // Determine time per lake
    this.lakeTime = Math.min((this.sparkDuration / this.lakes.length).toFixed(2), 5);

    // Make reference to container
    this.container = d3.select('#application-container');

    // Remove intro
    d3.select('#intro-container').transition().style('opacity', 0).remove();

    // Center canvas in window
    d3.select('#application-container')
      .style('top', ((window.innerHeight - this.height) / 2) + 'px')
      .style('left', ((window.innerWidth - this.width) / 2) + 'px');

    // Draw lake canvas and place in container
    this.lakeCanvas = [];
    this.lakeCanvas[0] = this.container.select('#lake-1 svg')
      .attr('width', this.lakeCanvasWidth)
      .attr('height', this.height)
      .style('left', ((this.width / 2) - (this.width / 3)) + 'px');
    this.lakeCanvas[1] = this.container.select('#lake-2 svg')
      .attr('width', this.lakeCanvasWidth)
      .attr('height', this.height)
      .style('left', (this.width / 2) + 'px');

    // Lake shapes
    this.lake = [];
    this.lake[0] = this.lakeCanvas[0].append('path')
      .attr('class', 'lake-outline')
      .attr('filter', 'url(#turbulence)');
    this.lake[1] = this.lakeCanvas[1].append('path')
      .attr('class', 'lake-outline')
      .attr('filter', 'url(#turbulence)');

    // Create path projection for lake data
    this.lakePath = d3.geo.path()
      .projection(null);

    // Lake names
    this.lakeName = [];
    this.lakeName[0] = this.container.select('#lake-name-1');
    this.lakeName[1] = this.container.select('#lake-name-2');

    // County names
    this.countyName = [];
    this.countyName[0] = this.container.select('#county-name-1');
    this.countyName[1] = this.container.select('#county-name-2');

    // Handle keys (more for testing)
    d3.select('body').on('keydown', function() {
      if (d3.event.keyCode === 32) {
        thisApp.playing = !thisApp.playing;
        thisApp.showSlide();
      }
      else if (d3.event.keyCode === 39) {
        thisApp.playing = false;
        thisApp.setLakeIndex(++thisApp.lakeIndex);
        thisApp.showSlide();
      }
      else if (d3.event.keyCode === 37) {
        thisApp.playing = false;
        thisApp.setLakeIndex(--thisApp.lakeIndex);
        thisApp.showSlide();
      }
    });

    // Set current lake index and start
    this.lakeIndex = this.getLakeIndex();
    this.showSlide();
  }

  // Function for looping
  this.showSlide = function(index) {
    var thisApp = this;
    var l = [{}, {}];

    // Get lake data
    l[0].i = (this.lakeIndex * 2);
    l[1].i = (this.lakeIndex * 2) + 1;
    l[0].l = this.lakes[l[0].i];
    l[1].l = this.lakes[l[1].i];

    // Make sure we have data or is the last one
    if ((!l[0].l && !l[1].l) || (!this.lakes[this.lakeIndex + 2])) {
      this.finished();
      return;
    }

    // Lake parts
    l[0].g = topojson.feature(l[0].l, l[0].l.objects.l);
    l[1].g = topojson.feature(l[1].l, l[1].l.objects.l);
    l[0].p = l[0].g.features[0].properties;

    // Transition to new lake
    this.lake[0]
      .attr('d', this.lakePath(l[0].g))
      .transition()
        .ease('sin')
        .duration(this.lakeTime * .15 * 1000)
        .style('opacity', 1)
      .transition()
        .delay(this.lakeTime * .7 * 1000)
      .transition()
        .ease('sin')
        .duration(this.lakeTime * .05 * 1000)
        .style('opacity', 0.1)
      .each('end', function() {
        if (thisApp.playing) {
          thisApp.setLakeIndex(++thisApp.lakeIndex);
          thisApp.showSlide();
        }
      });

    // Transition to new lake
    this.lake[1]
      .attr('d', this.lakePath(l[1].g))
      .transition()
        .ease('sin')
        .duration(this.lakeTime * .15 * 1000)
        .style('opacity', 1)
      .transition()
        .delay(this.lakeTime * .7 * 1000)
      .transition()
        .ease('sin')
        .duration(this.lakeTime * .05 * 1000)
        .style('opacity', 0.1);


    // Lake name
    /*
    this.name
      .data([properties])
      .classed('unnamed', function(d) {
        return !d.n || d.n.toLowerCase() === 'unnamed';
      })
      .text(function(d) { return (d.n) ? d.n : 'unnamed'; });

    // County name
    this.county
      .data([properties])
      .text(function(d) { return (d.c.length === 1) ? d.c[0] : d.c.split(', '); });

    // Update progress
    this.updateProgress();
    */
  }

  // All done
  this.finished = function() {

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
