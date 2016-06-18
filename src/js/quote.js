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

Quote = function(text, author, keywords, source, language, timestamp, safe) {
	this.type = 'quote';
	this.data = {};
	this.setText(text);
	this.setAuthor(author);
	this.setKeywords(keywords);
	this.setSource(source);
	this.setLanguage(language);
	this.setTimestamp(timestamp);
	this.setSafe(safe);
};

Quote.prototype = {
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
		return this.type == quote.type
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
		var self = this;
		var changed = false;
		// migrate quote
		var oldText = self.getText();
		var newText = $.normalize(oldText);
		if (oldText != newText) {
			self.setText(newText);
			changed = true;
		}
		// migrate safe state
		var oldUnsafe = self.getSafe();
		var newUnsafe = !!oldUnsafe;
		if (oldUnsafe != newUnsafe) {
			self.setSafe(newUnsafe);
			changed = true;
		}
		// migrate keywords
		var oldKeywords = self.getKeywords() || [];
		var newKeywords = $.grep(oldKeywords, function(keyword) { return keyword && $.normalize(keyword); });
		if (oldKeywords.length != newKeywords.length) {
			self.setKeywords(newKeywords);
			changed = true;
		}
		return changed;
	},
	merge: function(quote) {
		var self = this;
		var merged = false;
		var existingData = self.data;
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
		var self = this;
		if (self.getText() && callback(self.getText())) {
			return true;
		}
		if (self.getAuthor() && callback(self.getAuthor())) {
			return true;
		}
		if (self.getSource() && callback(self.getSource())) {
			return true;
		}
		if (self.getLanguage() && callback(self.getLanguage())) {
			return true;
		}
		if (self.getKeywords() && $.grep(self.getKeywords(), function(eachKeyword) { return callback(eachKeyword); }).length > 0) {
			return true;
		}
		return false;
	},
	fromJSON(data) {
		this.data = data;
	},
	forJSON() {
		return this.data;
	}
};