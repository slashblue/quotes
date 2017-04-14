/*
 * @requires quote.js
 */

QuotesExporter = function() {
	return this;
}
QuotesExporter.prototype = {
	export: function(quotes) {
		return "";
	}
};


QuotesExporterCSV = function() {
	return this;
}
QuotesExporterCSV.prototype = {};
$.extend(QuotesExporterCSV.prototype, QuotesExporter.prototype, {
	export: function(quotes) {
		var self = this;
		var csv = "";
		$(quotes).each(function(index, each) {
			if(each) {
				csv = csv + self._exportRow(self._row(each));
			}
		});
		return csv;
	},
	_row: function(quote) {
		return [ quote.getText(), quote.getAuthor(), quote.getLanguage(), quote.getSource(), quote.getUrl(), "" + quote.getSafe(), this._list(quote.getKeywords()) ];
	},
	_list: function(array) {
		var list = "";
		$(array).each(function(index, each) {
			if (index != 0) {
				list = list + ", ";
			}
			list = list + each;
		});
		return list;
	},
	_exportRow: function(columns) {
		var self = this;
		var row = "\n";
		$(columns).each(function(index, each) {
			row = row + self._exportColumn(each);
		});
		return row;
	},
	_exportColumn: function(column) {
		return "\"" + (column || "").replace("\"", "\\\"") + "\";";
	}
});