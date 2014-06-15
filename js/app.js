/**
 * Main application file for Lacu.
 * 9:01PM 5:26AM = 8 hr 25 min = 505 minutes = 30,300 seconds - (some lee-way)
 *
 * Do note that the main author on this was no D3 expert and this
 * may be wildy bad code...
 */

// Class for application
function Lacu() {
  // Common properties
  this.width = 1440;
  this.height = this.width * (10 / 16) * (1 / 3);
  this.lakeCanvasWidth = this.width * (1 / 3);
  this.lakeProgressWidth = this.width * 0.025;
  this.localStoragePrefix = 'lacu-';
  this.sparkDuration = 29000;
  this.playing = true;
  this.tweens = ['sin', 'circle', 'back', 'bounce'];
  this.flagColors = {
    'nswim': '#FFD24D',
    'swim': '#8CFF66',
    'bqual': '#99B3FF',
    'fish': '#05FFC1',
    'nfish': '#FFC105'
  };

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

    this.lakeIndex = this.lakes.length - 3;
    this.createCanvas();
    data = null;
  }

  // Some processing and setting up
  this.createCanvas = function() {
    var thisApp = this;

    // Determine time per lake
    this.lakeTime = Math.min((this.sparkDuration / this.lakes.length * 2).toFixed(2), 5);

    // Get area range
    this.areaScale = d3.scale.log()
      .domain([
        topojson.feature(this.lakes[0], this.lakes[0].objects.l).features[0].properties.a,
        topojson.feature(this.lakes[this.lakes.length - 2], this.lakes[this.lakes.length - 2].objects.l).features[0].properties.a
      ]);

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

    // Create lake progress circle
    this.lakeProgress = this.progressCircle('#lake-progress',
      this.lakeProgressWidth,
      (this.width / 2) - (this.lakeProgressWidth / 2),
      (this.height * 0.01));

    // Create lake area progress circle
    this.areaProgress = this.progressCircle('#area-progress',
      this.lakeProgressWidth,
      (this.width / 2) - (this.lakeProgressWidth / 2),
      (this.height - (this.height * 0.01) - (this.lakeProgressWidth)));

    // Draw lake canvas and place in container
    this.lakeCanvas = [];
    this.lakeCanvas[0] = this.container.select('#lake-1 svg')
      .attr('width', this.lakeCanvasWidth)
      .attr('height', this.height)
      .style('left', ((this.width / 2) - (this.width / 3) - (this.lakeProgressWidth / 2) - (this.lakeProgressWidth * 0.05)) + 'px');
    this.lakeCanvas[1] = this.container.select('#lake-2 svg')
      .attr('width', this.lakeCanvasWidth)
      .attr('height', this.height)
      .style('left', ((this.width / 2) + (this.lakeProgressWidth / 2) + (this.lakeProgressWidth * 0.05)) + 'px');

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

    // Flag metrics
    // nswim, swim, bqual, nfish, fish
    var fCW = ((thisApp.height / 2) / 5);
    var fW = fCW * 0.9;
    this.flags = [];
    this.flags[0] = {};
    this.flags[1] = {};
    [0, 1].forEach(function(i, ii) {
      var l = (i === 0) ? thisApp.width * 0.0075 :
        (thisApp.width - (thisApp.width * 0.0075) - (fCW))

      Object.keys(thisApp.flagColors).forEach(function(f, fi) {
        thisApp.flags[i][f] = thisApp.flagButton(
          f + '-' + i, f, fW, fW, l,
          (thisApp.height / 2) + (fCW * fi),
          thisApp.flagColors[f],
          (i === 0) ? false : true);
      });
    });

    // TSI value
    this.tsiMeasure = [];
    this.tsiMeasure[0] = this.progressCircle('#tsi-measure-1',
      fW, (fCW * 1.25) + (thisApp.width * 0.0075), (thisApp.height / 2) + 3);
    this.tsiMeasure[1] = this.progressCircle('#tsi-measure-2',
      fW, this.width - ((fCW * 1.25) + (thisApp.width * 0.0075)) - fW, (thisApp.height / 2) + 3);

    // Handle events
    this.handleEvents();

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
    var progress = this.lakeIndex / (this.lakes.length);
    var tween = _.sample(this.tweens);
    var one = false;

    // Done.  Hacked way of handling multiple animations
    function allDone(partDone) {
      partsDone.push(partDone);
      if (thisApp.playing && partsDone.length == partsNeeded) {

        // Check if there is more
        if (!thisApp.lakes[thisApp.lakeIndex + 2]) {
          thisApp.finished();
        }
        else {
          thisApp.moveIndex();
          thisApp.showSlide();
        }
      }
    }

    // Get lake data
    l[0].i = this.lakeIndex;
    l[1].i = this.lakeIndex + 1;
    l[0].l = this.lakes[l[0].i];
    l[1].l = this.lakes[l[1].i];

    // Make sure we have data
    if (!l[0].l && !l[1].l) {
      this.finished();
      return;
    }

    // Check if there is only one
    one = !l[0].l;

    // Lake parts and vales
    l[0].g = topojson.feature(l[0].l, l[0].l.objects.l);
    l[0].p = l[0].g.features[0].properties;
    if (!one) {
      l[1].g = topojson.feature(l[1].l, l[1].l.objects.l);
      l[1].p = l[1].g.features[0].properties;
    }

    // Update progress bar
    this.lakeProgress(progress);

    // Update area scale
    this.areaProgress(this.areaScale((one) ? l[0].p.a : Math.max(l[0].p.a, l[1].p.a)));

    // Transition lake 1
    this.lake[0]
      .transition()
        .ease(tween)
        .duration(this.lakeTime * .25 * 1000)
        .attr('d', this.lakePath(l[0].g))
      .transition()
        .delay(this.lakeTime * .75 * 1000)
      .each('end', function() {
        allDone('lake1');
      });

    // Transition lake 2
    if (!one) {
      this.lake[1]
        .transition()
          .ease(tween)
          .duration(this.lakeTime * .25 * 1000)
          .attr('d', this.lakePath(l[1].g))
        .transition()
          .delay(this.lakeTime * .75 * 1000)
        .each('end', function() {
          allDone('lake1');
        });
    }

    // Lake name
    this.lakeNameContainer[0]
      .transition()
        .ease(tween)
        .duration(this.lakeTime * .10 * 1000)
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
        .ease(tween)
        .duration(this.lakeTime * .15 * 1000)
        .style('left', '0px');


    // Lake name 2
    if (!one) {
      this.lakeNameContainer[1]
        .transition()
          .ease(tween)
          .duration(this.lakeTime * .10 * 1000)
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
          .ease(tween)
          .duration(this.lakeTime * .15 * 1000)
          .style('right', '0px');
    }

    // Update flags
    _.each(this.flags[0], function(f, fi) {
      f(l[0].p[fi], thisApp.lakeTime * .25 * 1000, tween);
    });
    if (!one) {
      _.each(this.flags[1], function(f, fi) {
        f(l[1].p[fi], thisApp.lakeTime * .25 * 1000, tween);
      });
    }

    // TSI Measures (0 is better)
    d3.select('#tsi-measure-1')
      .transition()
        .ease(tween)
        .duration(this.lakeTime * .10 * 1000)
        .style('opacity', 0)
        .each('end', function() {
          thisApp.tsiMeasure[0]((l[0].p.tsi) ? 1 - (l[0].p.tsi / 100) : 0);
        })
      .transition()
        .ease(tween)
        .duration(this.lakeTime * .15 * 1000)
        .style('opacity', 1)


    if (!one) {
      d3.select('#tsi-measure-2')
        .transition()
          .ease(tween)
          .duration(this.lakeTime * .10 * 1000)
          .style('opacity', 0)
          .each('end', function() {
            thisApp.tsiMeasure[1]((l[1].p.tsi) ? 1 - (l[1].p.tsi / 100) : 0);
          })
        .transition()
          .ease(tween)
          .duration(this.lakeTime * .15 * 1000)
          .style('opacity', 1)
    }
  }

  // All done
  this.finished = function() {
    console.log('finished');
  }

  // Next index (showing two at a time);
  this.moveIndex = function(backwards) {
    this.lakeIndex = this.lakeIndex + (2 * ((backwards === true) ? -1 : 1));
    this.lakeIndex = Math.max(0, this.lakeIndex);
    this.lakeIndex = Math.min(this.lakes.length - 1, this.lakeIndex);
    this.setLakeIndex(this.lakeIndex);
  }

  // Make progress circle
  this.progressCircle = function(selector, width, moveL, moveT) {
    var full = 2 * Math.PI;

    // Size container
    var container = d3.select(selector)
      .classed('progress-circle', true)
      .style('width', width + 'px')
      .style('height', width + 'px');

    // Move
    if (moveL) {
      container.style('left', moveL + 'px');
    }
    if (moveT) {
      container.style('top', moveT + 'px');
    }

    // SVG canvas
    var svg = container.append('svg')
      .attr('width', width)
      .attr('height', width);

    // Blur filter
    svg.append('defs')
      .append('filter')
        .attr('id', 'blur')
      .append('feGaussianBlur')
        .attr('in', 'SourceGraphic')
        .attr('stdDeviation', '5');

    // Group for centering
    var group = svg.append('g')
      .attr('transform', 'translate(' + width / 2 + ',' + width / 2 + ')');

    // Arc
    var arc = d3.svg.arc()
      .startAngle(0)
      .innerRadius((width / 2) - (width * 0.01))
      .outerRadius((width / 2) - (width * 0.075));

    // Full scale
    var scale = group.append('path')
      .attr('class', 'scale')
      .attr('d', arc.endAngle(full));

    // Make progress parts (need a solid arc and a blurred arc)
    var p1 = group.append('path')
      .attr('class', 'progress');
    var p2 = group.append('path')
      .attr('class', 'progress')
      .attr('filter', 'url(#blur)');

    // Return function to update
    return function(progress) {
      progress = parseFloat(progress);
      p1.attr('d', arc.endAngle(Math.min(full, full * progress)))
        .classed('no-value', (!progress || _.isNaN(progress)));
      p2.attr('d', arc.endAngle(Math.min(full, full * progress)))
        .classed('no-value', (!progress || _.isNaN(progress)));
    }
  }

  // Makes flag button
  this.flagButton = function(ident, eClass, w, h, l, t, color, opposite) {
    opposite = opposite || false;
    var thisApp = this;
    var margin = (w * 0.2);
    var rgb = this.hexToRgb(color);
    var shadow = '0px 0px ' + margin + 'px 1px rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0.75)';

    // Container
    var container = this.container.append('div')
      .style('width', w + 'px')
      .style('height', h + 'px')
      .style('top', t + 'px')
      .style('left', l + 'px')
      .classed('metric', true)
      .classed('flag-metric', true)
      .classed(eClass, true)
      .attr('id', ident);

    var value = container.append('div')
      .style('width', (w - margin) + 'px')
      .style('height', (h - margin) + 'px')
      .style('margin', margin + 'px')
      .classed('value', true);

    return function(on, time, tween) {
      on = !!on;
      var x = Math.random() * (thisApp.width);
      var y = 500;

      // if on the right
      x = (opposite) ? x * -1 : x;

      // Move value to place, change value, then move back
      value
        .transition()
          .ease(tween)
          .duration(time / 2)
          .style({
            'left': x + 'px',
            'top': y + 'px'
          })
        .each('end', function() {
          if (on) {
            d3.select(this).style('background-color', color)
              .style('opacity', 1)
              .style('box-shadow', shadow);
          }
          else {
            d3.select(this).style('background-color', '#F2F2F2')
              .style('opacity', 0.75)
              .style('box-shadow', 'none');
          }
        })
        .transition()
          .ease(tween)
          .duration(time / 2)
          .style({
            'left': '0px',
            'top': '0px'
          });
    }
  }

  // Handle events (mostly for testing)
  this.handleEvents = function() {
    var thisApp = this;

    d3.select('body').on('keydown', function() {
      // Space bar
      if (d3.event.keyCode === 32) {
        thisApp.playing = !thisApp.playing;
        thisApp.showSlide();
      }
      // right arrow
      else if (d3.event.keyCode === 39) {
        thisApp.playing = false;
        thisApp.moveIndex();
        thisApp.showSlide();
      }
      // left arrow
      else if (d3.event.keyCode === 37) {
        thisApp.playing = false;
        thisApp.moveIndex(true);
        thisApp.showSlide();
      }
    });
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

  // Hex to rgb
  // http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
  this.hexToRgb = function(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}

// Make application go
var lacu = new Lacu();
lacu.data();
