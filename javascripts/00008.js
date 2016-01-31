// var width = 1000,
//     height = 800;
// d3.select("#sContainer")
//     .attr("width", width)
//     .attr("height", height);

// var svg = d3.select("#sContainer").append("svg")
//     .attr("width", width)
//     .attr("height", height);
// var projection = d3.geo.albers()
//     .center([0, 55.4])
//     .rotate([4.4, 0])
//     .parallels([50, 60])
//     .scale(135000)
//     .translate([-24750, -3215]);
// var path = d3.geo.path()
//     .projection(projection);

// d3.json("../mapdata/00008/berlin_build.json", function(error, map) {
//     if (error) {
//         return console.error(error);
//     } else {
//         svg.append("path")
//             .datum(topojson.feature(map, map.objects.berlin_transformed))
//             .attr("d", path);

//     }
// });

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

var tooltip = d3.select("#sContainer")
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 1);

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
                // console.log(a.properties.BEZIRK + " " + b.properties.BEZIRK);
                return a.properties.BEZIRK !== b.properties.BEZIRK;
            }))
            .attr('d', path)
            .attr('class', 'district_boundary');

        //define subdistrict boundaries    
        svg.append('path')
            .datum(topojson.mesh(map, map.objects.berlin_transformed, function(a, b) {
                // console.log(a.properties.BEZIRK + " " + b.properties.BEZIRK);
                return a.properties.BEZIRK === b.properties.BEZIRK;
            }))
            .attr('d', path)
            .attr('class', 'subdistrict_boundary');

        // attach mouse events for tooltip
        // svg.selectAll('.berlin')
        // .on('mouseover', function(d) {
        // console.log(d.id + ', ' + d3.event.pageX + ', ' + d3.event.pageY);
        // tooltip.transition()
        // .attr('opacity', 0.6);
        // tooltip.moveToFront();
        // tooltip
        // .style("left", (d3.event.pageX) + "px")
        // .style("top", (d3.event.pageY - 28) + "px")
        // .html(d.id + ',</br>' + d.properties.BEZIRK)
        // ;
        // });
    }
});
