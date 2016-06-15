QuotesSearcher = function() {
	this._timerSearch = null;
	this._onSearch = function(quote, event) {};
	this._onEmptySearch = function(event) {};
	this._onBeforeSearch = function(event) {};
	this._onAfterSearch = function(results, event) {};
};

QuotesSearcher.prototype = {
	setUp: function() {
		var self = this;
		$('#searchText').on('keyup.quotes', function(event) {
			window.clearTimeout(self._timerSearch);
			self._timerSearch = window.setTimeout(function() {
				self.search(event);
			}, 100);	
		});
		$('#tab-search').on('click.quotes', function(event) {
			$('#searchText').focus();
		});
	},
	search: function(event) {
		var self = this;
		if (self._onBeforeSearch) {
			self._onBeforeSearch(event);
		}
		var results = self.searchForText($('#searchText').val(), function(quote) {
			if (self._onSearch) {
				self._onSearch(quote, event);
			}
		});
		if (!results || results.length == 0) {
			if (self._onEmptySearch) {
				self._onEmptySearch(event);
			}
		}
		if (self._onAfterSearch) {
			self._onAfterSearch(results, event);
		}
	},
	onSearch: function(callback) {
		var self = this;
		self._onSearch = callback;
	},
	onEmptySearch: function(callback) {
		var self = this;
		self._onEmptySearch = callback;
	},
	onAfterSearch: function(callback) {
		var self = this;
		self._onAfterSearch = callback;
	},
	onBeforeSearch: function(callback) {
		var self = this;
		self._onBeforeSearch = callback;
	},
	searchForText: function(text, callback) {
		var self = this;
		var results = [];
		if (text && text.trimBlanks()) {
			results = self.searchForTerms(self.searchTerms(text), callback);
		}
		return results;
	},
	searchForTerms: function(searchTerms, callback) {
		var self = this;
		var results = [];
		if (searchTerms && searchTerms.length > 0) {
			Quotes.database.each(function(key, quote) {
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
		var self = this;
		return $.grep($(text.split(' ')).map(function(index, each) { return each.trimBlanks(); }).toArray(), function(substring) { return substring.length > 0; });

	},	
	matchesSearchTerms: function (searchTerms, quote) {
		var self = this;
		var continueSearch = true;
		$(searchTerms).each(function(index, searchTerm) {
			if (continueSearch && !self.matchesSearchTerm(searchTerm, quote)) {
				continueSearch = false;
			}
		});
		return continueSearch;
	},
	matchesSearchTerm: function(searchTerm, quote) {
		var self = this;
		if (quote) {
			if (quote['quote'] && self.matchesSubstring(searchTerm, quote['quote'])) {
				return true;
			}
			if (quote['author'] && self.matchesSubstring(searchTerm, quote['author'])) {
				return true;
			}
			if (quote['source'] && self.matchesSubstring(searchTerm, quote['source'])) {
				return true;
			}
			if (quote['language'] && self.matchesSubstring(searchTerm, quote['language'])) {
				return true;
			}
			if (quote['keywords'] && $.grep(quote['keywords'], function(eachKeyword) { return self.matchesSubstring(searchTerm, eachKeyword); }).length > 0) {
				return true;
			}
		}
		return false;
	},
	matchesSubstring(searchTerm, text) {
		var self = this;
		return searchTerm && text && (text.indexOf(searchTerm) >= 0 || text.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0);
	}
};