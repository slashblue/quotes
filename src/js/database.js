QuotesDatabase = function(path) {
	this._db = null;
	this._path = path,
	this._quotes = [];
	this._requests = [];
	this._lastChange = null;
	this._onBeforeLoad = function() {};
	this._onAfterLoad = function() {};
	this._onBeforeSave = function() {};
	this._onAfterSave = function() {};
	this._onChange = function(changes) {};
	this._onNew = function() {}
};

QuotesDatabase.prototype = {
	setUp: function() {
		var self = this;
		self.load();
	},
	load: function() {
		var self = this;
		self._db = low(self._path, { storage: require('lowdb/lib/file-async') });
		if (self._onBeforeLoad) {
			self._onBeforeLoad();
		}
		if (self._db && self._db.get) {
			self._quotes = Quotes.read(self._db.get('quotes').value());
			self._requests = self._db.get('requests').value() || self.newRequests();
			if (self._quotes.length == 0 || self._requests.length == 0) {
				if (self._onNew) {
					self._onNew();
					self._lastChange = (new Date()).getTime();
					self.save();
				}
			}
			self.migrate();
		} else {
			self._quotes = Quotes.create();
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
	newRequests: function() {
		return [];
	},
	migrate: function() {
		var self = this;
		var changes = [];
		self.eachQuote(function(index, quote) {
			if (quote.migrate()) {
				changes.push(quote);
			}
		});
		if (changes && changes.length > 0) {
			self.changed({ 'migrate': changes });
			self.save(null, null);
		}
	},
	eachQuote: function(callback) {
		var self = this;
		$(self.getQuotes()).each(function(index, each) {
			callback(index, each);
		});
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
				self._db.set('quotes', Quotes.write(self._quotes)).value();
				self._db.set('requests', (QuotesUI.fetcher ? QuotesUI.fetcher.getRequests() : [])).value();
				self._db.write();
				self._lastChange = null;
				if (self._onAfterSave) {
					self._onAfterSave();
				}
			}
		}
	},
	addQuote: function(quote, request, response) {
		var self = this;
		if (quote && quote.isValid()) {
			var existingQuote = self.matchingQuote(quote);
			if (existingQuote) {
				if (existingQuote.merge(quote)) {
					self.changed({ 'merge': [ existingQuote ] });
				}
			} else {
				self._quotes.push(quote);
				self.changed({ 'add': [ quote ] });
			}
		}
	},
	removeQuote: function(quote, event) {
		var self = this;
		if (quote) {
			self._quotes = $.grep(self._quotes, function(each) { return !(quote === each); });
			self.changed({ 'remove': [ quote ] });
		}
	},
	matchingQuote: function(quote) {
		var self = this;
		var found = null;
		self.eachQuote(function(index, each) {
			if (each.equals(quote)) {
				found = each;
			}
		});
		return found;
	},
	includesQuote: function(quote) {
		var self = this;
		return !!self.matchingQuote(quote);
	},
	getQuotes: function() {
		return this._quotes;
	},
	getRandomQuote: function() {
		var self = this;
		return self.getQuotes()[Math.floor(self.size() * Math.random())];
	},
	size: function() {
		var self = this;
		return self.getQuotes().length;
	}
}