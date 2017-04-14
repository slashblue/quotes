QuotesImporters = {
	import: function(database, importers, response, event) {
		if (database && response) {
			var path = response['path'];
			var data = response['data'];
			$(importers || []).each(function(index, each) {
				try {
					if (path && data && each.canImport(database, path, data, event)) {
						logger.log('debug', 'QuotesImporters.onImport', { 'path': path });
						each.import(database, path, data, event);
					}
				} catch (err) {
					logger.log('error', 'QuotesImporters.onImport', { 'path': path });
				}
			});
		}
	}
};

QuotesImporter = function() {
	this.initialize();
	return this;
}
QuotesImporter.prototype = {
	initialize: function() {
		this._onQuotes = function(json) { return []; };
		this._onQuote = function(quote) {};
	},
	canImport: function(database, path, data, event) {
		return false;
	},
	import: function() {

	},
	onQuotes: function(callback) {
		this._onQuotes = callback;
	},
	onQuote: function(callback) {
		this._onQuote = callback;
	}	
};


QuotesImporterJSON = function() {
	this.initialize();
	return this;
}
QuotesImporterJSON.prototype = {};
$.extend(QuotesImporterJSON.prototype, QuotesImporter.prototype, {
	canImport: function (database, path, data, event) {
		return this._onQuotes && this._onQuote && /\.json$/ig.test(path);
	},
	import: function(database, path, data, event) {
		var self = this;
		var quotes = self._onQuotes(JSON.parse(data));
		$(quotes).each(function(index, each) {
			self._onQuote(each);
		});
	}
});