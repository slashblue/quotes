QuotesUI = {
	database: null,
	fetcher: null,
	searcher: null,
	player: null,
	setUp: function() {
		var self = this;
		self.setUpDatabase();
		self.setUpFetcher();
		self.setUpSearcher();
		self.setUpPlayer();
		self.setUpControl();
	},
	setUpPlayer: function() {
		var self = this;
		self.player = new QuotesPlayer();
		self.player.onPlay(function(event) {
			$('#tab-play').addClass('tab-playing');
		});
		self.player.onPause(function(event) {
			$('#tab-play').removeClass('tab-playing');
		});
		self.player.onResume(function(event) {
			$('#tab-play').addClass('tab-resuming');
		});
		self.player.onSuspend(function(event) {
			$('#tab-play').removeClass('tab-resuming');
		});
		self.player.onNext(function(nextQuote, previousQuote, event) {
			QuotesEditors.detach(null);
			self.appendQuote(nextQuote, $('#quote').empty());
		});
		self.player.onPrevious(function(nextQuote, previousQuote, event) {
			QuotesEditors.detach(null);
			self.appendQuote(nextQuote, $('#quote').empty());
		});
		self.player.onReady(function(nextQuote, event){
			self.appendQuote(nextQuote, $('#quote').empty());
			if ($('#quote').is(':visible')) {
				self.player.play(event);
			}
		});
		self.player.setUp();
	},
	setUpDatabase: function() {
		var self = this;
		self.database = new QuotesDatabase('./data/db.json');
		self.database.onChange(function(event) {
			self.updateStats();
		});
		self.database.onAfterLoad(function(event) {
			self.updateStats();
		});
		self.database.setUp();
	},
	setUpFetcher: function() {
		var self = this;
		self.fetcher = new QuotesFetcher();
		self.fetcher.onHandleQuote(function(quote, request, response) {
			self.database.addQuote(quote, request, response)
		});
		self.fetcher.onFetchFinished(function(request, response) {
			self.database.save(request, response);
		});
		self.fetcher.setUp();
	},
	setUpSearcher: function() {
		var self = this;
		self.searcher = new QuotesSearcher();
		self.searcher.onBeforeSearch(function(searchTerm, searchTerms, event) {
			QuotesEditors.detach(null);
			$('#quotes').empty();
		});
		self.searcher.onSearch(function(quote, searchTerm, searchTerms, event) {
			var node = $('<li class="quote"></li>')
			self.appendQuote(quote, node);
			$('#quotes').append(node);
		});
		self.searcher.onEmptySearch(function(searchTerm, searchTerms, event){
			self.updateStats([]);
		});
		self.searcher.onAfterSearch(function(quotes, searchTerm, searchTerms, event){
			self.updateStats(quotes);
		});
		self.searcher.setUp();
		$('#searchText').on('keyup.quotes', function(event) {
			self.searcher.search($('#searchText').val(), event);
		});
		$('#tab-search').on('click.quotes', function(event) {
			$('#searchText').focus();
		});

	},
	setUpControl: function() {
		var self = this;
		$('.tab').on('click.quotes', function(event) {
			var tab = $(this);
			if (tab.hasClass('tab-active')) {
				self.player.toggle(event);
			} else {
				$('.tab').removeClass('tab-active');
				$('.tab-content').removeClass('tab-content-active');
				tab.addClass('tab-active');
				$(tab.attr('href')).addClass('tab-content-active');
				self.player.suspend(event);
			}
		});		
		$('#nextQuote').on('click.quotes', function(event) {
			self.player.next(event);
		});
		$('#previousQuote').on('click.quotes', function(event) {
			self.player.previous(event);
		});
		$(document).on('keydown.editor', function(event) {
			if ($('#tab-play').hasClass('tab-active')) {
				if ($.isKeyEvent(39, event) || $.isKeyEvent(40, event)) { // left, down
					return self.player.next(event);
				}
				if ($.isKeyEvent(37, event) || $.isKeyEvent(38, event)) { // right, up
					return self.player.previous(event);
				}
				if ($.isKeyEvent(32, event)) { // space
					return self.player.toggle(event);
				}
			}
		});
	},
	appendQuote: function(quote, jqNode) {
		var self = this;
		if (quote) {
			if (quote.getText()) {
				var nodeQuote = $('<q class="quote-text">' + quote.getText() + '</q>');
				self.editable(nodeQuote, new QuotesStringEditor(nodeQuote), quote, quote.setText);
				jqNode.append(nodeQuote);
			} 
			if (quote.getAuthor()) {
				var nodeAuthor = $('<span class="quote-author">' + quote.getAuthor() + '</span>');
				self.editable(nodeAuthor, new QuotesStringEditor(nodeAuthor), quote, quote.setAuthor);
				jqNode.append(nodeAuthor);
			}
			if (quote.getKeywords() && quote.getKeywords().length > 0) {
				var nodeKeywords = $('<div class="quote-keywords">');
				quote.eachKeyword(function(index, each) {
					nodeKeywords.append($('<span class="quote-keyword">' + each + '</span>'));
				});
				self.editable(nodeKeywords, new QuotesListEditor(nodeKeywords, '<span class="quote-keyword">%{text}</span>'), quote, quote.setKeywords);
				jqNode.append(nodeKeywords);
			}
			if (quote.getSource()) {
				var nodeSource = $('<cite class="quote-source">' + quote.getSource() + '</cite>');
				self.editable(nodeSource, new QuotesStringEditor(nodeSource), quote, quote.setSource);
				jqNode.append(nodeSource);
			}
			var buttonDelete = $('<a class="delete">x</a>');
			buttonDelete.on('click.editor', function(event) {
				self.database.removeQuote(quote);
				jqNode.remove();
			});
			buttonDelete.appendTo(jqNode);
		}
	},
	editable: function(jqNode, editor, quote, callback) {
		var self = this;
		editor.setUp();
		editor.onSave(function(oldValue, newValue, event) {
			callback(newValue);
			quote.change();
			self.database.changed({ 'edit': [ quote ]});
			self.player.resume(event);
			return true;
		});
		editor.onChange(function(event) {
			self.player.suspend(event);
		});
		editor.onFocus(function(event) {
			self.player.suspend(event);
		});
		editor.onCancel(function(event) {
			self.player.resume(event);
		});
		editor.attach();
	},
	updateStats: function(results) {
		var self = this;
		var text = '';
		if (results) {
			text = 'Displaying ' + results.length + ' of ' + self.database.size() + ' quotes';
		} else {
			text = self.database.size() + ' quotes available';
		}
		$('#stats').empty().text(text);
	}
};


$(document).ready(function() {
	QuotesUI.setUp();
});
