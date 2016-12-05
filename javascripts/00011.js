// jshint esnext:true
var width = 1000,
    height = 900;
var svg = d3.select("#sContainer").append("svg")
    .attr("width", width)
    .attr("height", height);
const AUTOSTART = false;
var genderFlag;
var map, swe;
var dispatch = d3.dispatch("hover", "unhover", "focus", "timer");

// from https://stackoverflow.com/questions/14167863/how-can-i-bring-a-circle-to-the-front-with-d3/14426477#14426477
d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
        this.parentNode.appendChild(this);
    });
};


var app = {
    year: null,
    mode: null,
    modes: {
        population: 0,
        growth: 1
    },
    genders: {
        male: "men",
        female: "women",
        total: "total"
    },
    gender: 2,
    main: function() {
        app.init();
    },
    init: function() {
        app.mode = app.modes.growth;
        // app.mode = app.modes.population;
        app.year = 2000;
        // console.log('app.year:' + app.year);

        genderFlag = 'men';
        // dataSets.population.data = null;
        dataSets.regionNames = {};
        var q = d3_queue.queue()
            .defer(loader.geoData)
            .defer(loader.populationData)
            .defer(loader.growthData)
            .await(function(error) {
                if (error) {
                    throw error;
                } else {
                    dataSets.init();
                    sweMap.init();
                    hist.init();
                    pc.init();
                    slider.init();
                    info.init();
                    tl.init();
                    sweMap.renderMap();
                    sweMap.drawBorders();
                    sweMap.drawColor(genderFlag, app.year);
                    if (AUTOSTART) {
                        tl.start();
                    }
                }
            });
    },
    focus: {
        gender: null,
        year: null,
        region: null
    },
    setFocus: function(_gender, _year, _region) {
        app.focus.gender = _gender;
        app.focus.year = _year;
        app.focus.region = _region;
    },
    hover: {
        gender: null,
        year: null,
        region: null
    },
    setHover: function(_gender, _year, _region) {
        app.hover.gender = _gender;
        app.hover.year = _year;
        app.hover.region = _region;
    },
    hoverUpdate: function() {
        // this.hover.gender = e.gender = null ? this.hover.gender : e.gender;
        // this.hover.year = e.year = null ? this.hover.year : e.year;
        // this.hover.region = e.region = null ? this.hover.region : e.region;
        // this.hover.gender = e.gender;
        // this.hover.year = e.year;
        // this.hover.region = e.region;
        this.update();
    },
    focusUpdate: function() {
        // this.focus.gender = e.gender;
        // this.focus.year = e.year;
        // this.focus.region = e.region;
        this.update();

    },
    update: function(_year, _dataSet) {
        _year = _year == null ? app.year : _year;
        if (!(_year === app.year && _dataSet === app.mode)) {
            _year = _year < 1969 ? 1969 : _year;
            _year = _year > 2014 ? 2014 : _year;
            app.year = _year;
            sweMap.update(_year, _dataSet);
            hist.update(_year, _dataSet);
            pc.update(_year, _dataSet);
            slider.update(_year, _dataSet);
            info.update(_year, _dataSet);
            tl.update(_year, _dataSet);
        }
    }
};

dispatch.on('hover', function() {
    app.hoverUpdate();
});

dispatch.on('unhover', function() {
    app.hoverUpdate();
});

dispatch.on('focus', function() {
    app.focusUpdate();
});

dispatch.on('timer', function() {
    console.log('timer event');

    app.update();
});




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
                dataSets.population.data = res;
                dataSets.population.data.forEach(function(d) {
                    dataSets.regionNames[parseInt(d.region).toString()] = d.region.slice(5);
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
                dataSets.growth.data = res;
                dataSets.growth.data.forEach(function(d) {
                    d.region = parseInt(d.region);
                });
                if (_callback) {
                    _callback(null);
                }
            }
        });
    }
};


