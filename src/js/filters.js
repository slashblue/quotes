QuoteFilters = function() {
	this.initialize();
	return this;
};
QuoteFilters.prototype = {
	initialize: function() {
		this.filters = [];
	},
	addFilter: function(filter) {
		if (filter) {
			this.filters = $.grep(this.filters, function(each) { return each.id != filter.id });
			this.filters.push(filter);
		}
	},
	removeFilter: function(filter) {
		if (filter) {
			this.filters = $.grep(this.filters, function(each) { return each !== filter });
		}
	},
	getFilters: function() {
		return this.filters;
	}
};

QuotesFilterDefault = function() {
	this.id = 'Default';
	return this;
};
QuotesFilterDefault.prototype = {
	canMatch: function() {
		return false;
	},
	isMatch: function(quote) {
		return false;
	}
}

QuotesFilterLanguage = function(language) {
	this.initialize(language);
	return this;
};
QuotesFilterLanguage.prototype = {};
$.extend(QuotesFilterLanguage.prototype, QuotesFilterDefault.prototype, {
	initialize: function(language) {
		this.id = 'Language';
		this.language = language;
	},
	canMatch: function() {
		return this.language && this.language.length > 0;
	},
	isMatch: function(quote) {
		return quote.matchesLanguage(this.language);
	}
});

QuotesFilterKeyword = function(keyword) {
	this.initialize(keyword);
	return this;
};
QuotesFilterKeyword.prototype = {};
$.extend(QuotesFilterKeyword.prototype, QuotesFilterDefault.prototype, {
	initialize: function(keyword) {
		this.id = keyword;
		this.keyword = keyword;
	},
	canMatch: function() {
		return this.keyword && this.keyword.length > 0;
	},
	isMatch: function(quote) {
		return quote.matchesKeyword(this.keyword);
	}
});	

QuotesFilterFullText = function(searchTerm, minLength) {
 	this.initialize(searchTerm, minLength);
	return this;
};

QuotesFilterFullText.prototype = {};
$.extend(QuotesFilterFullText.prototype, QuotesFilterDefault.prototype, {
	initialize: function(searchTerm, minLength) {
		this.id = 'FullText';
		this.searchTerm = searchTerm;
		this.searchTerms = this._searchTerms(searchTerm);
		this.minLength = minLength || 3;
	},
	_searchTerms: function(text) {
		return $.grep($((text || '').trimBlanks().split(' ')).map(function(index, each) { return each.trimBlanks(); }).toArray(), function(substring) { return substring.length > 0; });
	},
	canMatch: function() {
		var minLength = this.minLength;
		return this.searchTerm && this.searchTerm.length >= minLength && this.searchTerms && this.searchTerms.length > 0 && $.anySatisfy(this.searchTerms, function(index, each) { return each.length >= minLength; });
	},
	isMatch: function(quote) {
		var self = this;
		return quote && $.allSatisfy(self.searchTerms, function(index, searchTerm) {
			return quote.matchesSearchTerm(function(text) {
				return self._matchesSubstring(searchTerm, text);
			});
		});
	},
	_matchesSubstring(searchTerm, text) {
		return searchTerm && text && (text.indexOf(searchTerm) >= 0 || text.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0);
	}
});