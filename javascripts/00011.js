// jshint esnext:true
var q;
var width = 1000,
    height = 900;
var svg = d3.select("#sContainer").append("svg")
    .attr("width", width)
    .attr("height", height);
var projection = d3.geo.albers()
    .center([0, 55.4])
    .rotate([4.4, 0])
    .parallels([50, 60])
    .scale(3500)
    .translate([-100, 930]); //TODO fix this with getBoundingClientRect
var path = d3.geo.path()
    .projection(projection);
const AUTOSTART = false;
const COL1 = "#B4B4B4";
// const COLS = ['#2b83ba', '#abdda4', '#ffffbf', '#fdae61', '#d7191c']; // thanks to http://colorbrewer2.org/
// var colScale1 = d3.scale.linear().domain([0, 10000, 20000, 30000, 40000]).range(COLS);

const COLS1 = ['#ffffb2', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#b10026'];
const DOMAIN1 = [1000, 5000, 10000, 20000, 30000, 40000, 50000];
var colScale1 = d3.scale.linear().domain(DOMAIN1).range(COLS1); // for population
const COLS2 = ['#d7191c', '#fdae61', '#ffffbf', '#abd9e9', '#2c7bb6'];
const DOMAIN2 = [-300, -100, 0, 100, 1000];
var colScale2 = d3.scale.linear().domain(DOMAIN2).range(COLS2); // for growth
var year;
var sexSelector;
var populationData, growthData;
var map, swe;

// var tooltip = {
//     direction: 'right',
//     obj: d3.select("#sContainer")
//         .append('div')
//         .attr('class', 'tooltip')
//         .style('opacity', 0)
//         .on('mouseover', (function(event) {
//             d3.event.preventDefault();
//         })),
//     updatePos: function(_x, _y) {
//         var r = tooltip.obj.node().getBoundingClientRect();
//         var xOffset = tooltip.direction === 'right' ? 30 : -r.width;
//         var yOffset = -r.height - 10;
//         tooltip.obj
//             .style('left', (_x + xOffset) + 'px')
//             .style("top", (_y + yOffset) + "px");
//     },
//     updateLabel: function(_html_text) {
//         tooltip.obj
//             .html(_html_text);
//     },
//     show: function(_opacity) {
//         tooltip.obj.transition().duration(150).style('opacity', _opacity ? _opacity : 1);
//     },
//     hide: function() {
//         tooltip.obj.transition().style('opacity', 0);
//     },
// };

// from https://stackoverflow.com/questions/14167863/how-can-i-bring-a-circle-to-the-front-with-d3/14426477#14426477
d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
        this.parentNode.appendChild(this);
    });
};


function init(_callback) {
    year = 2014;
    sexSelector = 'men';
    populationData = null;
    _callback(null);
}

function loadGeoData(_callback) {
    d3.json("../data/00011/swe.json", function(error, _map) {
        if (error) {
            return console.error(error);
        } else {
            map = _map;
            sweMap.renderMap();
            sweMap.drawBorders();
        }
    });
    _callback(null);
}


function loadPopulationData(_callback) {
    d3.csv('../data/00011/population.csv', function(err, res) {
        if (err) {
            throw (err);
        } else {
            populationData = res;
            populationData.forEach(function(d) {
                d.region = parseInt(d.region);
            });
            if (_callback) {
                _callback(null);
            }
        }
    });
}

function loadGrowthData(_callback) {
    d3.csv('../data/00011/growth.csv', function(err, res) {
        if (err) {
            throw (err);
        } else {
            growthData = res;
            growthData.forEach(function(d) {
                d.region = parseInt(d.region);
            });
            if (_callback) {
                _callback(null);
            }
        }
    });
}

function colorPop(_sx, _yr) {
    if (_sx === 'total') {
        // add women and men
    } else {
        populationData.forEach(function(dat, ind) {
            if (dat.sex === _sx) {
                svg.selectAll('.reg' + dat.region)
                    .attr('fill', colScale1(dat[_yr]));
            }
        });
    }
}

function colorGrowth(_sx, _yr) {
    if (_sx === 'total') {
        // add women and men
    } else {
        growthData.forEach(function(dat, ind) {
            if (dat.sex === _sx) {
                svg.selectAll('.reg' + dat.region)
                    .attr('fill', colScale2(dat[_yr]));
            }
        });
    }
}


var dataQueries = {
    getPop: function(_year, _sex, _region) {
        var pop = 0;
        if (_region) {
            // specific region, gender, year
            var found = null;
            if (populationData !== null) {
                populationData.some(function(dat, ind) {
                    if (dat.region === _region && dat.sex === _sex) {
                        found = ind;
                        return dat[_year];
                    }
                });
                pop = found !== null ? parseInt(populationData[found][_year]) : 'data point unavailable';
                return pop;
            }
        } else if (_sex) {
            // specific gender and year, total for whole country
            populationData.forEach(function(dat, ind) {
                if (dat.sex === _sex) {
                    pop += parseInt(dat[_year]);
                }
            });
            return pop;
        } else {
            // specific year, gender unspecific and whole country
            populationData.forEach(function(dat, ind) {
                pop += parseInt(dat[_year]);
                return pop;
            });
        }
        throw "wrong params";
        // return pop;
    },
    getGrowth: function(_year, _sex, _region) {
        var pop = 0;
        if (_region) {
            // specific region, gender, year
            var found = null;
            if (growthData !== null) {
                growthData.some(function(dat, ind) {
                    if (dat.region === _region && dat.sex === _sex) {
                        found = ind;
                        return dat[_year];
                    }
                });
                pop = found !== null ? parseInt(growthData[found][_year]) : 'data point unavailable';
                return pop;
            }
        } else if (_sex) {
            // specific gender and year, total for whole country
            growthData.forEach(function(dat, ind) {
                if (dat.sex === _sex) {
                    pop += parseInt(dat[_year]);
                }
            });
            return pop;
        } else {
            // specific year, gender unspecific and whole country
            growthData.forEach(function(dat, ind) {
                pop += parseInt(dat[_year]);
                return pop;
            });
        }
        throw "wrong params";
        // return pop;
    }
};


