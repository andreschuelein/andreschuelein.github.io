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
    // year: null,
    mode: null,
    modes: {
        population: 'Population',
        growth: 'Population growth'
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
        // app.year = 2000;
        app.focus.year = 2000;
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
                    sweMap.drawColor(genderFlag, app.focus.year);
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
    // update: function(_year, _dataSet) {
    update: function() {
        //  var _year = _year == null ? app.year : _year;
        // if (!(_year === app.year && _dataSet === app.mode)) {
        //     _year = _year < 1969 ? 1969 : _year;
        //     _year = _year > 2014 ? 2014 : _year;
        app.year = dataSets.confineYear(app.year);
        dataSets.update();
        sweMap.update();
        hist.update();
        pc.update();
        slider.update();
        info.update();
        tl.update();

    },

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
        name: 'Population  of Sweden',
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
        name: 'Population growth of Sweden',
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
    region: {
        data: null,
        name: null,
        minYear: null,
        maxYear: null,
        minValue: null,
        maxValue: null,
        colorScale: {
            COLS: null,
            DOMAIN: null,
            scale: null
        }
    },
    updateRegionObj: function() {
        var regionId = '';
        if (app.focus.region)
            regionId = app.focus.region;
        else
            regionId = app.hover.region;
        var obj = this.region;
        var regionName = dataSets.regionNames[regionId];
        obj.name = app.mode + ' of ' + regionName;
        var base = app.mode == app.modes.population ? this.population : this.growth;
        obj.minYear = base.minYear;
        obj.maxYear = base.maxYear;
        obj.colorScale = base.colorScale;
        this.fetchRegionData(base, regionId);
        this.setValueRange(this.region);
    },
    fetchRegionData: function(base, id) {
        dataSets.region.data = [];
        base.data.forEach(function(d, i) {
            if (d.region === id)
                dataSets.region.data.push(d);
        });
    },
    init: function() {
        this.population.colorScale.scale = d3.scale.linear().domain(dataSets.population.colorScale.DOMAIN).range(dataSets.population.colorScale.COLS);
        this.growth.colorScale.scale = d3.scale.linear().domain(dataSets.growth.colorScale.DOMAIN).range(dataSets.growth.colorScale.COLS);
        this.setValueRange(this.population);
        this.setValueRange(this.growth);
    },
    update: function() {
        this.updateRegionObj();
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

    getActive: function() {
        if (!app.focus.region && !app.hover.region) {
            switch (app.mode) {
                case app.modes.population:
                    return dataSets.population;
                case app.modes.growth:
                    return dataSets.growth;
                default:
                    console.log('INVALID MODE');
                    return null;
            }
        } else {
            return this.region;
        }
    },
    getActiveMap: function() {

        switch (app.mode) {
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
    query: function(set, year, gender) {
        if (!app.focus.region && !app.hover.region)
            return this.queryCountry(set, year, gender)
        else
            return this.queryRegion(set, year, gender, !app.focus.region ? app.hover.region : app.focus.region);
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
    },
    confineYear: function(year) {
        year = year < this.getActive().minYear ? this.getActive().minYear : year;
        year = year > this.getActive().maxYear ? this.getActive().maxYear : year;
        return year;
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
    update: function() {

        sweMap.drawColor(genderFlag, app.focus.year);
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
                    // dispatch.focus({ region: null, gender: app.focus.gender, year: app.focus.year });
                    app.focus.region = null;
                    dispatch.focus();
                } else {
                    // focus
                    // app.focus.region = parseInt(_event.id);
                    sweMap.tileSelected = selReg;
                    sweMap.removeBorderMarked();
                    sweMap.drawBorderMarked(selReg);
                    // dispatch.focus({ region: parseInt(_event.id), gender: app.focus.gender, year: app.focus.year });
                    app.focus.region = parseInt(_event.id);
                    dispatch.focus();
                }
            })
            .on('mouseenter', function(_event) {
                if (parseInt(_event.id) !== sweMap.tileSelected) {
                    // app.hover = { region: parseInt(_event.id), gender: null, year: null };
                    // console.log('app.year before: ' + app.year);
                    // 
                    sweMap.drawBorderHover(parseInt(_event.id)); //change this to execute later in the event chain?
                    app.setHover(null, null, parseInt(_event.id));
                    dispatch.hover(); //ISSUE HERE
                    // console.log('app.year after: ' + app.year);
                }
            })
            .on('mouseleave', function(_event) {
                // app.hover = { region: null, gender: null, year: null };
                sweMap.removeBorderHover();
                // dispatch.unhover({ region: null, gender: null, year: null });
                app.hover.region = null;
                dispatch.unhover();
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
            dataSets.getActiveMap().data.forEach(function(dat, ind) {
                if (dat.sex === _sx) {
                    svg.selectAll('.reg' + dat.region)
                        .transition()
                        .attr('fill', dataSets.getActiveMap().colorScale.scale(dat[_yr]));
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
    anchor: [370, 610],
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
        this.setScales();
        slider.obj.attr('transform', 'translate(' + slider.anchor[0] + ',' + slider.anchor[1] + ')');
        slider.drawAxis(dataSets.getActive());
        slider.obj.append('rect')
            .attr('width', slider.width)
            .attr('height', slider.height)
            .style('opacity', 0)
            .on('mouseenter', slider.eventHandler.enter)
            .on('mouseleave', slider.eventHandler.leave)
            .on('mousemove', slider.eventHandler.move)
            .on('click', slider.eventHandler.click);
        slider.fetchData(dataSets.getActive());
        slider.line.show(slider.data.male, "sliderpath1");
        slider.line.show(slider.data.female, "sliderpath2");
        slider.line.show(slider.data.total, "sliderpath3");
        this.timeMarker.show();
    },
    setScales: function() {
        var slider_domain = [dataSets.getActive().minYear, dataSets.getActive().maxYear];
        var slider_values = [dataSets.getActive().maxValue, dataSets.getActive().minValue];
        slider.x = d3.scale.linear().domain(slider_domain).range([0, slider.width]).nice();
        slider.y = d3.scale.linear().domain(slider_values).range([0, slider.height]).nice();
    },
    fetchData: function(set) {
        slider.data.female = [];
        slider.data.male = [];
        slider.data.total = [];
        for (i = set.minYear; i <= set.maxYear; i++) {
            slider.data.male.push({ year: i, value: dataSets.query(set, i, app.genders.male) });
            slider.data.female.push({ year: i, value: dataSets.query(set, i, app.genders.female) });
            slider.data.total.push({ year: i, value: dataSets.query(set, i, app.genders.total) });
        }
    },
    update: function() {
        this.updateScales();
        this.updateAxis();
        this.timeMarker.update();
        slider.fetchData(dataSets.getActive());
        slider.line.update(slider.data.male, "sliderpath1");
        slider.line.update(slider.data.female, "sliderpath2");
        slider.line.update(slider.data.total, "sliderpath3");
    },
    updateScales: function() {
        this.setScales();
    },
    eventHandler: {
        mouseover: false,
        enter: function(_e) {
            slider.eventHandler.mouseover = true;
            slider.reticle.show();
        },
        leave: function(_e) {
            slider.eventHandler.mouseover = false;
            slider.reticle.hide();
            app.hover.year = null;
        },
        move: function(_e) {
            var _m = d3.mouse(this);
            slider.reticle.update(_m);
            app.hover.year = dataSets.confineYear(Math.round(slider.x.invert(_m[0])));
        },
        click: function(_e) {
            var _m = d3.mouse(this);
            // console.log(_m);
            // console.log('CLICK year: ' + Math.round(slider.x.invert(_m[0])));
            // slider.setYear();
            // app.setFocus(null, dataSets.confineYear(Math.round(slider.x.invert(_m[0]))), null);
            app.focus.year = dataSets.confineYear(Math.round(slider.x.invert(_m[0])));
            dispatch.focus();
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
    timeMarker: {
        show: function() {
            var xPos = slider.x(app.focus.year);
            slider.obj.append('line')
                .attr('class', 'slidertimemarker')
                .attr('x1', xPos)
                .attr('y1', slider.height)
                .attr('x2', xPos)
                .attr('y2', 0);
            // console.log('marker drawn at:' + xPos + ' year: ' + app.focus.year);

        },
        hide: function() {},
        update: function() {
            var xPos = slider.x(app.focus.year);
            d3.selectAll('.slidertimemarker')
                .transition()
                .attr('x1', xPos)
                .attr('x2', xPos);
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
            // .attr("class", "axis")
            .attr("class", "xAxis")
            .attr('transform', 'translate(' + 0 + ',' + slider.height + ')')
            .call(slider.xAxis);

        slider.obj.append("g")
            // .attr("class", "axis")
            .attr("class", "yAxis")
            .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
            .call(slider.yAxis);

        yLabel = slider.obj.append("text")
            .attr('class', 'yAxisLabel')
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
    updateAxis: function() {
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

        d3.select('.xAxis')
            .transition()
            .call(slider.xAxis);

        d3.select('.yAxis')
            .transition()
            .call(slider.yAxis);

        d3.select('.yAxisLabel')
            .text(dataSets.getActive().name);
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
        },
        hide: function(name) {},
        update: function(l, name) {
            d3.select('.' + name)
                .transition()
                .attr('d', slider.line.line_utl(l));
        }
    }
};

var info = {
    obj: svg.append('g').attr('class', 'info'),
    anchor: [550, 50],
    height: 300,
    width: 350,
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
        // var base = dataSets.getActive();
        this.content.setTopic(dataSets.getActive().name);
        this.content.setLine(0, 'year: ' + app.focus.year);
        // var populationSet = null;
        // var growthSet = null;
        // if (!app.focus.region && !app.hover.region) {
        //     // swe
        //     populationSet = dataSets.population;
        //     growthSet = dataSets.growth;
        // } else {
        //     // region
        //     var regId = 
        //     populationSet = dataSets.fetchRegionData
        // }

        this.content.setLine(1, 'population total: ' + this.format(dataSets.query(dataSets.population, app.focus.year, app.genders.total)));
        this.content.setLine(2, 'population female: ' + this.format(dataSets.query(dataSets.population, app.focus.year, app.genders.female)));
        this.content.setLine(3, 'population male: ' + this.format(dataSets.query(dataSets.population, app.focus.year, app.genders.male)));
        this.content.setLine(4, 'population growth total: ' + this.format(dataSets.query(dataSets.growth, app.focus.year, app.genders.total)));
        this.content.setLine(5, 'population growth female: ' + this.format(dataSets.query(dataSets.growth, app.focus.year, app.genders.female)));
        this.content.setLine(6, 'population growth male: ' + this.format(dataSets.query(dataSets.growth, app.focus.year, app.genders.male)));
    },
    format: function(n) {
        if (n >= 10000) {
            return d3.format(".3s")(n)
        }
        return n;
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
        numOfLines: 7,
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
            this.setTopic(dataSets.getActive().name);

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
    playState: false, // play/pause toggle
    previousFrameTime: 0,
    elapsedTime: 0,
    frameDuration: 250,
    init: function() {
        tl.previousFrameTime = 0;
        tl.elapsedTime = 0;
        tl.button.show();
    },
    clock: function(currentTime) {
        tl.elapsedTime = currentTime - tl.previousFrameTime;
        if (tl.elapsedTime > tl.frameDuration) {
            tl.previousFrameTime = currentTime;
            app.focus.year = app.focus.year + 1 > dataSets.getActive().maxYear ? dataSets.getActive().minYear : app.focus.year + 1;
            dispatch.timer();
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
        this.button.update();
    },
    button: {
        anchor: [200, -200],
        height: 100,
        width: 100,
        id: 'playpausebutton',
        text: 'PLAY/PAUSE',
        spawnContainer: function() {

            d3.select("#sContainer")
                .append('div')
                .attr('class', 'controls')
                .attr('x', 500)
                .attr('top', -200)
                .style('width', 111 + 'px')
                .style('height', 111 + 'px')
        },
        show: function() {
            // this.spawnContainer();
            // d3.select(".controls")
            //     .append('div')
            // d3.select("#sContainer")
            svg
                .append('button')
                .attr('id', 'pbutton')
                // .attr('body', 'press me')
                .attr('left', 10)
                .attr('top', -150)
                .attr("float", "right")
                .style('height', 50 + 'px')
                .style('width', 150 + 'px')
                .on('click', this.onClickHandler);
            console.log('button created');

        },
        update: function() {},
        hide: function() {},
        onClickHandler: function(e) {
            console.log('button clicked');

        }
    }

};


app.main();