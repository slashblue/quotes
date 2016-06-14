Quotes = {
	_playedQuotes: [],
	_playedQuotesIndex: -1,
	_playedIntervall: 10 * 1000,
	_timerPlayer: null,
	setUp: function() {
		var self = this;
		QuotesData.onChange(function() {
			self.updateStats();
		});
		QuotesData.onAfterLoad(function() {
			self.updateStats();
			self.startPlaying();
		});
		QuotesData.setUp();
		QuotesFetchers.onHandleQuote(function(quote, request, response) {
			QuotesData.storeQuote(quote, request, response)
		});
		QuotesFetchers.onFetchFinished(function(request, response) {
			self.save(request, response);
		});
		QuotesFetchers.setUp();
		self.initUI(); // TODO
	},
	initUI: function() {
		var self = this;
		QuotesSearcher.onBeforeSearch(function(event) {
			$('#quotes').empty();
		});
		QuotesSearcher.onSearch(function(quote, event) {
			self.append(quote);
		});
		QuotesSearcher.onEmptySearch(function(event){
			self.updateStats([]);
		});
		QuotesSearcher.onAfterSearch(function(quotes, event){
			self.updateStats(quotes);
		});
		QuotesSearcher.setUp();

		// TODO
		$('.tab').on('click.quotes', function(event) {
			var tab = $(this);
			if (!tab.hasClass('tab-active')) {
				$('.tab').removeClass('tab-active');
				$('.tab-content').removeClass('tab-content-active');
				tab.addClass('tab-active');
				$(tab.attr('href')).addClass('tab-content-active');
				if (tab.attr('id') != 'tab-play') {
					tab.removeClass('tab-resuming');
					self.pausePlaying();
				} else {
					tab.addClass('tab-resuming');
					self.startPlaying();
				}
			}
		});
		// TODO
		$('#tab-play').on('click.quotes', function(event) {
			var node = $(this);
			if (node.hasClass('tab-active')) {
				if (node.hasClass('tab-resuming')) {
					node.removeClass('tab-resuming');
				} else {
					self.togglePlaying(event);
				}			
			}
		});
		
		$('#nextQuote').on('click.quotes', function(event) {
			self.showQuote(+1);
		});
		$('#previousQuote').on('click.quotes', function(event) {
			self.showQuote(-1);
		});
		$(document).on('keydown.editor', function(event) {
			if ($('#tab-play').hasClass('tab-active')) {
				if ($.isKeyEvent(39, event) || $.isKeyEvent(40, event)) { // left, down
					return self.showQuote(+1);
				}
				if ($.isKeyEvent(37, event) || $.isKeyEvent(38, event)) { // right, up
					return self.showQuote(-1);
				}
				if ($.isKeyEvent(32, event)) { // space
					return self.togglePlaying(event);
				}
			}
		});
	},
	pickQuote: function(offset) {
		var self = this;
		var index = Math.max(self._playedQuotesIndex + offset, 0);
		var quote = self._playedQuotes[index];
		if (QuotesData.size() > 0) {
			while (!quote) {
				var pickedQuote = QuotesData ? QuotesData.getRandomQuote() : null;
				if (pickedQuote) {
					self._playedQuotes.push(pickedQuote);
				} else {
					return null;
				}
				quote = self._playedQuotes[index];
			}
		}
		self._playedQuotesIndex = index;
		return quote;
	},
	togglePlaying: function(event) {
		var self = this;
		if ($('#tab-play').hasClass('tab-playing')) {
			self.stopPlaying();
		} else {
			self.startPlaying(true);
		}
	},
	resumePlaying: function() {
		var self = this;
		if (!self._timerPlayer && $('#tab-play').hasClass('tab-playing')) {
			self._timerPlayer = window.setTimeout(function() {
				self.showQuote(+1);
			}, self._playedIntervall);
		}
	},
	pausePlaying: function() {
		var self = this;
		window.clearTimeout(self._timerPlayer);
		self._timerPlayer = null;
	},
	stopPlaying: function() {
		var self = this;
		self.pausePlaying();
		$('#tab-play').removeClass('tab-playing');
	},
	startPlaying: function(forceStart) {
		var self = this;
		if (forceStart) {
			$('#tab-play').addClass('tab-playing');
		}
		self.showQuote(0);
	},
	showQuote: function(offset) {
		var self = this;
		window.clearTimeout(self._timerPlayer);
		self._timerPlayer = null;
		try {
			QuotesEditors.detach(null);
			self.appendQuote(self.pickQuote(offset), $('#quote').empty());
		} catch (error) {
			console.log("error playing");
			console.log(error);
		}
		if ($('#tab-play').hasClass('tab-playing')) {
			self._timerPlayer = window.setTimeout(function() {
				self.showQuote(+1);
			}, self._playedIntervall);
		}
	},
	append: function(quote, request, response) {
		var self = this;
		if (quote) {
			var container = $('#quotes');
			var node = $('<li class="quote"></li>');
			self.appendQuote(quote, node);
			container.append(node);
		}
	},
	appendQuote: function(quote, jqNode) {
		var self = this;
		if (quote) {
			if (quote['quote']) {
				var nodeQuote = $('<q class="quote-text">' + quote['quote'] + '</q>');
				self.editable(nodeQuote, new QuotesStringEditor(nodeQuote), quote, 'quote');
				jqNode.append(nodeQuote);
			} 
			if (quote['author']) {
				var nodeAuthor = $('<span class="quote-author">' + quote['author'] + '</span>');
				self.editable(nodeAuthor, new QuotesStringEditor(nodeAuthor), quote, 'author');
				jqNode.append(nodeAuthor);
			}
			if (quote['keywords'] && quote['keywords'].length > 0) {
				var nodeKeywords = $('<div class="quote-keywords">');
				$(quote['keywords']).each(function(index, each) {
					nodeKeywords.append($('<span class="quote-keyword">' + each + '</span>'));
				});
				self.editable(nodeKeywords, new QuotesListEditor(nodeKeywords, '<span class="quote-keyword">%{text}</span>'), quote, 'keywords');
				jqNode.append(nodeKeywords);
			}
			if (quote['source']) {
				var nodeSource = $('<cite class="quote-source">' + quote['source'] + '</cite>');
				self.editable(nodeSource, new QuotesStringEditor(nodeSource), quote, 'source');
				jqNode.append(nodeSource);
			}
		}
	},
	editable: function(jqNode, editor, quote, key) {
		var self = this;
		editor.setUp();
		// TODO database key !!!!!
		editor.onSave(function(oldValue, newValue, event) {
			quote[key] = newValue;
			quote['timestamp'] = $.timestamp();
			//self.changed({ 'modify': [ quote ] });
			self.resumePlaying();
			return true;
		});
		editor.onChange(function(event) {
			self.pausePlaying();
		});
		editor.onFocus(function(event) {
			self.pausePlaying();
		});
		editor.onCancel(function(event) {
			self.resumePlaying();
		});
		editor.attach();
	},
	updateStats: function(results) {
		var self = this;
		var text = '';
		if (results) {
			text = 'Displaying ' + results.length + ' of ' + QuotesData.size() + ' quotes';
		} else {
			text = QuotesData.size() + ' quotes available';
		}
		$('#stats').empty().text(text);
	}
};


$(document).ready(function() {
	Quotes.setUp();
});
