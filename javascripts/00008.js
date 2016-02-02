var width = 1000,
    height = 800;
var svg = d3.select("#sContainer").append("svg")
    .attr("width", width)
    .attr("height", height);
var projection = d3.geo.albers()
    .center([0, 55.4])
    .rotate([4.4, 0])
    .parallels([50, 60])
    .scale(135000)
    .translate([-24750, -3215]);
var path = d3.geo.path()
    .projection(projection);

tooltip = {
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

function getArea(_d) {
    try {
        return "</br> area: " + (parseFloat(_d.properties.FLAECHE_HA) / 100).toFixed(1) + "km<sup>2</sup>";
    } catch (err) {
        console.log("couldn\'t find area");
    }
    return '';
}

d3.json("../data/00008/berlin.json", function(error, map) {
    if (error) {
        return console.error(error);
    } else {
        var berlin = topojson.feature(map, map.objects.berlin_transformed);
        svg.selectAll('.berlin')
            .data(berlin.features)
            .enter()
            .append("path")
            .attr("class", function(d) {
                return "berlin " + d.id;
            })
            .attr("d", path);

        //define district boundaries    
        svg.append('path')
            .datum(topojson.mesh(map, map.objects.berlin_transformed, function(a, b) {
                return a.properties.BEZIRK !== b.properties.BEZIRK;
            }))
            .attr('d', path)
            .attr('class', 'district_boundary');

        //define subdistrict boundaries    
        svg.append('path')
            .datum(topojson.mesh(map, map.objects.berlin_transformed, function(a, b) {
                return a.properties.BEZIRK === b.properties.BEZIRK;
            }))
            .attr('d', path)
            .attr('class', 'subdistrict_boundary');

        // attach mouse events for tooltip
        svg.selectAll('.berlin')
            .on('mousemove', function(_e) {
                var m = d3.mouse(this);
                tooltip.updatePos(m[0], m[1]);
            })
            .on('mouseover', function(d) {
                tooltip.direction = d3.event.layerX < width / 2 ? 'right' :
                    'left';
                tooltip.show();
                tooltip.updateLabel(
                    'subdistrict: ' + d.id + '</br>' + 'district: ' + d.properties.BEZIRK + getArea(d));
            })
            .on('mouseleave', function(d) {
                tooltip.hide();
            });
    }
});
