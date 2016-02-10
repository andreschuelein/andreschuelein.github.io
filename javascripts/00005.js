var gridWidth,
    gridHeight,
    squares,
    s,
    elapsedTime,
    previousFrameTime,
    timerOff,
    frameDuration;

function drawGrid() {
    squares = [];
    d3.range(gridHeight).forEach(function(j) {
        var row = [];
        d3.range(gridWidth).forEach(function(i) {
            var square = d3.select("#sContainer")
                .append("div")
                .attr("class", "squareSmall");
            //.text(j);
            row.push(square);
        });
        squares.push(row);
    });
}

function updateFrame() {
    for (var x = 0; x < gridWidth; x++) {
        for (var y = 0; y < gridHeight; y++) {
            grid(x, y).classed('cell', s[x][y]);
        }
    }
}

// transpose squares as grid
function grid(_x, _y) {
    return squares[_y][_x];
}

function px(_x) {
    if (_x >= 0 && _x < gridWidth) {
        return _x;
    } else if (_x < 0) {
        return gridWidth - 1;
    } else if (_x >= gridWidth) {
        return 0;
    }
}

function py(_y) {
    if (_y >= 0 && _y < gridHeight) {
        return _y;
    } else if (_y < 0) {
        return gridHeight - 1;
    } else if (_y >= gridHeight) {
        return 0;
    }
}

function rules(count, alive) {
    if (alive) {
        switch (count) {
            case 0:
                return false;
            case 1:
                return false;
            case 2:
                return true;
            case 3:
                return true;
            case 4:
                return false;
            case 5:
                return false;
            case 6:
                return false;
            case 7:
                return false;
            case 8:
                return false;
        }
    } else {
        switch (count) {
            case 0:
                return false;
            case 1:
                return false;
            case 2:
                return false;
            case 3:
                return true;
            case 4:
                return false;
            case 5:
                return false;
            case 6:
                return false;
            case 7:
                return false;
            case 8:
                return false;
        }
    }
}

function updateModel() {
    newStates = [];
    for (var x = 0; x < gridWidth; x++) {
        newStates[x] = [];
        for (var y = 0; y < gridHeight; y++) {
            // rules here
            var neighbourCount = 0;
            for (var i = x - 1; i < x + 2; i++) {
                for (var j = y - 1; j < y + 2; j++) {
                    if (!(x === i && y === j)) {
                        if (s[px(i)][py(j)]) {
                            neighbourCount++;
                        }
                    }
                }
            }
            //update
            newStates[x][y] = rules(neighbourCount, s[x][y]);
        }
    }

    //copy s
    for (var k = 0; k < gridWidth; k++) {
        for (var l = 0; l < gridHeight; l++) {
            s[k][l] = newStates[k][l];
        }
    }
}

function init(index) {
    gridWidth = 40;
    gridHeight = 40;
    elapsedTime = 0;
    previousFrameTime = 0;
    frameDuration = 100;
    timerOff = false;
    d3.select("#sContainer").style({
    width: "440px",
    height: "440px"
});

    switch (index) {
        case 1:
            randomInit();
            break;
        case 2:
            gliderInit();
            break;
        case 3:
            lwssInit();
            break;
        case 4:
            oscillatorInit();
            break;
    }


}

function clearStates() {
    s = [];
    for (var x = 0; x < gridWidth; x++) {
        s[x] = [];
        for (var y = 0; y < gridHeight; y++) {
            s[x][y] = false;
        }
    }
}

function randomInit() {
    s = [];
    for (var x = 0; x < gridWidth; x++) {
        s[x] = [];
        for (var y = 0; y < gridHeight; y++) {
            if (Math.floor(2 * Math.random()) === 0) {
                s[x][y] = false;
            } else {
                s[x][y] = true;
            }
        }
    }
}

function gliderInit() {
    clearStates();
    s[10][10] = true;
    s[9][12] = true;
    s[10][12] = true;
    s[11][12] = true;
    s[11][11] = true;
    s[30][10] = true;
    s[31][9] = true;
    s[32][9] = true;
    s[32][10] = true;
    s[32][11] = true;
}

function lwssInit() {
    clearStates();
    s[15][15] = true;
    s[15][17] = true;
    s[18][15] = true;
    s[16][18] = true;
    s[17][18] = true;
    s[18][18] = true;
    s[19][18] = true;
    s[19][17] = true;
    s[19][16] = true;
    //
    s[30][30] = true;
    s[29][31] = true;
    s[29][32] = true;
    s[29][33] = true;
    s[29][34] = true;
    s[30][34] = true;
    s[31][34] = true;
    s[32][30] = true;
    s[32][33] = true;
}

