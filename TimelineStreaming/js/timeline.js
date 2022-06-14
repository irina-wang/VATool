
/*
 * Timeline - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the  
 */

Timeline = function (_parentElement, _data) {

  this.parentElement = _parentElement;
  this.data = _data;

  // No data wrangling, no update sequence
  this.displayData = this.data;

  this.initVis();
}


/*
 * Initialize area chart with brushing component
 */

Timeline.prototype.initVis = function () {
  var vis = this; // read about the this

  vis.margin = { top: 0, right: 0, bottom: 30, left: 60 };

  vis.width = 800 - vis.margin.left - vis.margin.right,
  vis.height = 100 - vis.margin.top - vis.margin.bottom;

  // SVG drawing area
  vis.svg = d3.select("#" + vis.parentElement).append("svg")
    .attr("width", vis.width + vis.margin.left + vis.margin.right)
    .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
    .append("g")
    .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");


  // Scales and axes
  vis.x = d3.scaleTime()
    .range([0, vis.width])
    .domain(d3.extent(vis.displayData, function (d) { return d.Year; }));

  vis.y = d3.scaleLinear()
    .range([vis.height, 0])
    .domain([0, d3.max(vis.displayData, function (d) { return d.Expenditures; })]);

  vis.xAxis = d3.axisBottom()
    .scale(vis.x);
  
  // Append x-axis
  vis.svg.append("g")
    .attr("class", "x-axis axis")
    .attr("transform", "translate(0," + vis.height + ")")
    .call(vis.xAxis);

  // SVG area path generator
  vis.area = d3.area()
    .x(function (d) { return vis.x(d.Year); })
    .y0(vis.height)
    .y1(function (d) { return vis.y(d.Expenditures); });

  // Draw area by using the path generator
  vis.svg.append("path")
    .datum(vis.displayData)
    .attr("fill", "#ccc")
    .attr("d", vis.area);
  
  // Initialize brush component
  const brush = d3.brushX()
      // define brushable extent from top left to botton right 
      .extent([[0, 0], [vis.width, vis.height]]) 
      .on("brush", brushed) // update view when area is selected
      .on("end", brushend); // reset view when nothing is selected

  // Add the brush to the DOM
  vis.svg.append("g")
    .attr("class", "brush")
    .call(brush);
}

