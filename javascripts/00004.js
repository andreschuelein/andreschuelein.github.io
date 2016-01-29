var gridWidth,
    gridHeight,
    squares,
    snakeHeadPos,
    timerOff,
    animationPlay, // animation toggle
    time,
    movementDirection, // 0 - up; 1 - right; 2 - down; 3 - left;
    movementBuffer, //saves direction from last frame
    snakeLength,
    elapsedTime,
    previousFrameTime,
    foodPos,
    oldTailTip,
    frameDuration,
    score,
    snake;


function initGame() {
    gridWidth = 20;
    gridHeight = 20;
    frameDuration = 100; //ms
    score = 0;
    foodPos = [Math.floor(Math.random() * gridWidth / 3), Math.floor(Math.random() * gridHeight / 3)];
    snake = [];
    oldTailTip = [0, 0];
    elapsedTime = 0;
    previousFrameTime = 0;
    timerOff = false;
    animationPlay = true;
    time = 0;
    movementDirection = 0; // 0 - up; 1 - right; 2 - down; 3 - left;
    movementBuffer = movementDirection;
    snakeLength = 1; // start length of the snake

    d3.select("#sContainer").style({
        width: "420px",
        height: "420px"
    });
    snakeHeadPos = [Math.round(gridWidth / 2), Math.round(gridHeight / 2)];
    for (var i = 0; i < gridWidth; i++) {
        var row = [];
        for (var j = 0; j < gridHeight; j++) {
            row[j] = false;
        }
    }
    // spawn snake head
    d3.select("body").on("keydown", function(e) {
        key = d3.event.keyCode;
        switch (key) {
            case 38: //up
                d3.event.preventDefault();
                if (movementBuffer !== 2) {
                    movementDirection = 0;
                }
                break;
            case 39: //right
                d3.event.preventDefault();
                if (movementBuffer !== 3) {
                    movementDirection = 1;
                }
                break;
            case 40: //down
                d3.event.preventDefault();
                if (movementBuffer !== 0) {
                    movementDirection = 2;
                }
                break;
            case 37: //left
                d3.event.preventDefault();
                if (movementBuffer !== 1) {
                    movementDirection = 3;
                }
                break;
        }
    });
}

// transpose squares as grid
function grid(x, y) {
    return squares[y][x];
}

function drawGrid() {
    squares = [];
    d3.range(gridHeight).forEach(function(j) {
        var row = [];
        d3.range(gridWidth).forEach(function(i) {
            var square = d3.select("#sContainer")
                .append("div")
                .attr("class", "square");
            //.text(j);
            row.push(square);
        });
        squares.push(row);
    });
}

function updateDisplay() {

    d3.selectAll('.square')
        .classed('snake', false)
        .classed('food', false)
        .classed('tail', false);

    // spawn food in model
    grid(foodPos[0], foodPos[1]).classed('food', true);
    // insert head into model
    grid(snakeHeadPos[0], snakeHeadPos[1]).classed('snake', true);
    // insert tail into model
    for (var i = 0; i < snakeLength; i++) {
        grid(snake[i][0], snake[i][1]).classed('tail', true);
    }
}

function updateSnake() {

    // TODO check for and handle collisions
    // 
    // update snake head pos
    var oldHeadPos = [snakeHeadPos[0], snakeHeadPos[1]];
    if ((snakeLength > 0) && snake.length) {
        oldTailTip = [snake[snakeLength - 1][0], snake[snakeLength - 1][1]];
    }
    switch (movementDirection) {
        case 0:
            // move up
            snakeHeadPos[1] -= 1;
            if (snakeHeadPos[1] < 0) {
                snakeHeadPos[1] = gridHeight - 1;
            }
            break;

        case 1:
            // move right
            snakeHeadPos[0] += 1;
            if (snakeHeadPos[0] >= gridWidth) {
                snakeHeadPos[0] = 0;
            }
            break;

        case 2:
            // move down
            snakeHeadPos[1] += 1;
            if (snakeHeadPos[1] >= gridHeight) {
                snakeHeadPos[1] = 0;
            }
            break;

        case 3:
            //move left
            snakeHeadPos[0] -= 1;
            if (snakeHeadPos[0] < 0) {
                snakeHeadPos[0] = gridWidth - 1;
            }
            break;
    }
    movementBuffer = movementDirection;
    if (snakeLength === 1) {
        snake[0] = oldHeadPos;
    } else if (snakeLength > 1) {

        for (var k = 0; k < snakeLength - 1; k++) {
            snake[snakeLength - 1 - k] = snake[snakeLength - k - 2];
        }
        snake[0] = oldHeadPos;
    }
    if (checkForTailCollision()) {
        //handle collision
        alert('SCORE: ' + score);
        resetGame();
    }
    if ((snakeHeadPos[0] === foodPos[0]) && (snakeHeadPos[1] === foodPos[1])) {

        console.log("FOOD FOUND!");
        score++;
        spawnFood();
        snakeLength++;
        snake[snakeLength - 1] = oldTailTip;
    }

}

function checkForTailCollision() {
    var collisionFound = false;
    for (var k = 0; k < snakeLength; k++) {
        if ((snakeHeadPos[0] === snake[k][0]) && (snakeHeadPos[1] === snake[k][1])) {
            collisionFound = true;
        }
    }
    return collisionFound;
}


function frameAnim(currentTime) {
    elapsedTime = currentTime - previousFrameTime;
    //    console.log(elapsedTime);
    if (elapsedTime > frameDuration) {
        animationPlay = true;
        previousFrameTime = currentTime;
    } else {
        animationPlay = false;
    }
    if (animationPlay) { // HERE THER MAGIC HAPPENS
        updateSnake();
        updateDisplay();
    }
    // DON'T ACTUALLY USE THIS
    if (currentTime > 10000) {
        //  timerOff = true;
    }
    if (timerOff) {
        return true;
    } else {
        return false;
    }
}

function ePos(_x, _y) {
    return _y * gridWidth + _x;
}

function spawnFood() {
    var emptySpots = [];
    for (var x = 0; x < gridWidth; x++) {
        for (var y = 0; y < gridHeight; y++) {
            emptySpots[ePos(x, y)] = [x, y, 0];
        }
    }
    //tag head as not empty
    emptySpots[ePos(snakeHeadPos[0], snakeHeadPos[1])][2] = 1;
    //tag tail as not empty
    for (var k = 0; k < snakeLength; k++) {
        emptySpots[ePos(snake[k][0], snake[k][1])][2] = 1;
    }
    var newFoodPos = Math.floor((gridWidth * gridHeight - 1 - snakeLength) * Math.random());
    var freeSpotsFound = 0;
    var spotsChecked = 0;
    var posFound = false;
    while (!posFound) {
        if (emptySpots[spotsChecked][2] === 0) {
            //is empty
            freeSpotsFound++;
            spotsChecked++;
        } else {
            //is not empty
            spotsChecked++;
        }
        if (freeSpotsFound - 1 === newFoodPos) {
            posFound = true;
            foodPos[0] = emptySpots[spotsChecked - 1][0];
            foodPos[1] = emptySpots[spotsChecked - 1][1];
        }
    }
}

function startGame() {
    console.log("\n\n\n --STARTING GAME--");
    initGame(console.log('init complete'));
    drawGrid(console.log("grid drawn"));
    updateSnake();
    updateDisplay(console.log("display updated"));
    d3.timer(frameAnim);
}

function resetGame() {
    console.log("\n\n\n --GAME RESET--");
    initGame(console.log('init complete'));
    updateSnake();
    updateDisplay(console.log("display updated"));
    d3.timer(frameAnim);
}

startGame();
