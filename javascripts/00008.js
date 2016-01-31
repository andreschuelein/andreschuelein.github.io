var width = 1000,
    height = 800;
d3.select("#sContainer")
    .attr("width", width)
    .attr("height", height);

d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
        this.parentNode.appendChild(this);
    });
};

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
    obj: d3.select("#sContainer")
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .on('mouseover', (function(event) {
            d3.event.preventDefault();
        })),
    updatePos: function(_x, _y) {
        tooltip.obj
            .style('left', (_x + 15) + 'px')
            .style("top", (_y - 30) + "px");
    },
    updateLabel: function(_subdistrict, _district) {
        tooltip.obj
            .html(_subdistrict + ',</br>' + _district);
    }
};

d3.json("../mapdata/00008/berlin_build_by_OTEIL.json", function(error, map) {
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
                tooltip.obj
                    .transition()
                    .style('opacity', 1);

                tooltip.updateLabel(d.id, d.properties.BEZIRK);
            })
            .on('mouseleave', function(d) {
                tooltip.obj
                    .transition()
                    .style('opacity', 0);
            });
    }
});
