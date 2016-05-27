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
        if (true === this._checkGameEnd()) {
            this._endGame();
            return;
        }
        var $this = this,
            turnSet = false,
            setOnNextPlayer = false;

        this.players.forEach(function (player) {
            if (true === player.currentTurn) {
                player.relinquishTurn();
                setOnNextPlayer = true;
            }
            else if (true === setOnNextPlayer && false === player.bust && false === player.stay) {
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
    },
    _checkGameEnd = function () {
        // Check if the dealer has busted
        var dealer = this._getDealer();

        if (true === dealer.bust) {
            return true;
        }
        else if (16 <= dealer.total) {
            return true;
        }

        return false;
    },
    _getDealer = function () {
        var dealer = this.players.filter(function (pl) {
            return pl.name === 'Dealer';
        });

        return dealer[0];
    },
    _endGame = function () {
         var dealer = this._getDealer();

         if (true === dealer.bust) {
             // Everyone's a winner!
             this._renderDealerBust();
         }
    },
    _renderDealerBust = function () {
        var playerContainer = $('#players-container'),
            arg;

        playerContainer.children('div').remove();
        this.players.forEach(function (player) {
            arg = 'Dealer' === player.name ? 'loser' : 'winner';
            playerContainer.append(player.renderHtml(arg));
        });
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
        setTurn: setTurn,
        _checkGameEnd: _checkGameEnd,
        _getDealer: _getDealer,
        _endGame: _endGame,
        _renderDealerBust: _renderDealerBust
    }
}

function Player (name) {
    var renderHtml = function (arg) {
        var html = "<div id='" + this.getHtmlId() + "'";

        if ('undefined' === typeof arg) {
            html += "><h2>" + this.name + "</h2>"
                    + this._renderStatus()
                    + this._renderCardsHtml();
        }
        else {
            var divClass = 'winner' === arg ? " class='winner'>" : " class='loser'>";

            html += divClass + "<h2>" + this.name + "</h2>"
                    + this._renderStatus()
                    + this._renderCardsHtml();
        }

        return html + "</div>";
    },
    getHtmlId = function () {
        return 'player-' + this.name.replace(' ', '-');
    },
    _renderStatus = function () {
        var html = '';
        if (true === this.bust) {
            html += "<span class='bust'>Busted on " + this.total;
        }
        if (true === this.stay) {
            html += "<span class='stay'>Stayed on " + this.total;
        }

        return html + "</span>";
    },
    _renderCardsHtml = function () {
        var html = "<div class='cards-container'>",
            card;

        if (0 < this.cards.length) {
            if (this.name === 'Dealer') {
                this.cards.forEach(function (card, i) {
                    if (0 === i) {
                        html += "<span>" + card.number + ' ' + card.suit + "</span>";
                    }
                    else {
                        html += "<span>Hidden Card</span>";
                    }
                });
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

        this.bust = 21 < this.total;
        this.stay = 21 === this.total;
    },
    relinquishTurn = function () {
        this.currentTurn = false;
        $('#' + this.getHtmlId()).removeClass('current-turn').find('#player-turn-actions').remove();
    },
    takeTurn = function (game) {
        this.currentTurn = true;
        $('#' + this.getHtmlId()).addClass('current-turn');
        this._renderActionHtml(game);
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
    // _renderTotalHtml = function (message) {
    //     var totSpan = document.createElement('span');
    //     totSpan.innerHTML = message + this.total;
    //
    //     $('#' + this.getHtmlId()).find('h2').after(totSpan);
    // },
    _processAction = function (elem, game) {
        var action = elem.id;
        'hit' === action ? this._hit(game) : this._stay(game);
    },
    // Private methods
    _hit = function (game) {
        this.drawCard(game.deck.getCard());
        game.renderGame();
        game.setTurn();
    },
    _stay = function (game) {
        this.stay = true;
        game.renderGame();
        game.setTurn();
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
        winner: false,
        renderHtml: renderHtml,
        getHtmlId: getHtmlId,
        _renderStatus: _renderStatus,
        _renderCardsHtml: _renderCardsHtml,
        drawCard: drawCard,
        relinquishTurn: relinquishTurn,
        takeTurn: takeTurn,
        _renderActionHtml: _renderActionHtml,
        // _renderTotalHtml: _renderTotalHtml,
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
