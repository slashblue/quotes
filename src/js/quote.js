Quote = function(text, author, keywords, source, language, timestamp) {
	this.type = 'quote';
	this.data = {};
	this.setText(text);
	this.setAuthor(author)
	this.setKeywords(keywords)
	this.setSource(source)
	this.setLanguage(language)
	this.setTimestamp(timestamp);
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
	addKeyword: function(keyword) {
		var self = this;
		if (keyword) {
			var trimmedKeyword = keyword.trimBlanks();
			if (trimmedKeyword) {
				if (!self.includesKeyword(trimmedKeyword)) {
					self.getKeywords().push(trimmedKeyword);
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
			callback(each);
		});
	},
	includesKeyword: function(keyword) {
		var self = this;
		var found = false;
		self.eachKeyword(function(each) {
			if (!found && keyword == each) {
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
		return this.data['text'] && typeof this.data['text'] == 'string' && this.data['text'].trimBlanks() && this.getHashCode();
	}
};