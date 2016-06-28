QuotesPlayer = function() {
	this.initialize();
	return this;
};

QuotesPlayer.prototype = {
	initialize: function() {
		this.type = 'QuotesPlayer';
		this.playedInterval = 10 * 1000;
		this.playedFactorFaster = 0.8;
		this.playedFactorSlower = 1.2;
		this._playedQuotes = [];
		this._playedQuotesIndex = -1;
		this._timerPlayer = null;
		this._timerPlaying = null;
		this._timerTimestamp = null;
		this._timerRestart = null;
		this._onPick = function() { return null; };
		this._onReady = function(currentQuote, event) {};
		this._onPlay = function(currentQuote, event) {};
		this._onResume = function(event) {};
		this._onSuspend = function(event) {};
		this._onPause = function(currentQuote, event) {};
		this._onNext = function(nextQuote, previousQuote, event) {};
		this._onPrevious = function(nextQuote, previousQuote, event) {};
	},
	setUp: function() {
		var currentQuote = this.nextQuote(0);
		if (this._onReady) {
			logger.log('debug', 'QuotesPlayer.onReady', { 'quote': currentQuote });
			this._onReady(currentQuote, event);
		}
	},
	tearDown: function() {
		this.pause();
		this.initialize();
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
		window.clearInterval(this._timerPlayer);
		if (this._onSuspend) {
			logger.log('debug', 'QuotesPlayer.onSuspend');
			this._onSuspend(event);
		}
	},
	pause: function(event) {
		this._timerPlaying = false;
		window.clearInterval(this._timerPlayer);
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
		window.clearInterval(self._timerPlayer);
		self._timerPlayer = window.setInterval(function() {
			self._timerTimestamp = $.timestamp();
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
	faster: function() {
		var previousPlayedInterval = this.playedInterval
		this.playedInterval = this.playedFactorFaster * this.playedInterval;
		this.restart();
		if (this._onFaster) {
			logger.log('debug', 'QuotesPlayer.onFaster', { 'previous': previousPlayedInterval, 'next': this.playedInterval });
			this._onFaster();
		}
	},
	slower: function() {
		var previousPlayedInterval = this.playedInterval
		this.playedInterval = this.playedFactorSlower * this.playedInterval;
		this.restart();
		if (this._onSlower) {
			logger.log('debug', 'QuotesPlayer.onSlower', { 'previous': previousPlayedInterval, 'next': this.playedInterval });
			this._onSlower();
		}
	},
	restart: function(diff) {
		var self = this;
		if (self.isPlaying()) {	
			window.clearInterval(self._timerPlayer);
			window.clearTimeout(self._timerRestart);
			var diff = Math.min(self.playedInterval , Math.max(0, self._timerTimestamp ? self._timerTimestamp + self.playedInterval - $.timestamp() : self.playedInterval));	
			logger.log('debug', 'QuotesPlayer.onRestart', { 'diff': diff });
			self._timerRestart = window.setTimeout(function() {
				self.next();
				self.nextDelayed();
			}, diff);
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