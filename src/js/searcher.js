QuotesSearcher = function() {
	this.type = 'QuotesSearcher';
	this.searchDelay = 100;
	this._timerSearch = null;
	this._onSearch = function(quote, searchTerm, searchTerms, event) {};
	this._onEmptySearch = function(searchTerm, searchTerms, event) {};
	this._onBeforeSearch = function(searchTerm, searchTerms, event) {};
	this._onAfterSearch = function(results, searchTerm, searchTerms, event) {};
};

QuotesSearcher.prototype = {
	setUp: function() {
	},
	search: function(text, event) {
		var self = this;
		window.clearTimeout(self._timerSearch);
		self._timerSearch = window.setTimeout(function() {
			self._search(text, event);
		}, self.searchDelay);		
	},
	_search: function(searchTerm, event) {
		var self = this;
		var searchTerms = self.searchTerms(searchTerm);
		if (searchTerms && searchTerms.length > 0) {
			if (self._onBeforeSearch) {
				//logger.log('debug', 'QuotesSearcher.onBeforeSearch', { 'searchTerm': searchTerm, 'searchTerms': searchTerms });
				self._onBeforeSearch(searchTerm, searchTerms, event);
			}
			var results = self.searchForTerms(searchTerms, function(quote) {
				if (self._onSearch) {
					//logger.log('debug', 'QuotesSearcher.onSearch', { 'searchTerm': searchTerm, 'searchTerms': searchTerms, 'quote': quote });
					self._onSearch(quote, searchTerm, searchTerms, event);
				}
			});
			if (!results || results.length == 0) {
				if (self._onEmptySearch) {
					//logger.log('debug', 'QuotesSearcher.onEmptySearch', { 'searchTerm': searchTerm, 'searchTerms': searchTerms, 'results': results });
					self._onEmptySearch(searchTerm, searchTerms, event);
				}
			}
			if (self._onAfterSearch) {
				//logger.log('debug', 'QuotesSearcher.onAfterSearch', { 'searchTerm': searchTerm, 'searchTerms': searchTerms, 'results': results });
				self._onAfterSearch(results, searchTerm, searchTerms, event);
			}
			return results;
		}
		return [];
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
			QuotesUI.database.eachQuote(function(index, quote) {
				if (self.matchesSearchTerms(searchTerms, quote)) {
					if (callback) {
						results.push(quote);
						callback(quote);
					}
				}
			});
		} 
		return results;
	},
	searchTerms: function(text) {
		return $.grep($((text || '').split(' ')).map(function(index, each) { return each.trimBlanks(); }).toArray(), function(substring) { return substring.length > 0; });

	},
	matchesSearchTerms: function (searchTerms, quote) {
		var self = this;
		var continueSearch = true;
		$(searchTerms).each(function(index, searchTerm) {
			if (continueSearch && !self.matchesSearchTerm(searchTerm, quote)) {
				continueSearch = false;
				return false;
			}
		});
		return continueSearch;
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