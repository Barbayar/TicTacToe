var matrix;
var tiles;
var gameOver;
var mode = 'smart';

function newGame() {
  var tileSize = this.stage.options.tileSize;

  matrix = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  tiles = [[null, null, null], [null, null, null], [null, null, null]];
  gameOver = false;

  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
      var tile = new Rect(i * tileSize + tileSize / 2, j * tileSize + tileSize / 2, 0, 0).fill(color('white')).stroke('#000', 2).addTo(stage).animate('0.5s', {
        x: i * tileSize,
        y: j * tileSize,
        width: tileSize,
        height: tileSize
      }, {
        easing: 'elasticOut'
      }).on('click', function(e) {
        onClick(e.target.coordinate.x, e.target.coordinate.y);
      });
      tile.coordinate = {
        x: i,
        y: j,
      };
      tiles[i][j] = tile;
    }
  }
}

function countLines() {
  var result = [0, 0, 0, 0, 0, 0, 0, 0];

  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
      result[i] += matrix[i][j];
      result[i + 3] += matrix[j][i];
    }

    result[6] += matrix[i][i];
    result[7] += matrix[i][2 - i];
  }

  return result;
}

function checkGame() {
  var counts = countLines();
  var winner = 0;

  // checks if someone won
  for (var i = 0; i < counts.length; i++) {
    if (counts[i] === 3 || counts[i] === -3) {
      gameOver = true;
      winner = counts[i] / 3;

      break;
    }
  }

  // checks if there is an empty cell
  if (!gameOver) {
    var emptyCellsFound = false;

    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        if (matrix[i][j] === 0) {
          emptyCellsFound = true;

          break;
        }
      }
    }

    if (!emptyCellsFound) {
      gameOver = true;
    }
  }


  if (gameOver) {
    stage.sendMessage({
      message: 'gameOver',
      winner: winner
    });
  }
}

function shake(tile) {
  // tried to shake the tile, but didn't have time to do research
  tile.animate('0.2s', {
    fillColor: color('#cc4280'),
  }, {
    easing: 'elasticIn'
  }).animate('0.2s', {
    fillColor: color('white'),
  }, {
    easing: 'elasticOut',
    delay: '0.2s',
  });
}

function ai() {
  var tileSize = this.stage.options.tileSize;
  var emptyCells = [];
  var move = null;

  if (gameOver) {
    return;
  }

  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
      if (matrix[i][j] === 0) {
        emptyCells.push([i, j]);
      }
    }
  }

  if (mode === 'random') {
    move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  if (mode === 'smart') {
    // if AI is about to win, finish it
    for (var i = 0; i < emptyCells.length && move === null; i++) {
      // similates the situations
      matrix[emptyCells[i][0]][emptyCells[i][1]] = -1;
      var counts = countLines();
      matrix[emptyCells[i][0]][emptyCells[i][1]] = 0;

      for (var j = 0; j < counts.length; j++) {
        if (counts[j] === -3) {
          move = emptyCells[i];

          break;
        }
      }
    }

    // if the player is about to win, will block it
    for (var i = 0; i < emptyCells.length && move === null; i++) {
      // similates the situations
      matrix[emptyCells[i][0]][emptyCells[i][1]] = 1;
      var counts = countLines();
      matrix[emptyCells[i][0]][emptyCells[i][1]] = 0;

      for (var j = 0; j < counts.length; j++) {
        if (counts[j] === 3) {
          move = emptyCells[i];

          break;
        }
      }
    }

    // if nothing is critical, use below priority
    var priority = [[1, 1], [0, 0], [0, 2], [2, 0], [2, 2], [1, 0], [0, 1], [1, 2], [2, 1]];
    for (var i = 0; i < priority.length && move === null; i++) {
      if (matrix[priority[i][0]][priority[i][1]] === 0) {
        move = priority[i];
        break;
      }
    }
  }

  if (move === null) {
    return;
  }

  matrix[move[0]][move[1]] = -1;
  new Star(tileSize * move[0] + tileSize / 2, tileSize * move[1] + tileSize / 2, 50, 4).fill(color('#c10000')).stroke('#000', 10).addTo(stage).animate('0.5s', {
    radius: tileSize * 0.3
  }, {
    easing: 'elasticOut'
  });
  checkGame();
}

function onClick(x, y) {
  var tileSize = this.stage.options.tileSize;

  if (matrix[x][y] !== 0 || gameOver) {
    shake(tiles[x][y]);
    return;
  }

  matrix[x][y] = 1;
  new Circle(tileSize * tiles[x][y].coordinate.x + tileSize / 2, tileSize * tiles[x][y].coordinate.y + tileSize / 2, 0).fill(color('#c0f1ff')).stroke('#000', 10).addTo(stage).animate('0.5s', {
    radius: tileSize * 0.3
  }, {
    easing: 'elasticOut'
  });
  checkGame();

  ai();
}

stage.on('key', function(e) {
  if (String.fromCharCode(e.charCode).toUpperCase() === 'R') {
    this.stage.clear();
    newGame();
  }
});

stage.on('message', function(data) {
  if (data.message === 'restart') {
    newGame();
  }

  if (data.message === 'updateMode') {
    mode = data.mode;
  }
});

newGame();

