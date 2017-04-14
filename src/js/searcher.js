/*
 * @requires quote.js
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
		this._onSearch = function(quote, searchFilters, event) {};
		this._onEmptySearch = function(searchFilters, event) {};
		this._onBeforeSearch = function(searchFilters, event) {};
		this._onAfterSearch = function(results, searchFilters, event) {};
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
	_search: function(rawSearchFilters, event) {
		var self = this;
		var searchResults = [];
		var searchFilters = self._searchFilters(rawSearchFilters);
		if (searchFilters && searchFilters.length > 0) {
			if (self._onBeforeSearch) {
				logger.log('debug', 'QuotesSearcher.onBeforeSearch', {  });
				self._onBeforeSearch(searchFilters, event);
			}
			searchResults = self._searchWithFilters(searchFilters, function(quote) {
				if (self._onSearch) {
					logger.log('debug', 'QuotesSearcher.onSearch', { 'quote': quote });
					self._onSearch(quote, searchFilters, event);
				}
			});
			if (!searchResults || searchResults.length == 0) {
				if (self._onEmptySearch) {
					logger.log('debug', 'QuotesSearcher.onEmptySearch', { 'searchResults': searchResults });
					self._onEmptySearch(searchFilters, event);
				}
			}
			if (self._onAfterSearch) {
				logger.log('debug', 'QuotesSearcher.onAfterSearch', { 'searchResults': searchResults });
				self._onAfterSearch(searchResults, searchFilters, event);
			}
		} else {
			
			//if (!searchTerm.trimBlanks()) {
				if (self._onBeforeSearch) {
					logger.log('debug', 'QuotesSearcher.onBeforeSearch', { 'searchResults': searchResults });
					self._onBeforeSearch(searchFilters, event);
				}
				if (self._onEmptySearch) {
					logger.log('debug', 'QuotesSearcher.onEmptySearch', { 'searchResults': searchResults });
					self._onEmptySearch(searchFilters, event);
				}
				if (self._onAfterSearch) {
					logger.log('debug', 'QuotesSearcher.onAfterSearch', { 'searchResults': searchResults });
					self._onAfterSearch(searchResults, searchFilters, event);
				}
			//}
			
		}
		return searchResults;
	},
	_searchFilters: function(rawSearchFilters) {
		var searchFilters = [];
		if (rawSearchFilters) {
			$(rawSearchFilters).each(function(index, each) {
				if (each.canMatch()) {
					searchFilters.push(each);
				}
			})
		}
		return searchFilters;
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
	_searchWithFilters: function(searchFilters, callback) {
		var self = this;
		var results = [];
		if (self._onEach) {
			self._onEach(function(index, quote) {
				if (self._matchesSearchFilters(searchFilters, quote)) {
					if (callback) {
						results.push(quote);
						callback(quote);
					}
				}
			});
		} 
		return results;
	},
	_matchesSearchFilters: function (searchFilters, quote) {
		return $.allSatisfy(searchFilters, function(index, each) {
			return each.isMatch(quote);
		});
	}
};