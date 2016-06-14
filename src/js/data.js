QuotesDatabase = function() {
	this._db = null;
	this._quotes = {};
	this._requests = [];
	this._lastChange = null;
	this._onBeforeLoad = function() {};
	this._onAfterLoad = function() {};
	this._onBeforeSave = function() {};
	this._onAfterSave = function() {};
	this._onChange = function(changes) {};
};

QuotesDatabase.prototype = {
	setUp: function() {
		var self = this;
		self.load();
	},
	load: function() {
		var self = this;
		self._db = low('./data/db.json', { storage: require('lowdb/lib/file-async') });
		if (self._onBeforeLoad) {
			self._onBeforeLoad();
		}
		if (self._db && self._db.get) {
			self._quotes = self._db.get('quotes').value() || self.newQuotes();
			self._requests = self._db.get('requests').value() || self.newRequests();
			self.migrate();
			self.cache();
		} else {
			self._quotes = self.newQuotes();
		}
		if (self._onAfterLoad) {
			self._onAfterLoad();
		}
	},
	onChange: function(callback) {
		var self = this;
		self._onChange = callback;
	},
	onBeforeLoad: function(callback) {
		var self = this;
		self._onBeforeLoad = callback;
	},
	onAfterLoad: function(callback) {
		var self = this;
		self._onAfterLoad = callback;
	},
	onBeforeSave: function(callback) {
		var self = this;
		self._onBeforeSave = callback;
	},
	onAfterSave: function(callback) {
		var self = this;
		self._onAfterSave = callback;
	},
	newQuotes: function() {
		return {};
	},
	newRequests: function() {
		return [];
	},
	each: function(callback) {
		var self = this;
		for (key in self._quotes) {
			if (self._quotes.hasOwnProperty(key) && callback) {
				callback(self._quotes[key]);
			}
		}
	},	
	migrate: function() {
		var self = this;
		var changed = false;
		var changes = [];
		self.each(function(quote) {
			// migrate quote
			var oldText = quote['quote'];
			var newText = $.normalize(quote['quote']);
			var migrated = false;
			if (oldText != newText) {
				quote['quote'] = newText;
				migrated = true;
				changed = true;
			}
			// migrate safe state
			var oldUnsafe = quote['unsafe'];
			var newUnsafe = !!oldUnsafe;
			if (oldUnsafe != newUnsafe) {
				quote['unsafe'] = newUnsafe;
				migrated = true;
				changed = true;
			}
			// migrate keywords
			var oldKeywords = quote['keywords'] || [];
			var newKeywords = $.grep(oldKeywords, function(keyword) { return keyword && $.normalize(keyword); });
			if (oldKeywords.length != newKeywords.length) {
				quote['keywords'] = newKeywords;
				migrated = true;
				changed = true;
			}
			if (migrated) {
				changes.push(quote);
			}
		});
		if (changed) {
			self.changed({ 'migrate': changes });
			self.save(null, null);
		}
	},
	changed: function(changes) {
		var self = this;
		self._lastChange = (new Date()).getTime();
		if (self._onChange) {
			self._onChange(changes);
		}
	},
	save: function(request, response) {
		var self = this;
		if (self._lastChange) {
			if (self._db && self._db.set) {
				if (self._onBeforeSave) {
					self._onBeforeSave();
				}
				self._db.set('quotes', self._quotes).value();
				self._db.set('requests', (Quotes.fetcher ? Quotes.fetcher.getRequests() : [])).value();
				self._db.write();
				self._lastChange = null;
				if (self._onAfterSave) {
					self._onAfterSave();
				}
			}
		}
	},
	storeQuote: function(quote, request, response) {
		var self = this;
		if (quote && quote['quote']) {
			var hash = self.hash(quote['quote']);
			var existingQuote = self._quotes[hash];
			if (!existingQuote) {
				self._quotes[hash] = quote;
				self.cacheQuote(quote);
				self.changed({ 'new': [ quote ] });
			} else {
				if (self.merge(existingQuote, quote)) {
					self.changed({ 'merge': [ quote ] });
				}
			}
		}		
	},
	cache: function() {
		var self = this;
		if (self._quotes) {
			self._cache = {};
			self.each(function() {
				self.cacheQuote(self._quotes[key]);
			});
		}
	},
	cacheQuote: function(quote) {
		var self = this;
		if (quote) {
			// fill authors
			if (!self._cache.hasOwnProperty('authors')) {
				self._cache['authors'] = {};
			}
			if (!self._cache['authors'].hasOwnProperty(quote['author'])) {
				self._cache['authors'][quote['author']] = [];
			}
			self._cache['authors'][quote['author']].push(quote);
			// fill keywords
			if (!self._cache.hasOwnProperty('keywords')) {
				self._cache['keywords'] = {};
			}
			$(quote['keywords'] || []).each(function(index, each) {
				if (!self._cache['keywords'].hasOwnProperty(each)) {
					self._cache['keywords'][each] = [];
				}
				self._cache['keywords'][each].push(quote);
			});
		}
	},
	getQuotes: function() {
		var self = this;
		var quotes = [];
		self.each(function(each) {
			quotes.push(each);
		});
		return quotes;
	},
	getRandomQuote: function() {
		var self = this;
		var keys = Object.keys(self._quotes);
		return self._quotes[keys[Math.floor(keys.length * Math.random())]];
	},
	hash: function(string) {
		return (string || '').replace(/[^a-z0-9]/, '').toLowerCase().hashCode();
	},
	merge: function(existingObject, newObject) {
		var self = this;
		for (key in newObject) {
			if (newObject && newObject.hasOwnProperty(key) && key != 'timestamp') {
				var existingValue = existingObject[key];
				var newValue = newObject[key];
				if (newValue != existingValue) {
					if (newValue) {
						if (typeof newValue === 'object') {
							if (!$.isSameArray(newValue, existingValue)) {
								var newValueMerged = $.unique((newValue || []).concat((existingValue || []))).sort();
								if (newValueMerged != existingValue || !$.isSameArray(newValueMerged, existingValue)) {
									existingObject[key] = newValueMerged;
									existingObject['timestamp'] = newObject['timestamp'];
									console.log([ 'Merge', newValueMerged, existingValue ] );
									return true;
								}
							}
						} else {
							if (newValue) {
								existingObject[key] = newValue;
								existingObject['timestamp'] = newObject['timestamp'];
								return true;
							}
						}
					}
				}
			}
		}
		return false;
	},
	size: function() {
		var self = this;
		var length = 0;
		self.each(function() {
			length++;
		});
		return length;
	}
}