function backgroundLoading() {
    q = d3_queue.queue()
        .defer(loadGeoData)
        .defer(loadPopulationData)
        .defer(loadGrowthData)

    .await(function(error) {
        if (error) {
            throw error;
        } else {
            colorGrowth(sexSelector, year);
            if (AUTOSTART) {
                tl.start();
            }
        }
    });
}

var sweMap = {
    mode: "growth", // "population","growth",... tbd
    tileSelected: false,
    draw: function() {},
    drawBorders: function() {
        svg.append('path')
            .datum(topojson.mesh(map, map.objects.swe_epgs4326, function(a, b) {
                return true;
            }))
            .attr('d', path)
            .attr('class', 'boundary');
    },
    renderMap: function() {
        swe = topojson.feature(map, map.objects.swe_epgs4326);
        svg.selectAll('.swe')
            .data(swe.features)
            .enter()
            .append("path")
            .attr("class", function(d) {
                return "swe reg" + parseInt(d.id);
            })
            .attr("d", path)
            .attr('fill', COL1);

        // attach mouse event handlers
        svg.selectAll('.swe')
            .on('click', function(_event) {
                var selReg = parseInt(_event.id);
                if (selReg === sweMap.tileSelected) {
                    // unfocus
                    sweMap.tileSelected = false;
                    sweMap.removeBorderMarked();
                } else {
                    // focus
                    sweMap.tileSelected = selReg;
                    sweMap.removeBorderMarked();
                    sweMap.drawBorderMarked(selReg);
                }
            })
            .on('mouseenter', function(_event) {
                if (parseInt(_event.id) !== sweMap.tileSelected) {
                    sweMap.drawBorderHover(parseInt(_event.id));
                }
            })
            .on('mouseleave', function(_event) {
                sweMap.removeBorderHover();
            });
    },
    drawBorderMarked: function(_id) {
        svg.append('path')
            .datum(topojson.mesh(map, map.objects.swe_epgs4326, function(a, b) {
                if (parseInt(a.id) === _id || parseInt(b.id) === _id) {
                    return true;
                }

            }))
            .attr('d', path)
            .attr('class', 'marked');
    },
    drawBorderHover: function(_id) {
        svg.append('path')
            .datum(topojson.mesh(map, map.objects.swe_epgs4326, function(a, b) {
                if (parseInt(a.id) === _id || parseInt(b.id) === _id) {
                    return true;
                }
            }))
            .attr('d', path)
            .attr('class', 'hover');
    },
    removeBorderMarked: function() {
        d3.selectAll('.marked').remove();
    },
    removeBorderHover: function() {
        d3.selectAll('.hover').remove();
    },
    centerMap: function() {

    }

};

var hist = {
    data: [],
    // x: d3.scale.linear().domain().range(),
    // y: d3.scale.linear().domain().range(),
    init: function() {},
    update: function() {}
};

var pc = {
    // x: d3.scale.linear().domain().range(),
    // y: d3.scale.linear().domain().range(),
    init: function() {},
    update: function() {}
};

var slider = {
    data: [],
    year: 1968,
    // x: d3.scale.linear().domain().range(),
    // y: d3.scale.linear().domain().range(),
    init: function() {
        for (var i = 1968; i < 2015; i++) {
            var totalMen = dataQueries.getPop(i, "men", null);
            var totalWomen = dataQueries.getPop(i, "women", null);
            slider.data.push({ year: i, total: totalMen + totalWomen, men: totalMen, women: totalWomen });
        }
    },
    update: function() {
        // svg;
    },
    getYear: function() {
        return slider.year;
    },
    setYear: function(_year) { slider.year = _year; }
};

var info = {
    init: function() {},
    update: function() {}
};

var tl = {
    currentYear: 1968,
    playState: false, // play/pause toggle
    previousFrameTime: 0,
    elapsedTime: 0,
    frameDuration: 200,
    init: function() {
        tl.currentYear = 1968;
        tl.previousFrameTime = 0;
        tl.elapsedTime = 0;
    },
    clock: function(currentTime) {
        tl.elapsedTime = currentTime - tl.previousFrameTime;
        // console.log(tl.elapsedTime);
        if (tl.elapsedTime > tl.frameDuration) {
            tl.previousFrameTime = currentTime;
            tl.update();
        }
        return (!tl.playState);
    },
    start: function() {
        tl.init();
        tl.playState = true;
        d3.timer(tl.clock);
    },
    stop: function() {
        tl.playState = false;
    },
    update: function() {
        if (tl.currentYear < 2014) {
            tl.currentYear++;
            // console.log(tl.currentYear);
            colorGrowth(sexSelector, tl.currentYear);
        } else {
            tl.init();
        }
    }
};


function main() {

    init(backgroundLoading);

}

main();
