QuotesPlayer = function() {
	this.type = 'QuotesPlayer';
	this.playedInterval = 10 * 1000;
	this._playedQuotes = [];
	this._playedQuotesIndex = -1;
	this._timerPlayer = null;
	this._timerPlaying = null;
	this._onPick = function() { return null; };
	this._onReady = function(currentQuote, event) {};
	this._onPlay = function(currentQuote, event) {};
	this._onResume = function(event) {};
	this._onSuspend = function(event) {};
	this._onPause = function(currentQuote, event) {};
	this._onNext = function(nextQuote, previousQuote, event) {};
	this._onPrevious = function(nextQuote, previousQuote, event) {};
};

QuotesPlayer.prototype = {
	setUp: function() {
		var currentQuote = this.nextQuote(0);
		if (this._onReady) {
			logger.log('debug', 'QuotesPlayer.onReady', { 'quote': currentQuote });
			this._onReady(currentQuote, event);
		}
	},
	isSuspended: function() {
		return !!this._timerPlayer;
	},
	isPlaying: function() {
		return !!this._timerPlaying;
	},
	toggle: function(event) {
		if (!this.isPlaying()) {
			this.play(event);
		} else {
			this.pause(event);
		}
	},
	play: function(event) {
		this._timerPlaying = true;
		this.next(event);
		this.nextDelayed(event);
		var currentQuote = this.currentQuote();
		if (this._onPlay) {
			logger.log('debug', 'QuotesPlayer.onPlay', { 'quote': currentQuote });
			this._onPlay(currentQuote, event);
		}
	},
	resume: function(event) {
		this._timerPlaying = true;
		this.nextDelayed(event);
		if (this._onResume) {
			logger.log('debug', 'QuotesPlayer.onResume');
			this._onResume(event);
		}
	},
	suspend: function(event) {
		this._timerPlaying = false;
		window.clearTimeout(this._timerPlayer);
		if (this._onSuspend) {
			logger.log('debug', 'QuotesPlayer.onSuspend');
			this._onSuspend(event);
		}
	},
	pause: function(event) {
		this._timerPlaying = false;
		window.clearTimeout(this._timerPlayer);
		this._timerPlayer = null;
		var currentQuote = this.currentQuote();
		if (this._onPause) {
			logger.log('debug', 'QuotesPlayer.onPause', { 'quote': currentQuote });
			this._onPause(currentQuote, event);
		}
	},
	next: function(event) {
		var previousQuote = this.currentQuote();
		var nextQuote = this.nextQuote(1);
		if (this._onNext) {
			logger.log('debug', 'QuotesPlayer.onNext', { 'previousQuote': previousQuote, 'nextQuote': nextQuote });
			this._onNext(nextQuote, previousQuote, event);
		}
	},
	nextDelayed: function(event) {
		var self = this;
		self._timerPlaying = true;
		window.clearTimeout(self._timerPlayer);
		self._timerPlayer = window.setInterval(function() {
			self.next(event);
		}, self.playedInterval);
	},
	previous: function(event) {
		var previousQuote = this.currentQuote();
		var nextQuote = this.nextQuote(-1);
		if (this._onPrevious) {
			logger.log('debug', 'QuotesPlayer.onPrevious', { 'previousQuote': previousQuote, 'nextQuote': nextQuote });
			this._onPrevious(nextQuote, previousQuote, event);
		}
	},
	onPlay: function(callback) {
		this._onPlay = callback;
	},
	onResume: function(callback) {
		this._onResume = callback;
	},
	onSuspend: function(callback) {
		this._onSuspend = callback;
	},
	onPause: function(callback) {
		this._onPause = callback;
	},
	onNext: function(callback) {
		this._onNext = callback;
	},
	onPrevious: function(callback) {
		this._onPrevious = callback;
	},
	onReady: function(callback) {
		this._onReady = callback;
	},
	onPick: function(callback) {
		this._onPick = callback;
	},
	currentQuote: function() {
		return this._playedQuotes[this._playedQuotesIndex] || {};
	},
	nextQuote: function(offset) {
		var index = Math.max(this._playedQuotesIndex + offset, 0);
		var quote = this._playedQuotes[index];
		while (!quote) {
			var pickedQuote = null;
			if (this._onPick) {
				pickedQuote = this._onPick();
			}
			if (!pickedQuote) {
				return null;
			}
			this._playedQuotes.push(pickedQuote);
			quote = this._playedQuotes[index];
		}
		this._playedQuotesIndex = index;
		return quote;
	}
};