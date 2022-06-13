

/*
 * StackedAreaChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the
 */

StackedAreaChart = function (_parentElement, _data) {

	this.parentElement = _parentElement;
	this.data = _data;
	this.initVis();
}



/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

StackedAreaChart.prototype.initVis = function () {
	var vis = this;

	vis.margin = { top: 40, right: 0, bottom: 60, left: 60 };

	vis.width = 800 - vis.margin.left - vis.margin.right,
	vis.height = 400 - vis.margin.top - vis.margin.bottom;


	// SVG drawing area
	vis.svg = d3.select("#" + vis.parentElement).append("svg")
		.attr("width", vis.width + vis.margin.left + vis.margin.right)
		.attr("height", vis.height + vis.margin.top + vis.margin.bottom)
		.append("g")
		.attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

	// Overlay with path clipping
	vis.svg.append("defs").append("clipPath")
		.attr("id", "clip")
		.append("rect")
		.attr("width", vis.width)
		.attr("height", vis.height);

	// Scales and axes
	vis.x = d3.scaleTime()
		.range([0, vis.width])
		.domain(d3.extent(vis.data, function (d) { return d.Year; }));

	vis.y = d3.scaleLinear()
		.range([vis.height, 0]);

	vis.xAxis = d3.axisBottom()
		.scale(vis.x);

	vis.yAxis = d3.axisLeft()
		.scale(vis.y);

	vis.svg.append("g")
		.attr("class", "x-axis axis")
		.attr("transform", "translate(0," + vis.height + ")");

	vis.svg.append("g")
		.attr("class", "y-axis axis");

	// Get data categories
	var dataCategories = colorScale.domain();

	// Initialize stack layout
	vis.stack = d3.stack()
		.keys(dataCategories);

	// Stack data
	vis.stackedData = vis.stack(vis.data);

	// Stacked area layout
	vis.area = d3.area()
		.x(function (d) { return vis.x(d.data.Year); })
		.y0(function (d) { return vis.y(d[0]); })
		.y1(function (d) { return vis.y(d[1]); });

	// Basic area layout
	vis.basicArea = d3.area()
		.x(function (d) { return vis.x(d.data.Year); })
		.y0(vis.height)
		.y1(function (d) { return vis.y(d[1] - d[0]); });


	// Tooltip placeholder
	vis.tooltip = vis.svg.append("text")
		.attr("class", "focus")
		.attr("x", 20)
		.attr("y", 0)
		.attr("dy", ".35em");


	// (Filter, aggregate, modify data)
	vis.updateVis();
}

/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

StackedAreaChart.prototype.updateVis = function () {
	var vis = this;

        // Update y domain
        vis.y.domain([0, d3.max(vis.stackedData,(d) => {d3.max(d, (e) => e[1])})]);

	var dataCategories = colorScale.domain();

	// Draw the layers
	var categories = vis.svg.selectAll(".area")
	    .data(vis.stackedData);

	const indices = d3.local();

	categories.enter().append("path")
		.attr("class", "area")
		.merge(categories)
		.style("fill", (d, i) => return colorScale(dataCategories[i]))
		.attr("d", (d) => return vis.area(d))
		.each((d, i) => indices.set(this, i))
	
		// Update tooltip text, font size is 100
		.on("mouseover", () => vis.tooltip.text(dataCategories[indices.get(this)], 100))
		.on("mouseout", () => vis.tooltip.text(""));

	categories.exit().remove();

	// Call axis functions with the new domain
	vis.svg.select(".x-axis").call(vis.xAxis);
	vis.svg.select(".y-axis").call(vis.yAxis);
}
