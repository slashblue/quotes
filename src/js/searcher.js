/*
 * @requires database.js
 */

 QuotesSearcher = function() {
	this.initialize();
	return this;
};

QuotesSearcher.prototype = {
	initialize: function() {
		this._type = 'QuotesSearcher';
		this.searchDelay = 100;
		this._timerSearch = null;
		this._onEach = function(index, quote) {};
		this._onSearch = function(quote, searchTerm, searchTerms, event) {};
		this._onEmptySearch = function(searchTerm, searchTerms, event) {};
		this._onBeforeSearch = function(searchTerm, searchTerms, event) {};
		this._onAfterSearch = function(results, searchTerm, searchTerms, event) {};
		this.lastSearchResults = [];
	},
	setUp: function() {
	},
	tearDown: function() {
		window.clearTimeout(this._timerSearch);
		this.initialize();
	},
	search: function(text, event) {
		var self = this;
		window.clearTimeout(self._timerSearch);
		self._timerSearch = window.setTimeout(function() {
			self.lastSearchResults = self._search(text, event);
		}, self.searchDelay);		
	},
	_search: function(searchTerm, event) {
		var self = this;
		var searchTerms = self.searchTerms(searchTerm);
		var searchResults = [];
		if (self.hasSearch(searchTerms)) {
			if (self._onBeforeSearch) {
				logger.log('debug', 'QuotesSearcher.onBeforeSearch', { 'searchTerm': searchTerm, 'searchTerms': searchTerms });
				self._onBeforeSearch(searchTerm, searchTerms, event);
			}
			searchResults = self.searchForTerms(searchTerms, function(quote) {
				if (self._onSearch) {
					logger.log('debug', 'QuotesSearcher.onSearch', { 'searchTerm': searchTerm, 'searchTerms': searchTerms, 'quote': quote });
					self._onSearch(quote, searchTerm, searchTerms, event);
				}
			});
			if (!searchResults || searchResults.length == 0) {
				if (self._onEmptySearch) {
					logger.log('debug', 'QuotesSearcher.onEmptySearch', { 'searchTerm': searchTerm, 'searchTerms': searchTerms, 'searchResults': searchResults });
					self._onEmptySearch(searchTerm, searchTerms, event);
				}
			}
			if (self._onAfterSearch) {
				logger.log('debug', 'QuotesSearcher.onAfterSearch', { 'searchTerm': searchTerm, 'searchTerms': searchTerms, 'searchResults': searchResults });
				self._onAfterSearch(searchResults, searchTerm, searchTerms, event);
			}
		} else {
			if (!searchTerm.trimBlanks()) {
				if (self._onBeforeSearch) {
					logger.log('debug', 'QuotesSearcher.onBeforeSearch', { 'searchTerm': searchTerm, 'searchTerms': searchTerms, 'searchResults': searchResults });
					self._onBeforeSearch(searchTerm, searchTerms, event);
				}
				if (self._onEmptySearch) {
					logger.log('debug', 'QuotesSearcher.onEmptySearch', { 'searchTerm': searchTerm, 'searchTerms': searchTerms, 'searchResults': searchResults });
					self._onEmptySearch(searchTerm, searchTerms, event);
				}
				if (self._onAfterSearch) {
					logger.log('debug', 'QuotesSearcher.onAfterSearch', { 'searchTerm': searchTerm, 'searchTerms': searchTerms, 'searchResults': searchResults });
					self._onAfterSearch(searchResults, searchTerm, searchTerms, event);
				}
			}
		}
		return searchResults;
	},
	hasSearch: function(searchTerms) {
		return searchTerms && searchTerms.length > 0 && $.anySatisfy(searchTerms, function(index, each) { return each.length >= 3; });
	},
	onEach: function(callback) {
		this._onEach = callback;
	},
	onSearch: function(callback) {
		this._onSearch = callback;
	},
	onEmptySearch: function(callback) {
		this._onEmptySearch = callback;
	},
	onAfterSearch: function(callback) {
		this._onAfterSearch = callback;
	},
	onBeforeSearch: function(callback) {
		this._onBeforeSearch = callback;
	},
	searchForTerms: function(searchTerms, callback) {
		var self = this;
		var results = [];
		if (searchTerms && searchTerms.length > 0) {
			if (self._onEach) {
				self._onEach(function(index, quote) {
					if (self.matchesSearchTerms(searchTerms, quote)) {
						if (callback) {
							results.push(quote);
							callback(quote);
						}
					}
				});
			}
		} 
		return results;
	},
	searchTerms: function(text) {
		return $.grep($((text || '').split(' ')).map(function(index, each) { return each.trimBlanks(); }).toArray(), function(substring) { return substring.length > 0; });

	},
	matchesSearchTerms: function (searchTerms, quote) {
		var self = this;
		return $.allSatisfy(searchTerms, function(index, each) {
			return self.matchesSearchTerm(each, quote);
		});
	},
	matchesSearchTerm: function(searchTerm, quote) {
		var self = this;
		if (quote) {
			return quote.matchesSearchTerm(function(text) {
				return self.matchesSubstring(searchTerm, text);
			});
		}
		return false;
	},
	matchesSubstring(searchTerm, text) {
		return searchTerm && text && (text.indexOf(searchTerm) >= 0 || text.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0);
	}
};