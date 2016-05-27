<!DOCTYPE html>
<html>
<head>
    <link rel="Stylesheet" href="styles.css"/>
</head>
<body>
    <div id="game-controls" class="main-container">
        <label>Please enter each player's name</label>
        <input type="text" name="player-name" />
        <hr>
        <button type="button" id="add-player">Add Player</button>
        <button type="button" id="start-game">Start Game</button>
    </div>
    <div id="players-container" class="main-container">
        <h1>Players</h1>
    </div>

    <!-- JS -->
    <script src="jquery/dist/jquery.min.js"></script>
    <script src="app.js"></script>
</body>
</html>
