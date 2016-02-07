// linear regression in d3.js
// jshint esnext:true

const R = 7; //radius
const COL1 = "#24588E";
const COL2 = "#F41313";
const COL3 = "#7801A9";
const COL4 = "#FFEA00";
const H = 450;
const W = 600;
var hoverActive = false;
var data = [];
var newData = [];
//var lineDrawn = false;
var margin = {
    top: 20,
    right: 10,
    bottom: 20,
    left: 10
};
var numOfClasses = 10;
var numOfIterations = 1000;
// var numOfNeighbours = 1;
var clusters = [];
var k = 4;

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



var cDiv = d3.select('body')
    .append('div')
    .attr('class', 'controls')
    .style('width', W - 30 + 'px')
    .style('height', '150px')
    .style('margin-top', '20px')
    .style('margin-left', 'auto')
    .style('margin-right', 'auto')
    .style('margin-bottom', 'auto')
    .style('padding', '20px 25px 10px 25px')
    .style('background-color', '#D0D0D0')
    .append('h3')
    .attr('class', 'controls_header')
    .text('controls');

var cButton = d3.selectAll('.controls') //d3.select('.header')
    .append('div').append('button').text('classify data').attr('disabled', true).on('click', cBClick);

var resetButton = d3.selectAll('.controls')
    .append('div').append('button').text('reset data').attr('disabled', true).on('click', resetClick);

var gr = d3.select("svg").on("click", click);

var instructions = {
    //TODO center this with .node().getBoundingClientRect() (also in e7)
    line1: gr
        .append("g")
        .append("text")
        .attr('class', 'instuctions')
        .text("click to add points, click on points to remove them")
        .attr("fill", "black")
        .attr("fill-opacity", "0.5")
        .attr("x", "85")
        .attr("y", "200")
        .attr("style", "font-size:1.4em"),
    line2: gr
        .append("g")
        .append("text")
        .attr('class', 'instuctions')
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

function resetClick(_e) {
    resetData();
    resetButton.attr('disabled', true);
}

function resetData() {
    d3.selectAll('circle').remove();
    data = [];
    update();
}

function cBClick(_e) {
    classifyData();
}

d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
        this.parentNode.appendChild(this);
    });
};


function setMark(_cx, _cy, _r, _gr, color) {
    _gr.append("circle")
        .attr('class', 'circle')
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
    resetButton.attr('disabled', data.length > 0 ? null : true);
    cButton.attr('disabled', data.length > 1 ? null : true);
    if (data.length > 0) {

    } else {
        instructions.show();
    }
    d3.selectAll("circle").moveToFront();
}

function classifyData() {
    generateSeeds(numOfClasses);
    // drawData();
    ///LOOP
    for (var it = 0; it < numOfIterations; it++) {
        iterate();
    }
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
    var inject = null;
    inject = [];
    var positions = [];
    for (var t = 0; t < data.length; t++) {
        positions[t] = t;
    }
    for (var p = 0; p < numOfClasses; p++) {
        var rndNum = Math.floor(positions.length * Math.random());
        inject[p] = positions[rndNum];
        positions.splice(rndNum, 1);
    }
    data.forEach(function(d, i) {
        d[2] = inject.indexOf(i) >= 0 ? inject.indexOf(i) : Math.floor(numOfClasses * Math.random());
    });
    // data.forEach(d => console.log(d[2]));
}

function iterate() {
    initClusters();
    computeClusters();
    computeClusterDistance(); //for each cluster
}

function initClusters() {
    clusters = [];
    for (var k = 0; k < numOfClasses; k++) {
        clusters.push([0, 0, 0]); // x/y/cluster size
    }
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

function computeClusterDistance() {
    // 1-mean clustering
    // TODO k-mean clustering

    // requires for each class to have a cluster
    data.forEach(function(datum) {
        var dist = H + W;

        clusters.forEach(function(cluster, classIndex) {
            var distance = Math.sqrt(Math.pow(datum[0] - cluster[0], 2) + Math.pow(datum[1] - cluster[1], 2));
            if (distance < dist) {
                dist = distance;
                datum[2] = classIndex;
            }
        });

    });


    // var newData = data;
    // newData.forEach(function(datum, datumIndex) {
    //     var dist = H + W;

    //     data.forEach(function(dat, datIndex) {
    //         var distCollection = [];
    //         var distance = Math.sqrt(Math.pow(datum[0] - dat[0], 2) + Math.pow(datum[1] - dat[1], 2));
    //         if (distance < dist && datumIndex !== datIndex) {
    //             dist = distance;
    //             datum[2] = classIndex;
    //         }
    //     });

    // });
    // data = newData;
}


// function iterate() {
//     newData = data;
//     newData.forEach(function(_nD, _nI) {
//         classifyPoint(_nD[0], _nD[1], k, _nI);
//     });
//     data = newData;
// }

// function classifyPoint(_x, _y, _k, _index)
// // _x,_y coordinates of the point the should be classified
// // _k as in knn
// // _i index of the point that should be classified in array.data
// {
//     var kList = [];
//     data.forEach(function(_d, _i) {
//         if (kList.length !== 0) {
//             var _pos = 0;
//             var _dist = 0;
//             while (_pos < kList.length) {
//                 _dist = distance(_x, _y, _d[0], _d[1]);
//                 if (kList[_pos][0] >= _dist) {
//                     break;
//                 } else {
//                     _pos++;
//                 }
//             }
//             kList.splice(_pos, 0, [_dist, _d[2]]);
//         } else { // push initial element
//             kList.push([distance(_x, _y, _d[0], _d[1]), _d[2]]);
//         }
//     });
//     // evaluate kList
//     var classHist = [];
//     for (var _r = 0; _r < numOfClasses; _r++) {
//         classHist[_r] = 0;
//     }
//     for (var _kk = 0; _kk < _k; _kk++) {
//         classHist[kList[_kk][1]]++;
//     }
//     newData[_index][2] = classHist.indexOf(Math.max(...classHist));
// }

// function distance(x1, y1, x2, y2) {
//     if (x1 && y1 && x2 && y2) {
//         return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
//     }
//     return null;
// }
