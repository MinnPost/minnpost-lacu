/**
 * Main application file for Lacu.
 * 9:01PM 5:26AM = 8 hr 25 min = 505 minutes = 30,300 seconds - (some lee-way)
 */

// Class for application
function Lacu() {
  // Common properties
  this.width = 1440;
  this.height = this.width * (10 / 16) * (1 / 3);
  this.lakeCanvasWidth = this.width * (1 / 3);
  this.progressCanvasWidth = this.width * 0.05;
  this.localStoragePrefix = 'lacu-';
  this.sparkDuration = 29000;
  this.playing = true;
  this.tweens = ['quad', 'cubic', 'sin', 'circle', 'back', 'bounce'];

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
    this.lakeTime = Math.min((this.sparkDuration / this.lakes.length * 2).toFixed(2), 5);

    // Make reference to container
    this.container = d3.select('#application-container');

    // Remove intro
    d3.select('#intro-container').transition().style('opacity', 0).remove();

    // Center canvas in window
    d3.select('#application-container')
      .style('width', this.width + 'px')
      .style('min-height', this.height + 'px')
      .style('top', ((window.innerHeight - this.height) / 2) + 'px')
      .style('left', ((window.innerWidth - this.width) / 2) + 'px');

    // Create progress circle
    this.progress = {};
    this.progress.w = this.progressCanvasWidth;
    this.progress.container = d3.select('#progress-scale')
      .style('left', ((this.width / 2) - (this.progress.w / 2)) + 'px');
    this.progress.canvas = this.progress.container.select('svg')
      .attr('width', this.progress.w)
      .attr('height', this.progress.w);
    this.progress.group = this.progress.canvas.append('g')
      .attr('transform', 'translate(' + this.progress.w / 2 + ',' + this.progress.w / 2 + ')');
    this.progress.arc = d3.svg.arc()
      .startAngle(0)
      .innerRadius((this.progress.w / 2) - 10)
      .outerRadius((this.progress.w / 2) - 15);
    this.progress.group.append('path')
      .attr('class', 'scale')
      .attr('d', this.progress.arc.endAngle(2 * Math.PI));
    this.progress.p1 = this.progress.group.append('path')
      .attr('class', 'value');
    this.progress.p2 = this.progress.group.append('path')
      .attr('class', 'value')
      .attr('filter', 'url(#blur)');


    // Draw lake canvas and place in container
    this.lakeCanvas = [];
    this.lakeCanvas[0] = this.container.select('#lake-1 svg')
      .attr('width', this.lakeCanvasWidth)
      .attr('height', this.height)
      .style('left', ((this.width / 2) - (this.width / 3) - (this.progressCanvasWidth / 2)) + 'px');
    this.lakeCanvas[1] = this.container.select('#lake-2 svg')
      .attr('width', this.lakeCanvasWidth)
      .attr('height', this.height)
      .style('left', ((this.width / 2) + (this.progressCanvasWidth / 2)) + 'px');

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

    // Lake names
    this.lakeNameContainer = [];
    this.lakeNameContainer[0] = this.container.select('#lake-name-container-1');
    this.lakeNameContainer[1] = this.container.select('#lake-name-container-2');

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
    var partsDone = [];
    var partsNeeded = 2;
    var progress = this.lakeIndex / (this.lakes.length / 2);

    // Done.  Hacked way of handling multiple animations
    function allDone(partDone) {
      partsDone.push(partDone);
      if (thisApp.playing && partsDone.length == partsNeeded) {
        thisApp.setLakeIndex(++thisApp.lakeIndex);
        thisApp.showSlide();
      }
    }

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
    l[1].p = l[1].g.features[0].properties;

    // Update progress bar
    this.progress.p1
      .attr('d', this.progress.arc.endAngle(2 * Math.PI * progress));
    this.progress.p2
      .attr('d', this.progress.arc.endAngle(2 * Math.PI * progress));

    // Transition lake 1
    this.lake[0]
      .transition()
        .ease(_.sample(this.tweens))
        .duration(this.lakeTime * .25 * 1000)
        .attr('d', this.lakePath(l[0].g))
      .transition()
        .delay(this.lakeTime * .75 * 1000)
      .each('end', function() {
        allDone('lake1');
      });

    // Transition lake 2
    this.lake[1]
      .transition()
        .ease(_.sample(this.tweens))
        .duration(this.lakeTime * .25 * 1000)
        .attr('d', this.lakePath(l[1].g))
      .transition()
        .delay(this.lakeTime * .75 * 1000)
      .each('end', function() {
        allDone('lake1');
      });

    // Lake name
    this.lakeNameContainer[0]
      .transition()
        .ease(_.sample(this.tweens))
        .duration(this.lakeTime * .15 * 1000)
        .style('left', '-500px')
      .each('end', function() {
        // Change lake name
        thisApp.lakeName[0]
          .data([l[0].p])
          .classed('unnamed', function(d) {
            return !d.n || d.n.toLowerCase() === 'unnamed';
          })
          .text(function(d) { return (d.n) ? d.n : 'unnamed'; });

        // County name 1
        thisApp.countyName[0]
          .text(l[0].p.c);
      })
      .transition()
        .ease(_.sample(this.tweens))
        .duration(this.lakeTime * .15 * 1000)
        .style('left', '0px');


    // Lake name 2
    this.lakeNameContainer[1]
      .transition()
        .ease(_.sample(this.tweens))
        .duration(this.lakeTime * .15 * 1000)
        .style('right', '-500px')
      .each('end', function() {
        // Change lake name
        thisApp.lakeName[1]
          .data([l[1].p])
          .classed('unnamed', function(d) {
            return !d.n || d.n.toLowerCase() === 'unnamed';
          })
          .text(function(d) { return (d.n) ? d.n : 'unnamed'; });

        // County name 1
        thisApp.countyName[1]
          .text(l[1].p.c);
      })
      .transition()
        .ease(_.sample(this.tweens))
        .duration(this.lakeTime * .15 * 1000)
        .style('right', '0px');

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
