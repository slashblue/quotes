/*
 * @requires external/lodash.min.js
 * @requires external/lowdb.min.js
 * @requires quote.js
 * @requires request.js
 */
 QuotesDatabase = function(path) {
	this.initialize(path);
	return this;
};

QuotesDatabase.prototype = {
	initialize: function(path) {
		this._type = 'QuotesDatabase';
		this.delaySave = 1 * 1000;
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
	},
	setUp: function() {
		this.load();
	},
	tearDown: function() {
		this.save();
		this.initialize(null);
	},
	load: function() {
		logger.log('info', 'QuotesDatabase.onLoad', { 'path': this._path });
		if (this._path) {
			this._db = low(this._path, { storage: require('lowdb/lib/file-async') });
			if (this._path && this._db && this._db.get) {
				try {
					if (this._onBeforeLoad) {
						logger.log('debug', 'QuotesDatabase.onBeforeLoad', { 'path': this._path });
						this._onBeforeLoad();
					}		
					try {
						this._load();
						if (this._quotes.length == 0) {
							this.new();
						} else {
							this.migrate();
							this.trim();
						}
					} catch (error) {
						logger.log('error', 'QuotesDatabase.onLoadError', { 'error': error, 'path': this._path });
						if (this._onLoadError) {
							this._onLoadError(error);
						}
					}
					if (this._onAfterLoad) {
						logger.log('debug', 'QuotesDatabase.onAfterLoad', { 'path': this._path });
						this._onAfterLoad();
					}
				} catch (error) {
					logger.log('error', 'QuotesDatabase.onLoadWrappedError', { 'error': error, 'path': this._path });
					if (this._onLoadError) {
						this._onLoadError(error);
					}
				}
			} else {
				logger.log('error', 'QuotesDatabase.onLoad', { 'path': this._path });
				this.empty();
			}	
		} else {
			logger.log('warn', 'QuotesDatabase.onLoad', { 'path': this._path });
			this.empty();
		}
		if (this._onReady) {
			logger.log('debug', 'QuotesDatabase.onReady');
			this._onReady();
		}
	},
	_load: function() {
		this._quotes = Quotes.read(this._db.get('quotes').value());
		this._requests = QuotesRequests.read(this._db.get('requests').value());
	},
	new: function() {
		logger.log('info', 'QuotesDatabase.onNew', { 'path': this._path });
		this.empty();
		if (this._onNew) {
			logger.log('debug', 'QuotesDatabase.onNew', { 'path': this._path });
			this._onNew();	
		}
		this.save();
	},
	empty: function() {
		logger.log('info', 'QuotesDatabase.onEmpty', { 'path': this._path });
		this._quotes = Quotes.create();
		this._requests = QuotesRequests.create();
		this.changed();
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
		var self = this;
		var changes = [];
		self.eachQuote(function(index, quote) {
			logger.log('debug', 'QuotesDatabase.onMigrate', { 'quote': quote, 'index': index });
			if (quote.migrate()) {
				changes.push(quote);
			}
		});
		
		if (changes && changes.length > 0) {
			logger.log('info', 'QuotesDatabase.onMigrate', { 'changes': changes });
			self.changed({ 'migrate': changes });
			self.save(null, null);
		}
	},
	trim: function() {
		var self = this;
		var changes = [];
		for (i = 0; i < self.getQuotes().length; i++) {
			var iQuote = self.getQuotes()[i];
			for (j = 0; j < self.getQuotes().length; j++) {
				var jQuote = self.getQuotes()[j];
				if (i != j && iQuote && jQuote && iQuote.equals(jQuote)) {
					logger.log('debug', 'QuotesDatabase.onTrim', { 'quote': jQuote, 'index': j });
					changes.push(jQuote);
				}
			}
		}
		for (k = 0; k < changes.length; k++) {
			self.removeQuote(changes[k]);
		}
		if (changes && changes.length > 0) {
			logger.log('info', 'QuotesDatabase.onTrim', { 'changes': changes });
			self.changed({ 'trim': changes });
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
		this._lastChange = $.timestamp();
		if (this._onChange) {
			logger.log('debug', 'QuotesDatabase.onChange', { 'changes': changes });
			this._onChange(changes);
		}
	},
	saveDelayed: function(request, response) {
		var self = this;
		logger.log('info', 'QuotesDatabase.onSaveDelayed', { 'path': self._path });
		window.clearTimeout(self._timerSave);
		self._timerSave = window.setTimeout(function() {
			self.save(request, response);
		}, self.delaySave);
	},
	save: function(request, response) {
		var self = this;
		logger.log('info', 'QuotesDatabase.onSave', { 'path': self._path });
		var lastChange = self._lastChange;
		if (lastChange) {
			if (self._db && self._db.set) {
				if (self._onBeforeSave) {
					logger.log('debug', 'QuotesDatabase.onBeforeSave');
					self._onBeforeSave();
				}
				self._save(request, response);
				self._db.write();
				if (self._onAfterSave) {
					logger.log('debug', 'QuotesDatabase.onAfterSave');
					self._onAfterSave();
				}
				if (lastChange == this._lastChange) {
					self._lastChange = null;
				}
			}
		}
	},
	_save: function(request, response) {
		var self = this;
		self._db.set('quotes', Quotes.write(self._quotes)).value();
		// TODO -> fetcherS
		self._db.set('requests', function(requests) {
			if (self._onWriteRequests) {
				self._onWriteRequests(requests);
			}
			return requests;
		}([])).value();
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
		var self = this;
		var found = null;
		self.eachQuote(function(index, each) {
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
	getRequests: function() {
		return this._requests;
	},
	getRandomQuote: function() {
		return this.getQuotes()[Math.floor(this.size() * Math.random())];
	},
	size: function() {
		return this.getQuotes().length;
	}
}