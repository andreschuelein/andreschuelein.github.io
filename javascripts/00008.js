var width = 1000,
    height = 800;
d3.select("#sContainer")
    .attr("width", width)
    .attr("height", height);

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

d3.json("../mapdata/00008/berlin_build.json", function(error, map) {
    if (error) {
        return console.error(error);
    } else {
        svg.append("path")
            .datum(topojson.feature(map, map.objects.berlin_transformed))
            .attr("d", path);

    }
});
