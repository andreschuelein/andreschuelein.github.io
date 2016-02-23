// jshint esnext:true
const data = ["00011","00010", "00008", "00009", "00005", "00007", "00004", "00006"];
var stateMouseOver = false;
const baseSize = [450, 400]; //x,y
const p = 0.3; // padding ratio for moveover display
function init(_e, cb) {
    d3.selectAll('.previewimagebox')
        .data(data)
        .append("svg")
        .attr('width', 450)
        .attr('height', 400)
        .append("svg:image")
        .attr("xlink:href", function(d) {
            return "../images/preview/" + d + ".jpg";
        })
        .attr('class', "previewimage")
        .attr("width", "450px")
        .attr("height", "400px")
        .attr('transform', 'translate(' + 0 + ',' + 0 + ')');

    d3.selectAll('.previewbox')
        .on("mouseenter", previewBoxMouseOver)
        .on("mousemove", previewBoxMouseMove)
        .on("mouseleave", previewBoxMouseLeave);

    d3.select(window)
        .on('resize', imageCenterAll);

    imageCenterAll();

    if (cb) {
        cb(_e);
    }
}

function cBB() {
    return {
        box: d3.selectAll('.previewbox').node().getBoundingClientRect() //,
            // img: d3.selectAll('.previewimage').node().getBoundingClientRect()
    };
}

function imageCenterAll() {
    d3.selectAll('.previewimage')
        .transition()
        .ease('linear')
        .attr('width', cBB().box.width)
        .attr('height', cBB().box.height * 0.8)
        .attr('transform', 'translate(' + 0 + ',' + 0 + ')');
}

function imageCenter(_imgbox) {
    _imgbox.select('.previewimage')
        .transition()
        .ease('linear')
        .duration(500)
        .attr('width', cBB().box.width)
        .attr('height', cBB().box.height * 0.8)
        .attr('transform', 'translate(' + 0 + ',' + 0 + ')');
}

function setSpotlight(_m, _imgbox) {
    var scale = 2;
    var bb = cBB();
    var x = d3.scale
        .linear()
        .domain([0, bb.box.width])
        .range([+p * (baseSize[0] - bb.box.width), -(1 + p) * (baseSize[0] - bb.box.width)]);
    var y = d3.scale
        .linear()
        .domain([0, bb.box.height])
        .range([+p * (baseSize[1] - bb.box.height), -(1 + p) * (baseSize[1] - bb.box.height)]);
    _m[0] = _m[0] < 0 ? 0 : _m[0];
    _m[1] = _m[1] < 0 ? 0 : _m[1];
    _imgbox.select('.previewimage')
        .attr('width', baseSize[0])
        .attr('height', baseSize[1])
        .attr('transform', 'translate(' + x(_m[0]) + ',' + y(_m[1]) + ')');
}

function previewBoxMouseOver(_event) {
    stateMouseOver = true;
    setSpotlight(d3.mouse(this), d3.select(this));
}

function previewBoxMouseMove(_event) {
    setSpotlight(d3.mouse(this), d3.select(this));
}

function previewBoxMouseLeave(_event) {
    stateMouseOver = false;
    imageCenter(d3.select(this));
}

init();
