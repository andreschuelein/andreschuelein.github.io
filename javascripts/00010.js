// k-means clustering in d3.js
// 
// jshint esnext:true

const R = 7; //radius
const COL1 = "#FFFFFF";
const COL2 = "#050505";
const COL3 = "#7801A9";
const COL4 = "#FFEA00";
const H = 450;
const W = 600;
const CSPACE = ["#FF2400", "#00AEFF", "#00FF06", "#1800FF", "#FFDE00", "#FF00B4", "#00FFA8", "#6A3900", "#304F00", "#717171"];
const S = {
    cMin: 2, //min number of clusters
    cMax: 10, //max number of clusters
    sMin: 5, //min cluster size
    sMax: 40, //max cluster size
    stdMin: 10, //min standard deviation
    stdMax: 60, //max standard deviatioon
    hMin: 20,
    hMax: H - 20,
    wMin: 20,
    wMax: W - 20
};
const dataLimit = 800;
var hoverActive = false;
var data = [];
var newData = [];
var margin = {
    top: 20,
    right: 10,
    bottom: 20,
    left: 10
};
var numOfClasses = 2;
var numOfIterations = 1000;
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

var sliderObj = d3.slider()
    .axis(true)
    .min(2)
    .max(10)
    .step(1)
    .value(numOfClasses)
    .on('slide', function(_e, _val) {
        controlPanel.setClassText(_val);
        numOfClasses = _val;
    });

var controlPanel = {
    obj: d3.select('main')
        .append('div')
        .attr('class', 'controls')
        .style('width', W - 30 + 'px'),
    cHeader: d3.select('.controls')
        .append('h3')
        .attr('class', 'controls_header')
        .text('controls'),
    cButton: d3.select('.controls')
        .append('div')
        .append('button')
        .attr('id', 'classify')
        .text('classify data')
        .attr('disabled', true)
        .on('click', cBClick),
    resetButton: d3.select('.controls')
        .append('div')
        .append('button')
        .attr('id', 'reset')
        .text('clear all')
        .attr('disabled', true)
        .on('click', resetClick),
    spawnButton: d3.select('.controls')
        .append('div')
        .append('button')
        .attr('id', 'spawn')
        .text('spawn random data')
        .on('click', spawnClick),
    classSlider: d3.select('.controls')
        .append('div')
        .attr('class', 'slider')
        .call(sliderObj),
    classText: d3.select('.controls')
        .append('div')
        .attr('class', 'class_text')
        .html("number of classes: " + sliderObj.value()),
    setClassText: function(classValue) {
        controlPanel.classText.html("number of classes: " + classValue);
    }
};

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
    controlPanel.resetButton.attr('disabled', true);
}

function resetData() {
    d3.selectAll('circle').remove();
    data = [];
    update();
}

function cBClick(_e) {
    classifyData();
}

function nrandomPair(mean, std) {
    // using Marsaglia polar method
    mean = mean ? mean : [0, 0];
    std = std ? ((std[0] > 0) && (std[1] > 0) ? std : [1, 1]) : [1, 1];
    var _x, _y, _r, _s;
    do {
        _x = 2 * Math.random() - 1;
        _y = 2 * Math.random() - 1;
        _r = _x * _x + _y * _y;
    } while (_r >= 1 || _r === 0);
    _s = Math.sqrt(-2 * Math.log(_r) / _r);
    return [mean[0] + _x * std[0] * _s, mean[1] + _y * std[1] * _s];
}

function spawnClick() {
    instructions.hide();
    var numClusters = S.cMin + Math.floor(Math.random() * (S.cMax - S.cMin));
    for (var _numC = 0; _numC < numClusters; _numC++) {
        var stdCluster = [];
        var meanCluster = [];
        var _p = []; //point
        var sizeCluster = S.sMin + Math.floor(Math.random() * (S.sMax - S.sMin));
        stdCluster[0] = S.stdMin + Math.floor(Math.random() * (S.stdMax - S.stdMin));
        stdCluster[1] = S.stdMin + Math.floor(Math.random() * (S.stdMax - S.stdMin));
        meanCluster[0] = S.wMin + Math.floor(Math.random() * (S.wMax - S.wMin));
        meanCluster[1] = S.hMin + Math.floor(Math.random() * (S.hMax - S.hMin));
        for (var _sizeC = 0; _sizeC < sizeCluster; _sizeC++) {
            if (data.length < dataLimit) {
                _p = nrandomPair(meanCluster, stdCluster);
                if (_p[0] >= 0 && _p[0] < W && _p[1] >= 0 && _p[1] < H) {
                    data.push(_p);
                    setMark(_p[0], _p[1], R, gr, COL1);
                }
            }
        }
    }
    update();
}


d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
        this.parentNode.appendChild(this);
    });
};

function setMark(_cx, _cy, _r, _gr, color) {
    _gr.append("circle")
        .attr('class', 'mark')
        .attr("cx", _cx)
        .attr("cy", _cy)
        .attr("r", _r)
        .attr("fill", color)
        .attr('stroke', "#000000")
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
    controlPanel.resetButton.attr('disabled', data.length > 0 ? null : true);
    controlPanel.cButton.attr('disabled', data.length > 1 ? null : true);
    controlPanel.spawnButton.attr('disabled', data.length >= dataLimit ? true : null);
    if (data.length > 0) {} else {
        instructions.show();
    }
    d3.selectAll(".mark").moveToFront();
}

function classifyData() {
    generateSeeds(numOfClasses);
    for (var it = 0; it < numOfIterations; it++) {
        iterate();
    }
    drawData();
    drawClusters();
    update();
}

function drawData() {
    d3.selectAll('circle').remove();
    data.forEach(function(d) {
        setMark(d[0], d[1], R, gr, classColor(d[2]));
    });
}

function classColor(_classIndex) {
    return _classIndex !== null ? CSPACE[_classIndex] : '#FFFFFF';
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
        // d[2] = inject.indexOf(i) >= 0 ? inject.indexOf(i) : Math.floor(numOfClasses * Math.random());
        d[2] = inject.indexOf(i) >= 0 ? inject.indexOf(i) : null;
    });
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
}

function drawClusters() {
    d3.selectAll('.cluster').remove();
    clusters.forEach(markCluster);
}

function markCluster(_cluster, _index) {
    gr.append("circle")
        .attr('class', 'circle')
        .attr("cx", _cluster[0])
        .attr("cy", _cluster[1])
        .attr("r", R * 5)
        .attr("fill", CSPACE[_index])
        .style("opacity", 0.3);
}

function computeClusterDistance() {
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
