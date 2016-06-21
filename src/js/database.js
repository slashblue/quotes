QuotesDatabase = function(path) {
	this.type = 'QuotesDatabase';
	this._db = null;
	this._path = path,
	this._quotes = [];
	this._requests = [];
	this._lastChange = null;
	this._timerSave = null;
	this._onBeforeLoad = function() {};
	this._onAfterLoad = function() {};
	this._onBeforeSave = function() {};
	this._onAfterSave = function() {};
	this._onChange = function(changes) {};
	this._onLoadError = function(error) {};
	this._onReady = function() {};
	this._onNew = function() {};
	this._onWriteRequests = function(requests) {};
};

QuotesDatabase.prototype = {
	setUp: function() {
		this.load();
	},
	load: function() {
		logger.log('debug', 'QuotesDatabase.onLoad', { 'path': this._path });
		if (this._path) {
			this._db = low(this._path, { storage: require('lowdb/lib/file-async') });
			if (this._path && this._db && this._db.get) {
				if (this._onBeforeLoad) {
					logger.log('debug', 'QuotesDatabase.onBeforeLoad', { 'path': this._path });
					this._onBeforeLoad();
				}		
				this._load();
				if (this._onAfterLoad) {
					logger.log('debug', 'QuotesDatabase.onAfterLoad', { 'path': this._path });
					this._onAfterLoad();
				}
			} else {
				logger.log('error', 'QuotesDatabase.onLoad', { 'path': this._path });
				this._quotes = Quotes.create();
				this._requests = QuotesRequests.create();
			}	
		} else {
			logger.log('warn', 'QuotesDatabase.onLoad', { 'path': this._path });
			this._quotes = Quotes.create();
			this._requests = QuotesRequests.create();
		}
		if (this._onReady) {
			logger.log('debug', 'QuotesDatabase.onReady');
			this._onReady();
		}
	},
	_load: function() {
		try {
			logger.log('debug', 'QuotesDatabase.onLoad', { 'path': this._path });
			this._quotes = Quotes.read(this._db.get('quotes').value());
			this._requests = QuotesRequests.read(this._db.get('requests').value());
			if (this._quotes.length == 0 || this._requests.length == 0) {
				if (this._onNew) {
					logger.log('debug', 'QuotesDatabase.onNew', { 'path': this._path });
					this._onNew();
					this._lastChange = $.timestamp();
					this.save();
				}
			}
			this.migrate();
		} catch (error) {
			logger.log('error', 'QuotesDatabase.onLoadError', { 'error': error, 'path': this._path });
			if (this._onLoadError) {
				this._onLoadError(error);
			}
		}
	},
	onChange: function(callback) {
		this._onChange = callback;
	},
	onBeforeLoad: function(callback) {
		this._onBeforeLoad = callback;
	},
	onAfterLoad: function(callback) {
		this._onAfterLoad = callback;
	},
	onBeforeSave: function(callback) {
		this._onBeforeSave = callback;
	},
	onAfterSave: function(callback) {
		this._onAfterSave = callback;
	},
	onLoadError: function(callback) {
		this._onLoadError = callback; 
	},
	onReady: function(callback) {
		this._onReady = callback; 
	},
	onWriteRequests: function(callback) {
		this._onWriteRequests = callback; 
	},
	migrate: function() {
		var changes = [];
		this.eachQuote(function(index, quote) {
			logger.log('debug', 'QuotesDatabase.onMigrate', { 'quote': quote, 'index': index });
			if (quote.migrate()) {
				changes.push(quote);
			}
		});
		if (changes && changes.length > 0) {
			this.changed({ 'migrate': changes });
			this.save(null, null);
		}
	},
	eachQuote: function(callback) {
		$(this.getQuotes()).each(function(index, each) {
			callback(index, each);
		});
	},
	changed: function(changes) {
		this._lastChange = $.timestamp();
		if (this._onChange) {
			logger.log('debug', 'QuotesDatabase.onChange', { 'changes': changes });
			this._onChange(changes);
		}
	},
	saveDelayed: function(request, response) {
		var self = this;
		window.clearTimeout(self._timerSave);
		self._timerSave = window.setTimeout(function() {
			self.save(request, response);
		}, 1 * 1000);
	},
	save: function(request, response) {
		if (this._lastChange) {
			if (this._db && this._db.set) {
				if (this._onBeforeSave) {
					logger.log('debug', 'QuotesDatabase.onBeforeSave');
					this._onBeforeSave();
				}
				this._db.set('quotes', Quotes.write(this._quotes)).value();
				// TODO -> fetcherS
				this._db.set('requests', function(requests) {
					if (this._onWriteRequests) {
						this._onWriteRequests(requests);
					}
					return requests;
				}([])).value();
				this._db.write();
				this._lastChange = null;
				if (this._onAfterSave) {
					logger.log('debug', 'QuotesDatabase.onAfterSave');
					this._onAfterSave();
				}
			}
		}
	},
	addQuote: function(quote, request, response) {
		if (quote && quote.isValid()) {
			var existingQuote = this.matchingQuote(quote);
			if (existingQuote) {
				if (existingQuote.merge(quote)) {
					this.changed({ 'merge': [ existingQuote ] });
				}
			} else {
				this._quotes.push(quote);
				this.changed({ 'add': [ quote ] });
			}
		}
	},
	removeQuote: function(quote, event) {
		if (quote) {
			this._quotes = $.grep(this._quotes, function(each) { return !(quote === each); });
			this.changed({ 'remove': [ quote ] });
		}
	},
	matchingQuote: function(quote) {
		var found = null;
		this.eachQuote(function(index, each) {
			if (!found && each.equals(quote)) {
				found = each;
				return false;
			}
		});
		return found;
	},
	includesQuote: function(quote) {
		return !!this.matchingQuote(quote);
	},
	getQuotes: function() {
		return this._quotes;
	},
	getRandomQuote: function() {
		return this.getQuotes()[Math.floor(this.size() * Math.random())];
	},
	size: function() {
		return this.getQuotes().length;
	}
}