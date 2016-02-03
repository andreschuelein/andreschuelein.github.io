// linear regression in d3.js
// 
var R = 7; //radius
var COL1 = "#24588E";
var COL2 = "#F41313";
var COL3 = "#7801A9";
var COL4 = "#FFEA00";
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
var numOfClasses = 2;
var numOfNeighbours = 1;
var clusters = [];

var width = W - margin.left - margin.right,
    height = H - margin.top - margin.bottom;
var svg = d3.select("#sContainer")
    .style({
        width: W + "px",
        height: H + "px"
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

var cButton = d3.select('.header').append('div').append('button').text('classify data').attr('disabled', true).on('click', cBClick);

var gr = d3.select("svg").on("click", click);

var instructions = {
    //TODO center this with .node().getBoundingClientRect() (also in e7)
    line1: gr
        .append("g")
        .append("text")
        .text("click to add points, click on points to remove them")
        .attr("fill", "black")
        .attr("fill-opacity", "0.5")
        .attr("x", "85")
        .attr("y", "200")
        .attr("style", "font-size:1.4em"),
    line2: gr
        .append("g")
        .append("text")
        .text("press the button to classify your data points")
        .attr("fill", "black")
        .attr("fill-opacity", "0.5")
        .attr("x", "120")
        .attr("y", "240")
        .attr("style", "font-size:1.4em"),
    show: function() {
        instructions.line1
            .style('visibility', 'visible')
            .attr("fill-opacity", "0");
        instructions.line1
            .transition()
            .attr("fill-opacity", "0.5");
        instructions.line2
            .style('visibility', 'visible')
            .attr("fill-opacity", "0");
        instructions.line2
            .transition()
            .attr("fill-opacity", "0.5");
    },
    hide: function() {
        instructions.line1
            .transition()
            .attr("fill-opacity", "0")
            .each('end', function() {
                d3.select(this)
                    .style('visibility', 'hidden');
            });
        instructions.line2
            .transition()
            .attr("fill-opacity", "0")
            .each('end', function() {
                d3.select(this)
                    .style('visibility', 'hidden');
            });
    }
};

function click(_e) {
    instructions.hide();
    if (!hoverActive) {
        var m = d3.mouse(this);
        setMark(m[0], m[1], R, gr, COL1);
        data.push([m[0], m[1], null]);
    } else {
        hoverActive = false;
    }
    update();
}

function cBClick(_e) {
    //console.log(data.length);
    classifyData();
}

d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
        this.parentNode.appendChild(this);
    });
};

function setMark(_cx, _cy, _r, _gr, color) {
    _gr.append("circle")
        .attr("cx", _cx)
        .attr("cy", _cy)
        .attr("r", _r)
        .attr("fill", color)
        .on("mouseover", function() {
            d3.select(this).attr("fill", COL2);
        })
        .on("mouseout", (function(event) {
            d3.select(this).attr("fill", color);
        }))
        .on("click", (function(event) {
            var pt = d3.select(this);
            var ind = _findIndex(data, [pt.attr("cx"), pt.attr("cy"), null]);
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
    // console.log(data.length);
    cButton.attr('disabled', data.length > 1 ? null : true);
    if (data.length > 0) {

    } else {
        instructions.show();
    }
    d3.selectAll("circle").moveToFront();
}

function classifyData() {
    generateSeeds(numOfClasses);
    ///LOOP
    iterate();
    drawData();
}

function drawData() {
    d3.selectAll('circle').remove();
    // gr.data(data).enter().call(function(d, i) {
    //     console.log(data, d, i);
    //     return 0;
    // });
    data.forEach(function(d) {
        setMark(d[0], d[1], R, gr, classColor(d[2]));
    });
}

function classColor(_classIndex) {
    var c = d3.scale.linear().
    domain([0, numOfClasses - 1]).range([COL3, COL4]);

    return c(_classIndex);
}

function generateSeeds(_n) {
    // TODO generate good initial seeds, for example find points close to corners
    data.forEach(function(d) {
        d[2] = null;
    });
    data[0][2] = 0;
    data[1][2] = 1;
}

function initClusters() {
    clusters = [];
    for (var k = 0; k < numOfClasses; k++) {
        clusters.push([0, 0, 0]); // x/y/cluster size
    }
}

function iterate() {
    initClusters();
    computeClusters();
    computeClusterDistance(); //for each cluster
}

function computeClusters() {
    data.forEach(function(d) {
        if (d[2] !== null) { // add vector to cluster and increase cluster size by 1
            clusters[d[2]] = [clusters[d[2]][0] + d[0], clusters[d[2]][1] + d[1], clusters[d[2]][2] + 1];
        }
    });
    clusters.forEach(function(d) {
        if (d[2] !== 0) { //normalize to cluster size
            d[0] /= d[2];
            d[1] /= d[2];
        }
    });
    // console.log('clusters: ' + clusters);
}

function computeClusterDistance() { // requires for each class to have a cluster
    data.forEach(function(datum) {
        var dist = H + W;

        clusters.forEach(function(cluster, classIndex) {
            var distance = Math.sqrt(Math.pow(datum[0] - cluster[0], 2) + Math.pow(datum[0] - cluster[0], 2));
            if (distance < dist) {
                dist = distance;
                datum[2] = classIndex;
            }
        });

    });
}


// TODO MARK CLUSTERS
//
