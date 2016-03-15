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
const COL1 = "#B4B4B4";
// const COLS = ['#2b83ba', '#abdda4', '#ffffbf', '#fdae61', '#d7191c']; // thanks to http://colorbrewer2.org/
// var colScale1 = d3.scale.linear().domain([0, 10000, 20000, 30000, 40000]).range(COLS);

const COLS1 = ['#ffffb2','#fed976','#feb24c','#fd8d3c','#fc4e2a','#e31a1c','#b10026'];
const DOMAIN1=[1000, 5000, 10000, 20000, 30000,40000,50000];
var colScale1 = d3.scale.linear().domain().range(COLS1); // for population
var year;
var sexSelector;
var populationData;
var map, swe;

var tooltip = {
    direction: 'right',
    obj: d3.select("#sContainer")
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .on('mouseover', (function(event) {
            d3.event.preventDefault();
        })),
    updatePos: function(_x, _y) {
        var r = tooltip.obj.node().getBoundingClientRect();
        var xOffset = tooltip.direction === 'right' ? 30 : -r.width;
        var yOffset = -r.height - 10;
        tooltip.obj
            .style('left', (_x + xOffset) + 'px')
            .style("top", (_y + yOffset) + "px");
    },
    updateLabel: function(_html_text) {
        tooltip.obj
            .html(_html_text);
    },
    show: function(_opacity) {
        tooltip.obj.transition().duration(150).style('opacity', _opacity ? _opacity : 1);
    },
    hide: function() {
        tooltip.obj.transition().style('opacity', 0);
    },
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
            renderMap();

        }
    });
    _callback(null);
}

function renderMap() {
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

    //define district boundaries    
    svg.append('path')
        .datum(topojson.mesh(map, map.objects.swe_epgs4326, function(a, b) {
            return true;
        }))
        .attr('d', path)
        .attr('class', 'boundary');

    // loadPopulation(
    //     function() {
    //         colorPop(sexSelector, year);
    //     });

    // attach mouse events for tooltip
    svg.selectAll('.swe')
        .on('mousemove', function(_e) {
            var m = d3.mouse(this);
            tooltip.updatePos(m[0], m[1]);
        })
        .on('mouseover', function(d) {
            tooltip.direction = d3.event.layerX < width / 2 ? 'right' :
                'left';
            tooltip.show();
            // console.log(d.id + " " + d.properties.KnNamn + " " + (queryPop(parseInt(d.id), 'women', year) + queryPop(parseInt(d.id), 'men', year)));
            //         tooltip.updateLabel(
            //             'subdistrict: ' + d.id + '</br>' + 'district: ' + d.properties.BEZIRK + getArea(d));
        })
        .on('mouseleave', function(d) {
            tooltip.hide();
        });
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


function queryPop(reg, sx, yr) {
    var found = null;
    if (populationData !== null) {
        populationData.some(function(dat, ind) {
            if (dat.region === reg && dat.sex === sx) {
                found = ind;
                return dat[yr];
            }
        });
        return found !== null ? parseInt(populationData[found][yr]) : 'data point unavailable';
    } else {
        return 'no population data found';
    }
}

function colorPop(sx, yr) {
    if (sx === 'total') {
        // add women and men
    } else {
        populationData.forEach(function(dat, ind) {
            if (dat.sex === sx) {
                svg.selectAll('.reg' + dat.region)
                    .attr('fill', colScale1(dat[yr]));
            }
        });
    }
}


function showLoadingSplash(_callback) {
    svg.append("circle")
        .attr('id', 'loading')
        .attr("cx", 100)
        .attr("cy", 100)
        .attr("r", 50)
        .attr("fill", "red");
    _callback(null);
}



function backgroundLoading() {
    q = d3_queue.queue()
        .defer(loadGeoData)
        .defer(loadPopulationData)

    .await(function(error) {
        if (error) {
            throw error;
        } else {
            colorPop(sexSelector, year);
            tl.start();
        }
    });
}

var tl = {
    currentYear: 1968,
    playState: false, // play/pause toggle
    previousFrameTime: 0,
    elapsedTime: 0,
    frameDuration:50,
    init: function() {
        tl.currentYear= 1968;
        tl.previousFrameTime=0;
        tl.elapsedTime=0;
    },
    clock: function(currentTime) {
        tl.elapsedTime = currentTime - tl.previousFrameTime;
           console.log(tl.elapsedTime);
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
        if (tl.currentYear<2014){
            tl.currentYear++;
            console.log(tl.currentYear);
            colorPop(sexSelector,tl.currentYear);
        }else{
            tl.init();
        }
    }
};


function main() {

    init(backgroundLoading);

}

main();
