d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
        this.parentNode.appendChild(this);
    });
};

var R = 2; //radius
var opacity = 0.3;
var COL1 = "#24588E";
var COL2 = "#FF0000";
var COL3 = "#00D2FF";
var H = 450;
var W = 600;
var data = [];
var margin = {
    top: 20,
    right: 10,
    bottom: 20,
    left: 10
};
var width = W - margin.left - margin.right,
    height = H - margin.top - margin.bottom;
var svg = d3.select("#sContainer")
    .style({
        width: "600px",
        height: "450px"
    })
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x, y, c; //scales
var xAxis, yAxis; //axis

function start(cb) {
    d3.csv('../data/00009/platformdata.csv', function(err, d) {
        if (err) {
            throw (err);
        } else {
            cb(d);
        }
    });
}

function computeExtend(_d, _cb) {
    var minL = null;
    var maxL = null;
    var minH = null;
    var maxH = null;
    for (var i = 0; i < _d.length; i++) {
        var b = { //buffers
            l: parseFloat(_d[i].l),
            h: parseFloat(_d[i].h)
        };
        if (!minL) {
            minL = b.l;
            maxL = b.l;
            minH = b.h;
            maxH = b.h;
        } else {
            minL = minL > b.l ? b.l : minL;
            minH = minH > b.h ? b.h : minH;
            maxL = maxL < b.l ? b.l : maxL;
            maxH = maxH < b.h ? b.h : maxH;
        }
    }
    extend = {
        l: [minL, maxL],
        h: [minH, maxH]
    };
    _cb(extend);
}

function initScales(_a) {
    x = d3.scale
        .linear()
        .domain(_a.l)
        .range([0, width]);
    y = d3.scale
        .linear()
        .domain(_a.h)
        .range([height, 0]);
    c = d3.scale.linear().
    domain(_a.h).range([COL2, COL3]);
    drawAxis();
}

function drawAxis() {
    xAxis = d3.svg
        .axis()
        .scale(x)
        .orient("bottom");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    yAxis = d3.svg
        .axis()
        .scale(y)
        .orient("left");

    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(0," + width + ")")
        .call(yAxis);

}

function drawData(_data) {
    svg
        .selectAll("g")
        .data(_data)
        .enter()
        .append('circle')
        .attr('cx', function(d) {
            return x(d.l);
        })
        .attr('cy', function(d) {
            return y(d.h);
        })
        .attr('r', R)
        .style('fill', function(d) {
            return c(d.h);
        })
        .style('opacity', opacity);
}

function init(_e) {
    computeExtend(_e, initScales);
    drawData(_e);
}

start(init);
