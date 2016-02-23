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
const COL1 = '#B4B4B4';
const COLS = ['#2b83ba', '#abdda4', '#ffffbf', '#fdae61', '#d7191c']; // thanks to http://colorbrewer2.org/
var colScale = d3.scale.linear().domain([0, 10000, 30000, 50000, 100000]).range(COLS);

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

var year = 2014;
var sexSelector = 'men';
d3.json("../data/00011/swe.json", function(error, map) {
    if (error) {
        return console.error(error);
    } else {
        var swe = topojson.feature(map, map.objects.swe_epgs4326);
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

        loadPopulation(
            function() {
                colorPop(sexSelector, year);
                //  console.log(queryPop(191, 'women', 2001));
            });





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
});

var populationData = null;

function loadPopulation(cb) {
    d3.csv('../data/00011/population.csv', function(err, res) {
        if (err) {
            throw (err);
        } else {
            populationData = res;
            populationData.forEach(function(d) {
                d.region = parseInt(d.region);
            });
            if (cb) {
                cb();
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
                // console.log(dat[yr]);
                svg //.selectAll('.swe')
                    .selectAll('.reg' + dat.region)
                    .attr('fill', colScale(dat[yr]));
            }
        });
    }
}
