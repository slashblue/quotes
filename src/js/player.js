QuotesPlayer = function(options) {
	this.initialize(options);
	this.initializeLocalStorage();
	return this;
};

QuotesPlayer.prototype = {
	initialize: function(options) {
		this._type = 'QuotesPlayer';
		this.options = $.extend({}, {
			'interval': 10 * 1000,
			'factorFaster': 0.8,
			'factorSlower': 1.2
		}, options || {});
		this._played = {
			'quotes': [],
			'index': -1
		};
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
		this._onFaster = function(nextSpeed, previousSpeed) {};
		this._onReset = function() {};
		this._onSlower = function(nextSpeed, previousSpeed) {};
	},
	initializeLocalStorage: function() {
		if (window.localStorage && localStorage) {
			try {
				var _played = JSON.parse(localStorage.getItem('QuotesPlayer._played') || '{}');
				if (_played && typeof _played == 'object' && _played.hasOwnProperty('quotes') && _played.hasOwnProperty('index')) {
					this._played = _played;
				} else {
					this.updateLocalStorage();
				}
			} catch (error) {
				logger.log('error', 'QuotesPlayer.onInitializeLocalStorage', { 'error': error });
			}
			
		}
	},
	updateLocalStorage: function() {
		if (window.localStorage && localStorage) {
			if (this._played && typeof _played == 'object') {
				localStorage.setItem('QuotesPlayer._played', JSON.stringify(this._played));
			}
		}
	},
	setUp: function() {
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
	ready: function(event) {
		var currentQuote = this.nextQuote(0);
		if (this._onReady) {
			logger.log('debug', 'QuotesPlayer.onReady', { 'quote': currentQuote });
			this._onReady(currentQuote, event);
		}
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
		this.nextDelayed(event);
		if (this._onResume) {
			logger.log('debug', 'QuotesPlayer.onResume');
			this._onResume(event);
		}
	},
	suspend: function(event) {
		window.clearInterval(this._timerPlayer);
		window.clearTimeout(self._timerRestart);
		if (this._onSuspend) {
			logger.log('debug', 'QuotesPlayer.onSuspend');
			this._onSuspend(event);
		}
	},
	pause: function(event) {
		this._timerPlaying = false;
		window.clearInterval(this._timerPlayer);
		window.clearTimeout(self._timerRestart);
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
		window.clearInterval(self._timerPlayer);
		self._timerPlayer = window.setInterval(function() {
			self._timerTimestamp = $.timestamp();
			self.next(event);
		}, self.options.interval);
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
		var previousPlayedInterval = this.options.interval
		this.options.interval = this.options.factorFaster * this.options.interval;
		this.restart();
		if (this._onFaster) {
			logger.log('debug', 'QuotesPlayer.onFaster', { 'previous': previousPlayedInterval, 'next': this.options.interval });
			this._onFaster(this.options.interval, previousPlayedInterval);
		}
	},
	slower: function() {
		var previousPlayedInterval = this.options.interval
		this.options.interval = this.options.factorSlower * this.options.interval;
		this.restart();
		if (this._onSlower) {
			logger.log('debug', 'QuotesPlayer.onSlower', { 'previous': previousPlayedInterval, 'next': this.options.interval });
			this._onSlower(this.options.interval, previousPlayedInterval);
		}
	},
	reset: function() {
		this.options.interval = 10 * 1000;
		if (this._onReset) {
			logger.log('debug', 'QuotesPlayer.onReset');
			this._onReset();
		}
	},
	restart: function(diff) {
		var self = this;
		if (self.isPlaying()) {	
			window.clearInterval(self._timerPlayer);
			window.clearTimeout(self._timerRestart);
			var diff = Math.min(self.options.interval , Math.max(0, self._timerTimestamp ? self._timerTimestamp + self.options.interval - $.timestamp() : self.options.interval));	
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
	onFaster: function(callback) {
		this._onFaster = callback;
	},
	onSlower: function(callback) {
		this._onSlower = callback;
	},
	onReset: function(callback) {
		this._onReset = callback;
	},
	previousQuote: function() {
		return this.nextQuote(-1);
	},
	currentQuote: function() {
		return this._played.quotes[this._played.index] || {};
	},
	nextQuote: function(offset) {
		var self = this;
		var index = Math.max(self._played.index + offset, 0);
		var quote = self._played.quotes[index];
		while (!quote) {
			var pickedQuote = null;
			if (self._onPick) {
				pickedQuote = self._onPick();
			}
			if (!pickedQuote) {
				return null;
			}
			self._played.quotes.push(pickedQuote);
			quote = self._played.quotes[index];
		}
		self._played.index = index;
		window.setTimeout(function() {
			self.updateLocalStorage();
		}, 100);
		return quote;
	}
};