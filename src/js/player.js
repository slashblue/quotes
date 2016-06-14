QuotesPlayer = {
	_playedQuotes: [],
	_playedQuotesIndex: -1,
	_playedIntervall: 10 * 1000,
	_timerPlayer: null,
	setUp: function() {
		var self = this;
		var currentQuote = self.nextQuote(0);
		if (self._onReady) {
			self._onReady(currentQuote, event);
		}
	},
	isSuspended: function() {
		var self = this;
		return !!self._timerPlayer;
	},
	toggle: function(event) {
		var self = this;
		if (self.isSuspended()) {
			self.play(event);
		} else {
			self.pause(event);
		}
	},
	play: function(event) {
		var self = this;
		var currentQuote = self.currentQuote();
		self.next();
		if (self._onPlay) {
			self._onPlay(currentQuote, event);
		}
	},
	resume: function(event) {
		var self = this;
		self.nextDelayed();
		if (self._onResume) {
			self._onResume(event);
		}
	},
	suspend: function(event) {
		var self = this;
		window.clearTimeout(self._timerPlayer);
		if (self._onSuspend) {
			self._onSuspend(event);
		}
	},
	pause: function() {
		var self = this;
		window.clearTimeout(self._timerPlayer);
		self._timerPlayer = null;
		var currentQuote = self.currentQuote();
		if (self._onPlay) {
			self._onPlay(currentQuote);
		}
	},
	next: function(event) {
		var self = this
		var previousQuote = self.currentQuote();
		var nextQuote = self.nextQuote(1);
		if (self._onNext) {
			self._onNext(nextQuote, previousQuote, event);
		}
	},
	nextDelayed: function(event) {
		var self = this;
		window.clearTimeout(self._timerPlayer);
		self._timerPlayer = window.setTimeout(function() {
			self.next(event);
		}, self._playedIntervall);
	},
	previous: function(event) {
		var self = this;
		var previousQuote = self.currentQuote();
		var nextQuote = self.nextQuote(-1);
		if (self._onPrevious) {
			self._onPrevious(nextQuote, previousQuote, event);
		}
	},
	onPlay: function(callback) {
		var self = this;
		self._onPlay = callback;
	},
	onResume: function(callback) {
		var self = this;
		self._onResume = callback;
	},
	onSuspend: function(callback) {
		var self = this;
		self._onSuspend = callback;
	},
	onPause: function(callback) {
		var self = this;
		self._onPause = callback;
	},
	onNext: function(callback) {
		var self = this;
		self._onNext = callback;
	},
	onPrevious: function(callback) {
		var self = this;
		self._onPrevious = callback;
	},
	onReady: function(callback) {
		var self = this;
		self._onReady = callback;
	},
	currentQuote: function() {
		var self = this;
		return self._playedQuotes[self._playedQuotesIndex];
	},
	nextQuote: function(offset) {
		var self = this;
		var index = Math.max(self._playedQuotesIndex + offset, 0);
		var quote = self._playedQuotes[index];
		if (QuotesData.size() > 0) {
			while (!quote) {
				var pickedQuote = QuotesData ? QuotesData.getRandomQuote() : null;
				if (pickedQuote) {
					self._playedQuotes.push(pickedQuote);
				} else {
					return null;
				}
				quote = self._playedQuotes[index];
			}
		}
		self._playedQuotesIndex = index;
		return quote;
	}
}