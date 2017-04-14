/*
 * @requires quote.js
 */

QuotesHistory = function() {
 	this.initialize();
};

QuotesHistory.prototype = {
	initialize: function() {
		this._type = 'QuotesHistory';
		this._onRefresh = function() {};
		this._onQuote = function(quote) {};
		this._onBeforeQuote = function(timestamp, quote) {};
		this._lastPage = 0;
		this._lastTimestamp = null;
		this.quotes = [];
		this.size = 10;
	},
	setUp: function() {
	},
	tearDown: function() {
		this.quotes = [];
		this._lastPage = 0;
	},
	onRefresh: function(callback) {
		this._onRefresh = callback;
	},
	onQuote: function(callback) {
		this._onQuote = callback;
	},
	onBeforeQuote: function(callback) {
		this._onBeforeQuote = callback;
	},
	refresh: function() {
		var self = this;
		self._lastPage = 0;
		self._lastTimestamp = null;
		if (self._onRefresh) {
			self.quotes = self._onRefresh() || [];
		}
		self.quotes.sort(function(quote1, quote2) {
			return (quote2.getTimestamp() || 0) - (quote1.getTimestamp() || 0);
		});
		self.showMore();
	},
	showMore: function() {
		var self = this;
		var nextIndex = self._lastPage + self.size;
		var lastQuotes = self.quotes.slice(self._lastPage, nextIndex);
		$(lastQuotes).each(function(index, each) {
			var nextTimestamp = (new Date(each.getTimestamp())).toLocaleDateString();
			if (self._lastTimestamp != nextTimestamp) {
				if (self._onBeforeQuote) {
					self._onBeforeQuote(nextTimestamp, each);
				}
			}
			if (self._onQuote) {
				self._onQuote(each);
			}
			self._lastTimestamp = nextTimestamp;
		});
		self._lastPage = nextIndex;
	}
};