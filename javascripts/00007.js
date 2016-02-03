// linear regression in d3.js
// 
var R = 7; //radius
var COL1 = "#24588E";
var COL2 = "#F41313";
var COL3 = "#3E3A3A";
var H = 450;
var W = 600;
var hoverActive = false;
var data = [];
var lineDrawn = false;
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

var x = d3.scale.linear()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var gr = d3.select("svg").on("click", click);

var instructions =
    gr
    .append("g")
    .append("text")
    .text("click to add points, click on points to remove them")
    .attr("fill", "black")
    .attr("fill-opacity", "0.5")
    .attr("x", "85")
    .attr("y", "200")
    .attr("style", "font-size:1.4em");

function showInstructions() {
    instructions
        .style('visibility', 'visible')
        .attr("fill-opacity", "0");
    instructions
        .transition()
        .attr("fill-opacity", "0.5");
}

function hideInstructions() {
    instructions
        .transition()
        .attr("fill-opacity", "0")
        .each('end', function() {
            d3.select(this)
                .style('visibility', 'hidden');
        });
}


function click(_e) {
    hideInstructions();
    if (!hoverActive) {
        var m = d3.mouse(this);
        setMark(m[0], m[1], R, gr);
        data.push([m[0], m[1]]);
    } else {
        hoverActive = false;
    }
    update();
}

// from https://stackoverflow.com/questions/14167863/how-can-i-bring-a-circle-to-the-front-with-d3/14426477#14426477
d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
        this.parentNode.appendChild(this);
    });
};

function setMark(_cx, _cy, _r, _gr) {
    _gr.append("circle")
        .attr("cx", _cx)
        .attr("cy", _cy)
        .attr("r", _r)
        .attr("fill", COL1)
        .on("mouseover", function() {
            d3.select(this).attr("fill", COL2);
        })
        .on("mouseout", (function(event) {
            d3.select(this).attr("fill", COL1);
        }))
        .on("click", (function(event) {
            var pt = d3.select(this);
            var ind = _findIndex(data, [pt.attr("cx"), pt.attr("cy")]);
            if (ind > -1) {
                data.splice(ind, 1);
                pt.remove();
                hoverActive = true;
            }
        }));
}

function _findIndex(_array, _point) {
    for (var i = 0; i < _array.length; i++) {
        if ((_array[i][0] == _point[0]) && (_array[i][1] == _point[1])) {
            return i;
        }
    }
    return -1;
}

function update() {
    if (data.length > 0) {
        //recompute regression line
        var line = regression(data);
        var lineData = computeLine(line);
        //push changes to svg
        if (lineDrawn) {
            updateLine(gr, lineData);
        } else {
            drawLine(gr, lineData);
            lineDrawn = true;
        }
    } else {
        d3.selectAll("line").remove();
        lineDrawn = false;
        showInstructions();
    }
    d3.selectAll("circle").moveToFront();
}

function regression(_d) {
    if (_d.length > 0) {
        var means = computeMeans(_d);
        var slope = computeSlope(_d, means);
        var intercept = computeIntercept(means, slope);
        return [intercept, slope];
    } else {
        console.log("data missing");
        return null;
    }
}

function computeMeans(_set) {
    var xMean = 0;
    var yMean = 0;
    for (var i = 0; i < _set.length; i++) {
        xMean += _set[i][0];
        yMean += _set[i][1];
    }
    var l = _set.length;
    return [xMean / l, yMean / l];
}

function computeSlope(_s, _m) {
    var slope = 0;
    var s1 = 0;
    var s2 = 0;
    for (var i = 0; i < _s.length; i++) {
        s1 += (_s[i][0] - _m[0]) * (_s[i][1] - _m[1]);
        s2 += Math.pow(_s[i][0] - _m[0], 2);
    }
    if (s2 !== 0) {
        slope = s1 / s2;
    }
    return slope;
}

function computeIntercept(_m, _sl) {
    var intercept = _m[1] - _sl * _m[0];
    return intercept;
}

function computeLine(_l) {
    // x1 y1 x2 y2
    var lD = [0, _l[0], W, _l[1] * W + _l[0]];
    return lD;
}

function drawLine(_gr, _l) {
    var x1 = _l[0].toString();
    var y1 = _l[1].toString();
    var x2 = _l[2].toString();
    var y2 = _l[3].toString();
    _gr.append("line")
        .attr("x1", x1)
        .attr("x2", x2)
        .attr("y1", y1)
        .attr("y2", y2)
        .attr("style", "stroke:" + COL3 + ";stroke-width:2");
}

function updateLine(_gr, _l) {
    var x1 = _l[0].toString();
    var y1 = _l[1].toString();
    var x2 = _l[2].toString();
    var y2 = _l[3].toString();
    d3.selectAll("line")
        .transition().attr("x1", x1)
        .attr("x2", x2)
        .attr("y1", y1)
        .attr("y2", y2);
}