function oscillatorInit() {
    clearStates();
    // pulsar
    s[4][2] = true;
    s[5][2] = true;
    s[6][2] = true;
    s[10][2] = true;
    s[11][2] = true;
    s[12][2] = true;
    s[4][7] = true;
    s[5][7] = true;
    s[6][7] = true;
    s[10][7] = true;
    s[11][7] = true;
    s[12][7] = true;
    s[4][9] = true;
    s[5][9] = true;
    s[6][9] = true;
    s[10][9] = true;
    s[11][9] = true;
    s[12][9] = true;
    s[4][14] = true;
    s[5][14] = true;
    s[6][14] = true;
    s[10][14] = true;
    s[11][14] = true;
    s[12][14] = true;
    s[2][4] = true;
    s[2][5] = true;
    s[2][6] = true;
    s[2][10] = true;
    s[2][11] = true;
    s[2][12] = true;
    s[7][4] = true;
    s[7][5] = true;
    s[7][6] = true;
    s[7][10] = true;
    s[7][11] = true;
    s[7][12] = true;
    s[9][4] = true;
    s[9][5] = true;
    s[9][6] = true;
    s[9][10] = true;
    s[9][11] = true;
    s[9][12] = true;
    s[14][4] = true;
    s[14][5] = true;
    s[14][6] = true;
    s[14][10] = true;
    s[14][11] = true;
    s[14][12] = true;
    // phoenix
    s[21][1] = true;
    s[21][2] = true;
    s[23][2] = true;
    s[19][3] = true;
    s[18][5] = true;
    s[19][5] = true;
    s[20][7] = true;
    s[22][7] = true;
    s[22][8] = true;
    s[24][4] = true;
    s[25][4] = true;
    s[24][6] = true;
    // muttering moat
    s[30][2] = true;
    s[31][3] = true;
    s[29][4] = true;
    s[30][4] = true;
    s[31][4] = true;

    s[30][10] = true;
    s[31][9] = true;
    s[29][8] = true;
    s[30][8] = true;
    s[31][8] = true;

    s[36][2] = true;
    s[35][3] = true;
    s[37][4] = true;
    s[36][4] = true;
    s[35][4] = true;

    s[36][10] = true;
    s[35][9] = true;
    s[37][8] = true;
    s[36][8] = true;
    s[35][8] = true;

    s[33][2] = true;
    s[33][3] = true;
    s[33][4] = true;
    s[33][5] = true;

    s[33][7] = true;
    s[33][8] = true;
    s[33][9] = true;
    s[33][10] = true;

    s[28][6] = true;
    s[29][6] = true;
    s[30][6] = true;
    s[31][6] = true;
    s[32][6] = true;

    s[34][6] = true;
    s[35][6] = true;
    s[36][6] = true;
    s[37][6] = true;
    s[38][6] = true;

    s[32][1] = true;
    s[34][1] = true;

    s[32][11] = true;
    s[34][11] = true;

    //blinker
    s[19][11] = true;
    s[19][12] = true;
    s[19][13] = true;
    // pentadecathlon
    s[4][22] = true;
    s[4][23] = true;
    s[4][24] = true;
    s[4][25] = true;
    s[4][26] = true;
    s[4][27] = true;
    s[4][28] = true;
    s[4][29] = true;
    s[5][22] = true;
    s[5][24] = true;
    s[5][25] = true;
    s[5][26] = true;
    s[5][27] = true;
    s[5][29] = true;
    s[6][22] = true;
    s[6][23] = true;
    s[6][24] = true;
    s[6][25] = true;
    s[6][26] = true;
    s[6][27] = true;
    s[6][28] = true;
    s[6][29] = true;
    //beacon
    s[12][18] = true;
    s[13][18] = true;
    s[12][19] = true;
    s[14][21] = true;
    s[15][20] = true;
    s[15][21] = true;
    //clock
    s[12][26] = true;
    s[13][24] = true;
    s[13][25] = true;
    s[14][26] = true;
    s[14][27] = true;
    s[15][25] = true;
    //toad
    s[13][31] = true;
    s[14][31] = true;
    s[15][31] = true;
    s[12][32] = true;
    s[13][32] = true;
    s[14][32] = true;
    //clock
    s[24][17] = true;
    s[24][18] = true;
    s[25][17] = true;
    s[25][18] = true;

    s[18][21] = true;
    s[18][22] = true;
    s[19][21] = true;
    s[19][22] = true;

    s[22][27] = true;
    s[22][28] = true;
    s[23][27] = true;
    s[23][28] = true;

    s[28][23] = true;
    s[28][24] = true;
    s[29][23] = true;
    s[29][24] = true;

    s[22][20] = true;
    s[23][20] = true;
    s[24][20] = true;
    s[25][20] = true;

    s[21][21] = true;
    s[21][22] = true;
    s[21][23] = true;
    s[21][24] = true;

    s[26][21] = true;
    s[26][22] = true;
    s[26][23] = true;
    s[26][24] = true;

    s[22][25] = true;
    s[23][25] = true;
    s[24][25] = true;
    s[25][25] = true;

    s[24][21] = true;
    s[23][22] = true;
    s[23][23] = true;



}

function frameAnim(currentTime) {
    elapsedTime = currentTime - previousFrameTime;
    //    console.log(elapsedTime);
    if (elapsedTime > frameDuration) {
        previousFrameTime = currentTime;
        updateModel();
        updateFrame();
    }
    return (timerOff);
}

function start() {
    var dropDownList = ["choose seed:", "random", "glider", "Lightweight spaceship",
        "Oscillators"
    ];
    var selector = d3.select("main")
        .append("div")
        .append("select")
        .selectAll("option")
        .data(dropDownList)
        .enter().append("option")
        .attr("value", function(d, i) {
            return i;
        })
        .text(function(d) {
            return d;
        });
    d3.select("select").on("change", function() {
        restart(this.selectedIndex);
        this.selectedIndex = 0;
    });

    init(1);// 1-random
    drawGrid();
    // updateFrame();
    d3.timer(frameAnim);
}

function restart(_i) {

    init(_i);
    d3.timer(frameAnim);
}

start();
