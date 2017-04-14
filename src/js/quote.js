/*
 * @requires common.js
 */

 Quotes = {
	create: function() {
		return [];
	},
	read: function(array) {
		return $($.grep($(array || []), function(each) { return !!each; })).map(function(index, each) { return new Quote().fromJSON(each); }).toArray();
		
	},
	write: function(array) {
		return $($.grep($(array || []), function(each) { return !!each; })).map(function(index, each) { return each.forJSON(); }).toArray();
	}
};

Quote = function(text, author, keywords, source, language, timestamp, safe, url) {
	this._type = 'Quote';
	this.data = {};
	this.setText(text);
	this.setAuthor(author);
	this.setKeywords(keywords);
	this.setSource(source);
	this.setLanguage(language);
	this.setTimestamp(timestamp);
	this.setSafe(safe);
	this.setUrl(url);
	return this;
};

Quote.prototype = {
	setUp: function() {
	},
	setText: function(text) {
		this.data['text'] = text;
		this.data['hashCode'] = $.hashCode(text);
	},
	getText: function() {
		return this.data['text'];
	},
	setAuthor: function(author) {
		this.data['author'] = author;
	},
	getAuthor: function() {
		return this.data['author'];
	},
	setKeywords: function(keywords) {
		this.data['keywords'] = keywords || [];
	},
	getKeywords: function() {
		return this.data['keywords'];
	},
	setSource: function(source) {
		this.data['source'] = source;
	},
	getSource: function() {
		return this.data['source'];
	},
	setLanguage: function(language) {
		this.data['language'] = language;
	},
	getLanguage: function() {
		return this.data['language'];
	},
	setTimestamp: function(timestamp) {
		this.data['timestamp'] = timestamp || $.timestamp();
	},
	getTimestamp: function() {
		return this.data['timestamp'];
	},
	getHashCode: function() {
		return this.data['hashCode'];
	},
	getSafe: function() {
		return this.data['safe'];
	},
	setSafe: function(safe) {
		this.data['safe'] = !!safe;
	},
	getUrl: function() {
		return this.data['url'];
	},
	setUrl: function(url) {
		this.data['url'] = url;
	},
	getDomain: function() {
		if (this.getUrl()) {
			return this.getUrl().replace(/http(s)?:\/\//, '').split('/')[0];
		}
		return '';
	},
	addKeyword: function(keyword) {
		if (keyword) {
			var trimmedKeyword = keyword.trimBlanks();
			if (trimmedKeyword) {
				if (!this.includesKeyword(trimmedKeyword)) {
					this.getKeywords().push(trimmedKeyword);
				}
			}
		}
	},
	removeKeyword: function(keyword) {
		var self = this;
		self.setKeywords($.grep(self.getKeywords(), function(each) { return each != keyword; }));
	},
	eachKeyword: function(callback) {
		var self = this;
		$(self.getKeywords()).each(function(index, each) {
			callback(index, each);
		});
	},
	includesKeyword: function(keyword) {
		var self = this;
		var found = false;
		self.eachKeyword(function(index, each) {
			if (!found && keyword == each || $.normalize(keyword) == $.normalize(each)) {
				found = true;
			}
		});
		return found;
	},
	equals: function(quote) {
		return this._type == quote._type
				&& (this === quote 
					|| this == quote 
					|| this.getHashCode() == quote.getHashCode()
					|| (this.getText() == quote.getText() && this.getAuthor() == quote.getAuthor()));
	},
	isValid: function() {
		return this.data['text'] 
				&& typeof this.data['text'] == 'string' 
				&& this.data['text'].trimBlanks() 
				&& this.getHashCode();
	},
	migrate: function() {
		var changed = false;
		// migrate quote
		var oldText = this.getText();
		var newText = $.normalize(oldText);
		if (oldText != newText) {
			this.setText(newText);
			changed = true;
		}
		// migrate safe state
		var oldUnsafe = this.getSafe();
		var newUnsafe = !!oldUnsafe;
		if (oldUnsafe != newUnsafe) {
			this.setSafe(newUnsafe);
			changed = true;
		}
		// migrate keywords
		var oldKeywords = this.getKeywords() || [];
		var newKeywords = $.grep(oldKeywords, function(keyword) { return keyword && $.normalize(keyword); });
		if (oldKeywords.length != newKeywords.length) {
			this.setKeywords(newKeywords);
			changed = true;
		}
		return changed;
	},
	merge: function(quote) {
		var merged = false;
		var existingData = this.data;
		var newData = quote.data;
		for (key in newData) {
			if (newData.hasOwnProperty(key) && key != 'timestamp') {
				var existingValue = existingData[key];
				var newValue = newData[key];
				if (newValue && newValue != existingValue) {
					if (typeof newValue === 'object') {
						if (!$.isSameArray(newValue, existingValue)) {
							var newValueMerged = $.unique((newValue || []).concat((existingValue || []))).sort();
							if (newValueMerged != existingValue || !$.isSameArray(newValueMerged, existingValue)) {
								existingData[key] = newValueMerged;
								merged = true;
							}
						}
					} else {
						existingData[key] = newValue;
						merged = true;
					}
				}
			}
		}
		if (merged) {
			existingData['hashCode'] = $.hashCode(existingData['text']);
			existingData['timestamp'] = newData['timestamp'];
		}
		return merged;
	},
	change: function() {
		this.setTimestamp($.timestamp());
	},
	matchesSearchTerm: function(callback) {
		if (this.getText() && callback(this.getText())) {
			return true;
		}
		if (this.getAuthor() && callback(this.getAuthor())) {
			return true;
		}
		if (this.getSource() && callback(this.getSource())) {
			return true;
		}
		if (this.getLanguage() && callback(this.getLanguage())) {
			return true;
		}
		if (this.getKeywords() && $.grep(this.getKeywords(), function(eachKeyword) { return callback(eachKeyword); }).length > 0) {
			return true;
		}
		if (this.getUrl() && callback(this.getUrl())) {
			return true;
		}
		return false;
	},
	fromJSON(data) {
		this.data = data;
		return this;
	},
	forJSON() {
		return this.data;
	},
	toString() {
		var text = this.getText();
		if (this.getAuthor()) {
			text = text + ' (' + this.getAuthor() + ')'
		}
		return text;
	}
};