var dataSets = {
    regionNames: null,
    population: {
        data: null,
        name: 'population',
        minYear: 1968,
        maxYear: 2014,
        minValue: null,
        maxValue: null,
        colorScale: {
            COLS: ['#ffffb2', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#b10026'],
            DOMAIN: [1000, 5000, 10000, 20000, 30000, 40000, 50000],
            scale: null
        }
    },
    growth: {
        data: null,
        name: 'population growth',
        minYear: 1969,
        maxYear: 2014,
        minValue: null,
        maxValue: null,
        colorScale: {
            COLS: ['#d7191c', '#fdae61', '#ffffbf', '#abd9e9', '#2c7bb6'],
            DOMAIN: [-300, -100, 0, 100, 1000],
            scale: null
        }
    },
    init: function() {
        this.population.colorScale.scale = d3.scale.linear().domain(dataSets.population.colorScale.DOMAIN).range(dataSets.population.colorScale.COLS);
        this.growth.colorScale.scale = d3.scale.linear().domain(dataSets.growth.colorScale.DOMAIN).range(dataSets.growth.colorScale.COLS);
        this.setValueRange(this.population);
        this.setValueRange(this.growth);
    },
    setValueRange: function(dataset) {
        var min = null;
        var max = null;
        // console.log(dataset.data);
        for (i = dataset.minYear; i <= dataset.maxYear; i++) {
            var yearTotal = 0;
            var yearMale = 0;
            var yearFemale = 0;
            dataset.data.forEach(function(dat, ind) {
                // console.log('year: ' + i + ' regions/gender: ' + ind + ' population: ' + dat[i]);
                yearTotal += parseInt(dat[i]);
                if (dat.sex === app.genders.male)
                    yearMale += parseInt(dat[i]);
                if (dat.sex === app.genders.female)
                    yearFemale += parseInt(dat[i]);

            });
            min = min === null ? yearTotal : min;
            min = min > yearTotal ? yearTotal : min;
            min = min > yearMale ? yearMale : min;
            min = min > yearFemale ? yearFemale : min;

            max = max === null ? yearTotal : max;
            max = max < yearTotal ? yearTotal : max;
            max = max < yearMale ? yearMale : max;
            max = max < yearFemale ? yearFemale : max;

        }
        dataset.minValue = min;
        dataset.maxValue = max;

        // console.log('min ' + dataset.name + ': ' + min);
        // console.log('max ' + dataset.name + ': ' + max);

    },

    getActive: function(mode) {
        mode = mode == null ? app.mode : mode;
        switch (mode) {
            case app.modes.population:
                return dataSets.population;
            case app.modes.growth:
                return dataSets.growth;
            default:
                console.log('INVALID MODE');
                return null;
        }
    },
    queryValue: function(set, year, gender, region) {
        var pop = 0;
        if (_region)
        // specific region
            return this.queryRegion(set, year, gender, region);
        else
        //entire country
            return this.queryCountry(set, year, gender);
    },
    queryCountry: function(set, year, gender) {
        var result = 0;
        if (gender === app.genders.total) {
            // male and female
            set.data.forEach(function(d, i) {
                result += parseInt(d[year]);
            });
        } else {
            // specific gender
            set.data.forEach(function(d, i) {
                if (d.sex === gender)
                    result += parseInt(d[year]);
            });
        }
        return result;
    },
    queryRegion: function(set, year, gender, region) {
        var result = 0;
        if (gender === app.genders.total) {
            // male and female
            set.data.forEach(function(d, i) {
                if (d.region === region)
                    result += parseInt(d[year]);
            });
        } else {
            // specific gender
            set.data.forEach(function(d, i) {
                if (d.sex === gender && d.region === region)
                    result += parseInt(d[year]);
            });
        }
        return result;
    }
};

var sweMap = {
    projection: null, //TODO fix this with getBoundingClientRect
    path: null,
    // mode: "growth", // "population","growth",... tbd
    tileSelected: false,
    init: function() {
        sweMap.projection = d3.geo.albers()
            .center([0, 55.4])
            .rotate([4.4, 0])
            .parallels([50, 60])
            .scale(3300)
            .translate([-420, 880]);
        sweMap.path = d3.geo.path().projection(sweMap.projection);
    },
    update: function(_y, _d) {
        sweMap.drawColor(genderFlag, _y);
    },
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
            // .attr('fill', COL1)
        ;

        // attach mouse event handlers
        svg.selectAll('.swe')
            .on('click', function(_event) {
                var selReg = parseInt(_event.id);
                if (selReg === sweMap.tileSelected) {
                    // unfocus
                    // app.focus.region = null;
                    sweMap.tileSelected = false;
                    sweMap.removeBorderMarked();
                    dispatch.focus({ region: null, gender: app.focus.gender, year: app.focus.year });
                } else {
                    // focus
                    // app.focus.region = parseInt(_event.id);
                    sweMap.tileSelected = selReg;
                    sweMap.removeBorderMarked();
                    sweMap.drawBorderMarked(selReg);
                    dispatch.focus({ region: parseInt(_event.id), gender: app.focus.gender, year: app.focus.year });
                }
            })
            .on('mouseenter', function(_event) {
                if (parseInt(_event.id) !== sweMap.tileSelected) {
                    // app.hover = { region: parseInt(_event.id), gender: null, year: null };
                    // sweMap.drawBorderHover(parseInt(_event.id));
                    // console.log('app.year before: ' + app.year);
                    app.setHover(null, null, parseInt(_event.id));
                    dispatch.hover(); //ISSUE HERE
                    // console.log('app.year after: ' + app.year);
                }
            })
            .on('mouseleave', function(_event) {
                // app.hover = { region: null, gender: null, year: null };
                sweMap.removeBorderHover();
                dispatch.unhover({ region: null, gender: null, year: null });
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
    // colorPop: function(_sx, _yr) {
    //     if (_sx === 'total') {
    //         // add women and men
    //     } else {
    //         dataSets.population.data.forEach(function(dat, ind) {
    //             if (dat.sex === _sx) {
    //                 svg.selectAll('.reg' + dat.region)
    //                     .attr('fill', dataSets.population.colorScale.scale(dat[_yr]));
    //             }
    //         });
    //     }
    // },
    drawColor: function(_sx, _yr) {
        _yr = _yr == null ? app.year : _yr;
        _yr = _yr == null ? 2000 : _yr;
        // console.log('app year: ' + app.year);

        if (_sx === 'total') {
            // add women and men
        } else {
            dataSets.getActive().data.forEach(function(dat, ind) {
                if (dat.sex === _sx) {
                    svg.selectAll('.reg' + dat.region)
                        .attr('fill', dataSets.getActive().colorScale.scale(dat[_yr]));
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
    data: {
        male: [],
        female: [],
        total: []
    },
    year: 1969,
    height: 200,
    width: 600,
    x: null,
    y: null,
    xAxis: null,
    yAxis: null,
    title: '',
    init: function() { // TODO
        var slider_domain = [dataSets.getActive().minYear, dataSets.getActive().maxYear];
        var slider_values = [dataSets.getActive().maxValue, dataSets.getActive().minValue];
        slider.x = d3.scale.linear().domain(slider_domain).range([0, slider.width]).nice();
        slider.y = d3.scale.linear().domain(slider_values).range([0, slider.height]).nice();
        slider.obj.attr('transform', 'translate(' + slider.anchor[0] + ',' + slider.anchor[1] + ')');
        slider.fetchData(dataSets.getActive());
        slider.drawAxis(dataSets.getActive());
        slider.obj.append('rect')
            .attr('width', slider.width)
            .attr('height', slider.height)
            .style('opacity', 0)
            // .style('fill','red')
            .on('mouseenter', slider.eventHandler.enter)
            .on('mouseleave', slider.eventHandler.leave)
            .on('mousemove', slider.eventHandler.move)
            .on('click', slider.eventHandler.click);
        slider.line.show(slider.data.total, "sliderpath3");
        slider.line.show(slider.data.male, "sliderpath1");
        slider.line.show(slider.data.female, "sliderpath2");
    },
    fetchData: function(set) {
        for (i = set.minYear; i <= set.maxYear; i++) {
            slider.data.male.push({ year: i, value: dataSets.queryCountry(set, i, app.genders.male) });
            slider.data.female.push({ year: i, value: dataSets.queryCountry(set, i, app.genders.female) });
            slider.data.total.push({ year: i, value: dataSets.queryCountry(set, i, app.genders.total) });
        }
    },
    update: function() {},
    eventHandler: {
        mouseover: false,
        enter: function(_e) {
            slider.eventHandler.mouseover = true;
            slider.reticle.show();
        },
        leave: function(_e) {
            // console.log('LEAVE');
            slider.eventHandler.mouseover = false;
            slider.reticle.hide();
        },
        move: function(_e) {
            var _m = d3.mouse(this);
            slider.reticle.update(_m);
            // console.log(Math.round(slider.x.invert(_m[0])));
            app.update(Math.round(slider.x.invert(_m[0])), null);
        },
        click: function(_e) {
            var _m = d3.mouse(this);
            // console.log(_m);
            // console.log('CLICK year: ' + Math.round(slider.x.invert(_m[0])));
            // slider.setYear();
            app.setFocus(null, Math.round(slider.x.invert(_m[0])), null);
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
    drawAxis: function(set) {
        slider.xAxis = d3.svg
            .axis()
            .scale(slider.x)
            .orient("bottom")
            .tickFormat(d3.format('4d'));

        slider.yAxis = d3.svg
            .axis()
            .scale(slider.y)
            .orient("left")
            .ticks(6)
            .tickFormat(d3.format(".2s"));

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
            .attr('dy', -50)
            .style("text-anchor", "middle")
            .text(set.name);

        xLabel = slider.obj.append("text")
            .attr("transform", "translate(" + (slider.width / 2) + " ," + (slider.height + 40) + ")")
            .style("text-anchor", "middle")
            .text("year");
    },
    line: {
        line_utl: d3.svg.line()
            .x(function(d) { return slider.x(d.year); })
            .y(function(d) { return slider.y(d.value); })
            // .interpolate("monotone"),
            .interpolate("cardinal"),
        show: function(l, class_name) {
            slider.obj.append('path')
                .attr('class', class_name)
                .attr('d', slider.line.line_utl(l));
            // ;
        },
        hide: function(name) {},
        update: function(name) {}
    }
};

var info = {
    obj: svg.append('g').attr('class', 'info'),
    anchor: [600, 50],
    height: 200,
    width: 300,
    init: function() {
        info.obj.attr('transform', 'translate(' + info.anchor[0] + ',' + info.anchor[1] + ')');
        info.obj.append('rect')
            .attr('class', 'infobox')
            .attr('height', info.height)
            .attr('width', info.width);
        info.content.init();
        info.content.display();
    },
    update: function() {
        if (app.year != null)
            this.content.setLine(0, 'Year: ' + app.hover.year);
        else
            this.content.setLine(0, '');
        this.content.setLine(1, 'selected region: ' + dataSets.regionNames[app.focus.region]);
        this.content.setLine(2, 'hover region: ' + dataSets.regionNames[app.hover.region]);
        this.content.setLine(3, 'selected Year: ' + app.focus.year);
    },
    events: {
        // hover: dispatch.on('hover.info', function(_event) {
        //     // console.log(dataSets.regionNames[_event.region]);
        // })
    },
    content: {
        anchor: [20, 40],
        offsetToTopic: 30,
        offset: 30,
        linePadding: 10,
        numOfLines: 6,
        init: function() {
            info.obj
                .append('text')
                .attr('id', 'infotopic')
                .attr("transform", "translate(" + this.anchor[0] + " ," + this.anchor[1] + ")")
                .text('INFOBOX');
            for (i = 0; i < this.numOfLines; i++) {
                this.createLine(i);
            }
        },
        createLine: function(lineNumber) {
            var yPos = this.anchor[1] + this.offsetToTopic + this.linePadding / 2;
            var yOffset = (info.height - this.anchor[1] - this.offsetToTopic - this.linePadding) / this.numOfLines;
            // console.log('yPos: ' + yPos);
            // console.log('yOffset: ' + yOffset);
            info.obj
                .append('text')
                .attr('id', 'infoline' + lineNumber)
                .attr("transform", "translate(" + this.anchor[0] + " ," + (yPos + yOffset * lineNumber) + ")")
                .text('infoline' + lineNumber);
        },
        display: function() {
            this.setTopic('Sweden');

        },
        setTopic: function(topicText) {
            d3.select('#infotopic').text(topicText);
        },
        clearLines: function() {
            for (i = 0; i < this.numOfLines; i++) {
                this.setLine(i, '');
            }
        },
        setLine: function(line, lineText) {
            d3.select('#infoline' + line).text(lineText);
        }
    }
};

var tl = {
    currentYear: 1968,
    playState: false, // play/pause toggle
    previousFrameTime: 0,
    elapsedTime: 0,
    frameDuration: 200,
    init: function() {
        // console.log('tl.init called');
        tl.currentYear = 1969;
        tl.previousFrameTime = 0;
        tl.elapsedTime = 0;
    },
    clock: function(currentTime) {
        tl.elapsedTime = currentTime - tl.previousFrameTime;
        // console.log(tl.elapsedTime);
        if (tl.elapsedTime > tl.frameDuration) {
            tl.previousFrameTime = currentTime;
            tl.currentYear++;
            tl.currentYear = tl.currentYear < 2014 ? tl.currentYear : 1969;
            dispatch.timer(tl.currentYear);
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
        // console.log(tl.currentYear);
    }
};


app.main();