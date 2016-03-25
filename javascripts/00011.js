// jshint esnext:true
var width = 1000,
    height = 900;
var svg = d3.select("#sContainer").append("svg")
    .attr("width", width)
    .attr("height", height);
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


// from https://stackoverflow.com/questions/14167863/how-can-i-bring-a-circle-to-the-front-with-d3/14426477#14426477
d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
        this.parentNode.appendChild(this);
    });
};


var app = {
    year: 2014,
    mode: null,
    main: function() {
        app.init();
    },
    init: function() {
        year = 2014;
        sexSelector = 'men';
        populationData = null;
        var q = d3_queue.queue()
            .defer(loader.geoData)
            .defer(loader.populationData)
            .defer(loader.growthData)
            .await(function(error) {
                if (error) {
                    throw error;
                } else {
                    dataQueries.init();
                    sweMap.init();
                    hist.init();
                    pc.init();
                    slider.init();
                    info.init();
                    tl.init();
                    sweMap.renderMap();
                    sweMap.drawBorders();
                    sweMap.colorGrowth(sexSelector, year);
                    if (AUTOSTART) {
                        tl.start();
                    }
                }
            });
    },
    update: function(_year, _dataSet) {
        if (!(_year === app.year && _dataSet === app.mode)) {
            _year=_year<1969?1969:_year;
            _year=_year>2014?2014:_year;
            app.year=_year;
            sweMap.update(_year, _dataSet);
            hist.update(_year, _dataSet);
            pc.update(_year, _dataSet);
            slider.update(_year, _dataSet);
            info.update(_year, _dataSet);
            tl.update(_year, _dataSet);
        }
    }
};



