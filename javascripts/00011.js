// jshint esnext:true
var width = 1000,
    height = 900;
var container = d3.select("#sContainer");
var svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);
const AUTOSTART = false;
var genderFlag;
var map, swe;

// from https://stackoverflow.com/questions/14167863/how-can-i-bring-a-circle-to-the-front-with-d3/14426477#14426477
d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
        this.parentNode.appendChild(this);
    });
};


var app = {
    mode: null,
    modes: {
        population: 'Population',
        growth: 'Population growth',
        population_sqkm: 'Population density',
        growth_sqkm: 'Population density growth'
    },
    genders: {
        male: "men",
        female: "women",
        total: "total"
    },
    gender: 2,
    unit: 'km²',
    main: function() {
        app.init();
    },
    init: function() {
        app.mode = app.modes.growth;
        app.focus.year = 2000;
        genderFlag = app.genders.total;
        dataSets.regionNames = {};
        var q = d3_queue.queue()
            .defer(loader.geoData)
            .defer(loader.populationData)
            .defer(loader.growthData)
            .defer(loader.areaData)
            .await(function(error) {
                if (error) {
                    throw error;
                } else {
                    dataSets.init();
                    sweMap.init();
                    hist.init();
                    pc.init();
                    slider.init();
                    legend.init()
                    info.init();
                    tl.init();
                    controls.init();
                    ml.init();
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
        this.update();
    },
    focusUpdate: function() {
        this.update();
    },
    update: function() {
        app.year = dataSets.confineYear(app.year);
        dataSets.update();
        sweMap.update();
        hist.update();
        pc.update();
        slider.update();
        info.update();
        tl.update();
        controls.update();
        ml.update();
    },

};


var dispatcher = {
    dispatch: d3.dispatch("hover", "unhover", "focus", "timer", "radio_change")
        .on('hover', function() {
            app.hoverUpdate();
        })
        .on('unhover', function() {
            app.hoverUpdate();
        })
        .on('focus', function() {
            app.focusUpdate();
        })
        .on('timer', function() {
            app.update();
        })
        .on('radio_change', function() {
            app.update();
        })
}


var loader = {
    geoData: function(_callback) {
        d3.json("../data/00011/swe.json", function(error, _map) {
            if (error) {
                return console.error(error);
            } else {
                map = _map;
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
                    for (y = dataSets.population.minYear; y <= dataSets.population.maxYear; y++) {
                        d[y] = +d[y];
                    }
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
                    for (y = dataSets.growth.minYear; y <= dataSets.growth.maxYear; y++) {
                        d[y] = +d[y];
                    }
                });
                if (_callback) {
                    _callback(null);
                }
            }
        });
    },
    areaData: function(_callback) {
        d3.csv('../data/00011/municipalities_area_2014.csv', function(err, res) {
            if (err) {
                throw (err);
            } else {
                dataSets.area = {};
                res.forEach(function(d, i) {
                    dataSets.area[parseInt(d.region)] = +d.area;
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
    area: null,
    population: {
        data: null,
        name: 'Population of Sweden',
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
    population_sqkm: {
        base: null,
        data: [],
        name: 'Population density of Sweden',
        affix: ' (per ' + app.unit + ')',
        minYear: 1968,
        maxYear: 2014,
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
    growth_sqkm: {
        base: null,
        data: [],
        name: 'Population density growth of Sweden',
        affix: ' (per ' + app.unit + ')',
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
    region_sqkm: {
        base: null,
        data: [],
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
        var base = (function(m) {
            switch (m) {
                case app.modes.population:
                    return dataSets.population;
                case app.modes.growth:
                    return dataSets.growth;
                case app.modes.population_sqkm:
                    return dataSets.population_sqkm;
                case app.modes.growth_sqkm:
                    return dataSets.growth_sqkm;
                default:
                    console.log('INVALID MODE');
                    return null
            }
        })(app.mode);
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
    setRegionYears: function() {
        switch (app.mode) {
            case app.modes.population:
                this.region.minYear = this.population.minYear;
                this.region.maxYear = this.population.maxYear;
                break;
            case app.modes.growth:
                this.region.minYear = this.growth.minYear;
                this.region.maxYear = this.growth.maxYear;
                break;
            case app.modes.population_sqkm:
                this.region.minYear = this.population_sqkm.minYear;
                this.region.maxYear = this.population_sqkm.maxYear;
                break;
            case app.modes.growth_sqkm:
                this.region.minYear = this.growth_sqkm.minYear;
                this.region.maxYear = this.growth_sqkm.maxYear;
                break;
            default:
                console.log('INVALID MODE');
                break;
        }
    },
    setBase: function() {
        this.population_sqkm.base = this.population;
        this.growth_sqkm.base = this.growth;
    },
    fill_per_sqkm: function(set) {
        set.minYear = set.base.minYear;
        set.maxYear = set.base.maxYear;

        set.base.data.forEach(function(d, i) {
            var newObj = {};
            newObj.region = d.region;
            newObj.sex = d.sex
            for (y = set.minYear; y <= set.maxYear; y++) {
                newObj[y] = d[y] / dataSets.area[d.region];
            }
            set.data.push(newObj);
        });
    },
    init: function() {
        this.setBase();
        this.fill_per_sqkm(this.population_sqkm);
        this.fill_per_sqkm(this.growth_sqkm);
        this.setColorScale(this.population);
        this.setColorScale(this.growth);
        this.setColorScale(this.population_sqkm);
        this.setColorScale(this.growth_sqkm);
        this.setValueRange(this.population);
        this.setValueRange(this.growth);
        this.setValueRange(this.population_sqkm);
        this.setValueRange(this.growth_sqkm);
    },
    update: function() {
        this.updateRegionObj();
    },
    setValueRange: function(dataset) {
        var min = null;
        var max = null;
        for (i = dataset.minYear; i <= dataset.maxYear; i++) {
            var yearTotal = 0;
            var yearMale = 0;
            var yearFemale = 0;
            dataset.data.forEach(function(dat, ind) {
                yearTotal += dat[i];
                if (dat.sex === app.genders.male)
                    yearMale += dat[i];
                if (dat.sex === app.genders.female)
                    yearFemale += dat[i];

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
    },
    setColorScale: function(set) {
        var percentile_array = [];
        set.data.forEach(function(d, i) {
            for (var y = set.minYear; y <= set.maxYear; y++) {
                if (d.sex === app.genders.male) {
                    percentile_array.push(d[y] + set.data[i + 1][y]);
                }
            }
        });
        percentile_array.sort(function(a, b) {
            return a - b;
        });
        set.percentiles = [];
        for (p = 0; p <= 1; p = p + 0.1) {
            set.percentiles.push(percentile_array[Math.floor(p * percentile_array.length)]);
        }
        //thanks to http://colorbrewer2.org/
        var range = colorbrewer.Spectral[set.percentiles.length];
        var domain = set.percentiles;
        set.colorScale.scale = d3.scale.linear().domain(domain).range(range).interpolate(d3.interpolateHcl);
    },
    getActive: function() {
        if (!app.focus.region && !app.hover.region) {
            switch (app.mode) {
                case app.modes.population:
                    return dataSets.population;
                case app.modes.growth:
                    return dataSets.growth;
                case app.modes.population_sqkm:
                    return dataSets.population_sqkm;
                case app.modes.growth_sqkm:
                    return dataSets.growth_sqkm;
                default:
                    console.log('INVALID MODE');
                    return null;
            }
        } else {
            this.setRegionYears();
            return this.region;
        }
    },
    getActiveMap: function() {
        switch (app.mode) {
            case app.modes.population:
                return dataSets.population;
            case app.modes.growth:
                return dataSets.growth;
            case app.modes.population_sqkm:
                return dataSets.population_sqkm;
            case app.modes.growth_sqkm:
                return dataSets.growth_sqkm;
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
                result += d[year];
            });
        } else {
            // specific gender
            set.data.forEach(function(d, i) {
                if (d.sex === gender)
                    result += d[year];
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
                    result += d[year];
            });
        } else {
            // specific gender
            set.data.forEach(function(d, i) {
                if (d.sex === gender && d.region === region)
                    result += d[year];
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
    tileSelected: false,
    init: function() {
        sweMap.projection = d3.geo.albers()
            .center([0, 55.4])
            .rotate([4.4, 0])
            .parallels([50, 60])
            .scale(3300)
            .translate([-420, 880]);
        sweMap.path = d3.geo.path().projection(sweMap.projection);
        sweMap.renderMap();
        sweMap.drawBorders();
        sweMap.drawColor(genderFlag, app.focus.year);
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
            .attr("d", sweMap.path);
        svg.selectAll('.swe')
            .on('click', function(_event) {
                var selReg = parseInt(_event.id);
                if (selReg === sweMap.tileSelected) {
                    sweMap.tileSelected = false;
                    sweMap.removeBorderMarked();
                    app.focus.region = null;
                    dispatcher.dispatch.focus();
                } else {
                    sweMap.tileSelected = selReg;
                    sweMap.removeBorderMarked();
                    sweMap.drawBorderMarked(selReg);
                    app.focus.region = parseInt(_event.id);
                    dispatcher.dispatch.focus();
                }
            })
            .on('mouseenter', function(_event) {
                if (parseInt(_event.id) !== sweMap.tileSelected) {
                    sweMap.drawBorderHover(parseInt(_event.id)); //change this to execute later in the event chain?
                    app.setHover(null, null, parseInt(_event.id));
                    dispatcher.dispatch.hover(); //ISSUE HERE
                }
            })
            .on('mouseleave', function(_event) {
                sweMap.removeBorderHover();
                app.hover.region = null;
                dispatcher.dispatch.unhover();
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
    drawColor: function(_sx, _yr) {
        if (_sx === app.genders.total) {
            dataSets.getActiveMap().data.forEach(function(dat, ind) {
                if (dat.sex === app.genders.male) {
                    svg.selectAll('.reg' + dat.region)
                        .transition()
                        .attr('fill', dataSets.getActiveMap().colorScale.scale(dat[_yr] +
                            dataSets.getActiveMap().data[ind + 1][_yr]));
                }
            });
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
    init: function() {},
    update: function() {}
};

var pc = {
    init: function() {},
    update: function() {}
};

var ml = {
    obj: null,
    anchor: [270, 20],
    height: 300,
    width: 20,
    lineheight: 30,
    lineoffset: 0,
    numOfLines: 8,
    padding: 10,
    label_offset: 65,
    init: function() {
        var scale = dataSets.getActiveMap().colorScale.scale();
        var colorScale = d3.scale.linear()
            .range(colorbrewer.Spectral[dataSets.getActiveMap().percentiles.length]).nice();
        ml.obj = svg.append('g').attr('id', 'maplegend').attr('transform', 'translate(' + ml.anchor[0] + ',' + ml.anchor[1] + ')');
        var defs = ml.obj.append('defs');
        var gradient = defs.append('linearGradient')
            .attr('id', 'gradient');
        gradient
            .attr("x1", "0%")
            .attr("y1", "100%")
            .attr("x2", "0%")
            .attr("y2", "0%");
        gradient.selectAll("stop")
            .data(colorScale.range())
            .enter().append("stop")
            .attr("offset", function(d, i) { return i / (colorScale.range().length - 1); })
            .attr("stop-color", function(d) { return d; });
        ml.obj.append('rect')
            .attr('class', 'maplegendbox')
            .attr('height', ml.height)
            .attr('width', ml.width)
            .style("fill", "url(#gradient)");
        var domain = dataSets.getActiveMap().percentiles;
        var range = [];
        var delta = ml.height / (dataSets.getActiveMap().percentiles.length - 1);
        for (var i = 0; i < dataSets.getActiveMap().percentiles.length; i++) {
            range.push(ml.height - i * delta);
        }
        var axis_scale = d3.scale.linear().domain(domain).range(range);
        var color_axis = d3.svg
            .axis()
            .scale(axis_scale)
            .orient("right")
            .tickValues(domain)
            .tickFormat(d3.format(".2s"));
        ml.obj.append('g')
            .attr("class", "color_axis")
            .attr('transform', 'translate(' + (ml.width) + ',' + 0 + ')')
            .call(color_axis);
        var color_axis_label = ml.obj.append("text")
            .attr('class', 'color_axis_label')
            .attr("transform", "rotate(-90)")
            .attr("dx", -ml.height / 2)
            .attr('dy', +ml.width + ml.label_offset)
            .style("text-anchor", "middle")
            .text(dataSets.getActiveMap().name + (dataSets.getActiveMap().affix == null ? '' : dataSets.getActiveMap().affix));
    },
    update: function() {
        var domain = dataSets.getActiveMap().percentiles;
        var range = [];
        var delta = ml.height / (dataSets.getActiveMap().percentiles.length - 1);
        for (var i = 0; i < dataSets.getActiveMap().percentiles.length; i++) {
            range.push(ml.height - i * delta);
        }
        var axis_scale = d3.scale.linear().domain(domain).range(range);
        var color_axis = d3.svg
            .axis()
            .scale(axis_scale)
            .orient("right")
            .tickValues(domain)
            .tickFormat(d3.format(".2s"));
        d3.select('.color_axis')
            .transition()
            .call(color_axis);
        d3.select('.color_axis_label')
            .text(dataSets.getActiveMap().name + (dataSets.getActiveMap().affix == null ? '' : dataSets.getActiveMap().affix));
    }
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
        // this.legend.init();
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
            dispatcher.dispatch.focus();
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
            .attr("class", "xAxis")
            .attr('transform', 'translate(' + 0 + ',' + slider.height + ')')
            .call(slider.xAxis);

        slider.obj.append("g")
            .attr("class", "yAxis")
            .attr('transform', 'translate(' + 0 + ',' + 0 + ')')
            .call(slider.yAxis);

        yLabel = slider.obj.append("text")
            .attr('class', 'yAxisLabel')
            .attr("transform", "rotate(-90)")
            .attr("dx", -slider.height / 2)
            .attr('dy', -50)
            .style("text-anchor", "middle")
            .text(set.name + (set.affix == null ? '' : set.affix));

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
            .text(dataSets.getActive().name + (dataSets.getActive().affix == null ? '' : dataSets.getActive().affix));
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

var legend = {
    obj: null,
    anchor: [10, 0],
    offset: [5, 3],
    boxheight: 15,
    boxwidth: 15,
    textoffset: -2,
    init: function() {
        this.anchor[0] += slider.anchor[0];
        this.anchor[1] += slider.anchor[1];
        this.obj = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(' + this.anchor[0] + ',' + this.anchor[1] + ')');
        this.obj.append('rect')
            .attr('id', 'legend_' + app.genders.total)
            .attr('width', this.boxwidth)
            .attr('height', this.boxheight)
            .attr('x', 0)
            .attr('y', 0);
        this.obj.append('rect')
            .attr('id', 'legend_' + app.genders.female)
            .attr('width', this.boxwidth)
            .attr('height', this.boxheight)
            .attr('x', 0)
            .attr('y', 1 * (this.offset[1] + this.boxheight));
        this.obj.append('rect')
            .attr('id', 'legend_' + app.genders.male)
            .attr('width', this.boxwidth)
            .attr('height', this.boxheight)
            .attr('x', 0)
            .attr('y', 2 * (this.offset[1] + this.boxheight));
        this.obj.append('text')
            .attr("transform", "translate(" + (this.boxwidth + this.offset[0]) + " ," + (1 * this.boxheight + this.textoffset) + ")")
            .text(app.genders.total);
        this.obj.append('text')
            .attr("transform", "translate(" + (this.boxwidth + this.offset[0]) + " ," + (1 * this.offset[1] + 2 * this.boxheight + this.textoffset) + ")")
            .text(app.genders.female);
        this.obj.append('text')
            .attr("transform", "translate(" + (this.boxwidth + this.offset[0]) + " ," + (2 * this.offset[1] + 3 * this.boxheight + this.textoffset) + ")")
            .text(app.genders.male);
    },
    show: function() {},
    hide: function() {},
    update: function() {}
}

var controls = {
    anchor: [],
    offset: [15, 15],
    height: 50,
    width: 300,
    obj: null,
    fields: [app.modes.population, app.modes.growth, app.modes.population_sqkm, app.modes.growth_sqkm],
    init: function() {
        controls.anchor[0] = info.anchor[0] + controls.offset[0];
        controls.anchor[1] = info.anchor[1] + info.height + controls.offset[1];
        controls.obj = container.append('form')
            .attr('class', 'controlpanel')
            .style('left', controls.anchor[0] + 'px')
            .style('top', controls.anchor[1] + 'px')
            .style('height', controls.height + 'px')
            .style('width', controls.width + 'px');

        controls.obj.append('div').attr('class', 'fline1')
            .append('input')
            .attr('type', 'radio')
            .attr('name', 'set')
            .attr('value', app.modes.population)
            .property('checked', app.mode == app.modes.population)
            .on('change', this.onChangeHandler);
        d3.select('.fline1')
            .append('label')
            .text(controls.fields[0]);

        controls.obj.append('div').attr('class', 'fline2')
            .append('input')
            .attr('type', 'radio')
            .attr('name', 'set')
            .attr('value', app.modes.growth)
            .property('checked', app.mode == app.modes.growth)
            .on('change', this.onChangeHandler);
        d3.select('.fline2')
            .append('label')
            .text(controls.fields[1]);

        controls.obj.append('div').attr('class', 'fline3')
            .append('input')
            .attr('type', 'radio')
            .attr('name', 'set')
            .attr('value', app.modes.population_sqkm)
            .property('checked', app.mode == app.modes.population_sqkm)
            .on('change', this.onChangeHandler);
        d3.select('.fline3')
            .append('label')
            .text(controls.fields[2]);

        controls.obj.append('div').attr('class', 'fline4')
            .append('input')
            .attr('type', 'radio')
            .attr('name', 'set')
            .attr('value', app.modes.growth_sqkm)
            .property('checked', app.mode == app.modes.growth_sqkm)
            .on('change', this.onChangeHandler);
        d3.select('.fline4')
            .append('label')
            .text(controls.fields[3]);
    },
    show: function() {},
    hide: function() {},
    update: function() {},
    onChangeHandler: function() {
        app.mode = this.value;
        app.focus.year = app.focus.year < dataSets.getActive().minYear ? dataSets.getActive().minYear : app.focus.year;
        dispatcher.dispatch.radio_change();
    }
}

var info = {
    obj: null,
    anchor: [550, 50],
    height: 300,
    width: 350,
    init: function() {
        info.obj = svg.append('g')
            .attr('class', 'info')
        info.obj.attr('transform', 'translate(' + info.anchor[0] + ',' + info.anchor[1] + ')');
        info.obj.append('rect')
            .attr('class', 'infobox')
            .attr('height', info.height)
            .attr('width', info.width);
        info.content.init();
        info.content.display();
        info.update();
    },
    update: function() {
        this.content.setTopic(dataSets.getActive().name);
        this.content.setLine(0, 'year: ' + app.focus.year);
        this.content.setLine(1, 'population total: ' + this.format(dataSets.query(dataSets.population, app.focus.year, app.genders.total)));
        this.content.setLine(2, 'population female: ' + this.format(dataSets.query(dataSets.population, app.focus.year, app.genders.female)));
        this.content.setLine(3, 'population male: ' + this.format(dataSets.query(dataSets.population, app.focus.year, app.genders.male)));
        this.content.setLine(4, 'population growth total: ' + this.format(dataSets.query(dataSets.growth, app.focus.year, app.genders.total)));
        this.content.setLine(5, 'population growth female: ' + this.format(dataSets.query(dataSets.growth, app.focus.year, app.genders.female)));
        this.content.setLine(6, 'population growth male: ' + this.format(dataSets.query(dataSets.growth, app.focus.year, app.genders.male)));
    },
    format: function(n) {
        n = this.checkNaN(n);
        if (n >= 10000) {
            return d3.format(".3s")(n)
        }
        return n;
    },
    checkNaN: function(n) {
        if (isNaN(n))
            return 'not available';
        return n;
    },
    events: {},
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
    playState: AUTOSTART, // play/pause toggle
    previousFrameTime: 0,
    elapsedTime: 0,
    frameDuration: 250,
    init: function() {
        tl.previousFrameTime = 0;
        tl.elapsedTime = 0;
        tl.button.init();
        d3.timer(tl.clock);
    },
    clock: function(currentTime) {
        if (tl.playState) {
            tl.elapsedTime = currentTime - tl.previousFrameTime;
            if (tl.elapsedTime > tl.frameDuration) {
                tl.previousFrameTime = currentTime;
                app.focus.year = app.focus.year + 1 > dataSets.getActive().maxYear ? dataSets.getActive().minYear : app.focus.year + 1;
                dispatcher.dispatch.timer();
            }
        }
        return (false);
    },
    start: function() {
        tl.playState = true;
    },
    stop: function() {
        tl.playState = false;
    },
    update: function() {
        this.button.update();
    },
    button: {
        anchor: [800, 540],
        height: 50,
        width: 80,
        id: 'playpausebutton',
        text: {
            play: 'PLAY',
            pause: 'PAUSE'
        },
        init: function() {
            tl.button.anchor[0] = slider.anchor[0] + slider.width - tl.button.width;
            tl.button.anchor[1] = slider.anchor[1] - tl.button.height;
            tl.button.show();
        },
        show: function() {
            container
                .append('button')
                .attr('id', 'pbutton')
                .style('left', tl.button.anchor[0] + 'px')
                .style('top', tl.button.anchor[1] + 'px')
                .style('height', tl.button.height + 'px')
                .style('width', tl.button.width + 'px')
                .on('click', this.onClickHandler);
            tl.button.update();
        },
        update: function() {
            d3.select('#pbutton').text(tl.playState ? tl.button.text.pause : tl.button.text.play);
        },
        hide: function() {},
        onClickHandler: function(e) {
            tl.playState = !tl.playState;
            tl.button.update();
        }
    }
};


app.main();