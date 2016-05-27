$(document).ready(function () {
    var game = Game();

    game.listeners['addPlayer'] = $('body').on('click', '#add-player', function () {
        game.addPlayer();
    });

    game.listeners['addPlayerOnEnter'] = $('body').on('keyup', '#game-controls input[name=player-name]', function () {
        if (event.which === 13) {
            game.addPlayer();
        }
    });

    game.listeners['startGame'] = $('body').on('click', '#start-game', function () {
        game.startGame();
    });
});

function Game () {
    var renderGame = function () {
        var playerContainer = $('#players-container');

        playerContainer.children('div').remove();
        this.players.forEach(function (player) {
            playerContainer.append(player.renderHtml());
        });
    },
    addPlayer = function () {
        var name = $('#game-controls').children('input[name=player-name]').val();

        if ('' === name) {
            $('#start-game').trigger('click');
        }
        else {
            this.players.push(Player($('#game-controls').children('input[name=player-name]').val()));
            $('#game-controls').children('input[name=player-name]').val('');
            this.renderGame();
        }
    },
    startGame = function () {
        this.listeners.addPlayer.off();
        $('#game-controls').addClass('inactive');

        this.deal();

        this.setTurn();
    },
    deal = function () {
        var $this = this,
            card;

        for (var c = 0; c <= 1; c++) {
            this.players.forEach(function (player) {
                player.drawCard($this.deck.getCard());
            });
        }

        this.renderGame();
    },
    setTurn = function () {
        var $this = this,
            turnSet = false,
            setOnNextPlayer = false;

        this.players.forEach(function (player) {
            if (true === player.currentTurn) {
                player.relinquishTurn();
                setOnNextPlayer = true;
            }
            else if (true === setOnNextPlayer) {
                player.takeTurn($this);
                turnSet = true;
                setOnNextPlayer = false;
            }
        });

        // Check to make sure the turn was set
        if (false === turnSet) {
            // Turn not set, if setOnNextPlayer is false then this is the start
            // of the game and turn should be set on first player
            if (false === setOnNextPlayer) {
                // this.players[0] is the dealer
                this.players[1].takeTurn($this);
            }
            else {
                // It's the dealers turn
                this.players[0].takeTurn($this);
            }
        }
    };

    return {
        players: [
            Player('Dealer')
        ],
        listeners: {},
        deck: Deck(),
        renderGame: renderGame,
        addPlayer: addPlayer,
        startGame: startGame,
        deal: deal,
        setTurn: setTurn
    }
}

function Player (name) {
    var renderHtml = function () {
        var html = "<div id='" + this.getHtmlId() + "'>"
                + "<h2>" + this.name + "</h2>"
                + this.renderCardsHtml()
            + "</div>";

        return html;
    },
    getHtmlId = function () {
        return 'player-' + this.name.replace(' ', '-');
    },
    renderCardsHtml = function () {
        var html = "<div class='cards-container'>",
            card;

        if (0 < this.cards.length) {
            if (this.name === 'Dealer') {
                card = 'undefined' !== typeof this.cards[0] ? this.cards[0] : '';
                html += "<span>" + card.number + ' ' + card.suit + "</span><span>Hidden Card</span>";
            }
            else {
                this.cards.forEach(function (card) {
                    html += "<span>" + card.number + ' ' + card.suit + "</span>";
                });
            }
        }

        return html + "</div>";
    },
    drawCard = function (card) {
        this.cards.push(card);
        this._total();
    },
    relinquishTurn = function () {
        this.currentTurn = false;
        $('#' + this.getHtmlId()).removeClass('current-turn').find('#player-turn-actions').remove();
        console.log('relinquishing', this.name);
    },
    takeTurn = function (game) {
        this.currentTurn = true;
        $('#' + this.getHtmlId()).addClass('current-turn');
        this.renderActionHtml(game);
    },
    _renderActionHtml = function (game) {
        var playerCardsCon = $('#' + this.getHtmlId() + ' .cards-container'),
            html = "<div id='player-turn-actions'>"
                    + "<button type='button' id='hit'>Hit</button>"
                    + "<button type='button' id='stay'>Stay</button>"
                + "</div>";

        playerCardsCon.after(html);

        $this = this;
        this.listeners['actionListener'] = $('#' + this.getHtmlId() + ' #player-turn-actions button').click(function () {
            $this._processAction(this, game);
        });
    },
    _processAction = function (elem, game) {
        var action = elem.id;

        'hit' === action ? this._hit(game) : this._stay(game);
    },
    // Private methods
    _hit = function (game) {
        this.drawCard(game.deck.getCard());

        console.log(this.name, this.total, this.cards);

        game.setTurn();
    },
    _stay = function () {
        this.stay = true;

        this.renderTotalHtml();
    },
    _total = function () {
        var faceCards = ['J', 'Q', 'K'],
            $this = this;

        $this.total = 0;

        this.cards.forEach(function (card) {
            if ('A' === card.number) {
                if (21 < $this.total + 11) {
                    $this.total += 1;
                }
            }
            else {

                $this.total += -1 < faceCards.indexOf(card.number) ? 10 : card.number;
            }
        });
    };

    return {
        name: name,
        cards: [],
        total: 0,
        stay: false,
        bust: false,
        currentTurn: false,
        listeners: {},
        renderHtml: renderHtml,
        getHtmlId: getHtmlId,
        renderCardsHtml: renderCardsHtml,
        drawCard: drawCard,
        relinquishTurn: relinquishTurn,
        takeTurn: takeTurn,
        _renderActionHtml: _renderActionHtml,
        _processAction: _processAction,
        _hit: _hit,
        _stay: _stay,
        _total: _total
    }
}
function Deck () {
    var getCard = function () {
        var card = this.cards.splice(Math.floor(Math.random() * this.cards.length), 1);

        return card[0];
    },
    cards = [];

    for (var n = 1; n <= 13; n++) {
        for (var s = 0; s <= 3; s++) {
            cards.push(Card(n, s));
        }
    }

    return {
        cards: cards,
        getCard: getCard
    }
}
function Card (number, suit) {
    var specialNumbers = {
        1: 'A',
        11: 'J',
        12: 'Q',
        13: 'K'
    },
    suits = ['spade', 'club', 'diamond', 'heart'];

    return {
        number: 'undefined' === typeof specialNumbers[number] ? number : specialNumbers[number],
        suit: 'undefined' === typeof suits[suit] ? suit : suits[suit]
    };
}