var loader = {
    geoData: function(_callback) {
        d3.json("../data/00011/swe.json", function(error, _map) {
            if (error) {
                return console.error(error);
            } else {
                map = _map;
                // sweMap.renderMap();
                // sweMap.drawBorders();
            }
        });
        _callback(null);
    },
    populationData: function(_callback) {
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
    },
    growthData: function(_callback) {
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
};


var dataQueries = {
    init: function() {},
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

var sweMap = {
    init: function() {
        sweMap.projection = d3.geo.albers()
            .center([0, 55.4])
            .rotate([4.4, 0])
            .parallels([50, 60])
            .scale(3300)
            .translate([-420, 880]);
        sweMap.path = d3.geo.path().projection(sweMap.projection);
    },
    update: function(_y,_d) {
        sweMap.colorGrowth(sexSelector, _y);
    },
    projection: null, //TODO fix this with getBoundingClientRect
    path: null,
    mode: "growth", // "population","growth",... tbd
    tileSelected: false,
    draw: function() {},
    drawBorders: function() {
        svg.append('path')
            .datum(topojson.mesh(map, map.objects.swe_epgs4326, function(a, b) {
                return true;
            }))
            .attr('d', sweMap.path)
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
            .attr("d", sweMap.path)
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
            .attr('d', sweMap.path)
            .attr('class', 'marked');
    },
    drawBorderHover: function(_id) {
        svg.append('path')
            .datum(topojson.mesh(map, map.objects.swe_epgs4326, function(a, b) {
                if (parseInt(a.id) === _id || parseInt(b.id) === _id) {
                    return true;
                }
            }))
            .attr('d', sweMap.path)
            .attr('class', 'hover');
    },
    removeBorderMarked: function() {
        d3.selectAll('.marked').remove();
    },
    removeBorderHover: function() {
        d3.selectAll('.hover').remove();
    },
    centerMap: function() {

    },
    colorPop: function(_sx, _yr) {
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
    },
    colorGrowth: function(_sx, _yr) {
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
    obj: svg.append('g').attr('class', 'slider'),
    anchor: [370, 650],
    data: [],
    year: 1968,
    height: 200,
    width: 600,
    x: null,
    y: null,
    xAxis: null,
    yAxis: null,
    init: function() {
        slider.x = d3.scale.linear().domain([1968, 2014]).range([0, slider.width]).nice();
        slider.y = d3.scale.linear().domain([100000, 0]).range([0, slider.height]).nice();
        slider.obj.attr('transform', 'translate(' + slider.anchor[0] + ',' + slider.anchor[1] + ')');
        for (var i = 1968; i < 2015; i++) {
            var totalMen = dataQueries.getPop(i, "men", null);
            var totalWomen = dataQueries.getPop(i, "women", null);
            slider.data.push({ year: i, total: totalMen + totalWomen, men: totalMen, women: totalWomen });
        }
        slider.drawAxis();
        slider.obj.append('rect')
            .attr('width', slider.width)
            .attr('height', slider.height)
            .style('opacity', 0)
            // .style('fill','red')
            .on('mouseenter', slider.eventHandler.enter)
            .on('mouseleave', slider.eventHandler.leave)
            .on('mousemove', slider.eventHandler.move)
            .on('click', slider.eventHandler.click);
    },
    update: function() {},
    eventHandler: {
        mouseover: false,
        enter: function(_e) {
            slider.eventHandler.mouseover = true;
            slider.reticle.show();
        },
        leave: function(_e) {
            console.log('LEAVE');
            slider.eventHandler.mouseover = false;
            slider.reticle.hide();
        },
        move: function(_e) {
            var _m = d3.mouse(this);
            slider.reticle.update(_m);
            // console.log(Math.round(slider.x.invert(_m[0])));
            app.update(Math.round(slider.x.invert(_m[0])), null)
        },
        click: function(_e) {
            // console.log('CLICK');
            slider.setYear();
        }
    },
    reticle: {
        show: function() {
            // vertical line
            // console.log("LINE");
            slider.obj.append('line')
                .classed('sliderreticle', true)
                .classed('vertical', true)
                .attr('x1', 0)
                .attr('y1', slider.height)
                .attr('x2', 0)
                .attr('y2', 0);
            slider.obj.append('line')
                .classed('sliderreticle', true)
                .classed('horizontal', true)
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', slider.width)
                .attr('y2', 0);
            slider.obj.select('rect').moveToFront();
        },
        hide: function() {
            d3.selectAll('.sliderreticle').remove();
        },
        update: function(_pos) {
            d3.selectAll('.slider').select('.vertical')
                // .transition()
                .attr('x1', _pos[0])
                .attr('x2', _pos[0]);
            d3.selectAll('.slider').select('.horizontal')
                // .transition()
                .attr('y1', _pos[1])
                .attr('y2', _pos[1]);

        }
    },
    markAnchor: function() {
        svg.append('circle')
            .attr('class', 'slideranchor')
            .attr('cx', slider.anchor[0])
            .attr('cy', slider.anchor[1])
            .attr('r', 20)
            .attr('fill', 'red');
    },
    drawAxis: function() {
        slider.xAxis = d3.svg
            .axis()
            .scale(slider.x)
            .orient("bottom")
            .tickFormat(d3.format('4d'));

        slider.yAxis = d3.svg
            .axis()
            .scale(slider.y)
            .orient("left");


        slider.obj.append("g")
            .attr("class", "axis")
            .attr('transform', 'translate(' + 0 + ',' + slider.height + ')')
            .call(slider.xAxis);

        slider.obj.append("g")
            .attr("class", "axis")
            .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
            .call(slider.yAxis);

        yLabel = slider.obj.append("text")
            .attr("transform", "rotate(-90)")
            .attr("dx", -slider.height / 2)
            .attr('dy', -60)
            .style("text-anchor", "middle")
            .text("population");

        var yearFormat = d3.format('4d');
        xLabel = slider.obj.append("text")
            .attr("transform", "translate(" + (slider.width / 2) + " ," + (slider.height + 35) + ")")
            .style("text-anchor", "middle")
            .text("year");
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
            // sweMap.colorGrowth(sexSelector, tl.currentYear);
        } else {
            tl.init();
        }
    }
};


app.main();
