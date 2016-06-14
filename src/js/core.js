Quotes = {
	_playedQuotes: [],
	_playedQuotesIndex: -1,
	_playedIntervall: 10 * 1000,
	_timerPlayer: null,
	setUp: function() {
		var self = this;
		QuotesData.onChange(function(event) {
			self.updateStats();
		});
		QuotesData.onAfterLoad(function(event) {
			self.updateStats();
		});
		QuotesData.setUp();
		
		QuotesFetchers.onHandleQuote(function(quote, request, response) {
			QuotesData.storeQuote(quote, request, response)
		});
		QuotesFetchers.onFetchFinished(function(request, response) {
			QuotesData.save(request, response);
		});
		QuotesFetchers.setUp();

		QuotesSearcher.onBeforeSearch(function(event) {
			QuotesEditors.detach(null);
			$('#quotes').empty();
		});
		QuotesSearcher.onSearch(function(quote, event) {
			var node = $('<li class="quote"></li>')
			self.appendQuote(quote, node);
			$('#quotes').append(node);
		});
		QuotesSearcher.onEmptySearch(function(event){
			self.updateStats([]);
		});
		QuotesSearcher.onAfterSearch(function(quotes, event){
			self.updateStats(quotes);
		});
		QuotesSearcher.setUp();

		QuotesPlayer.onPlay(function(event) {
			$('#tab-play').addClass('tab-playing').removeClass('tab-resuming');
		});
		QuotesPlayer.onPause(function(event) {
			$('#tab-play').removeClass('tab-playing').removeClass('tab-resuming');
		});
		QuotesPlayer.onResume(function(event) {
			$('#tab-play').addClass('tab-resuming');
		});
		QuotesPlayer.onSuspend(function(event) {
			$('#tab-play').removeClass('tab-resuming');
		});
		QuotesPlayer.onNext(function(nextQuote, previousQuote, event) {
			QuotesEditors.detach(null);
			self.appendQuote(nextQuote, $('#quote').empty());
		});
		QuotesPlayer.onPrevious(function(nextQuote, previousQuote, event) {
			QuotesEditors.detach(null);
			self.appendQuote(nextQuote, $('#quote').empty());
		});
		QuotesPlayer.onReady(function(nextQuote, event){
			self.appendQuote(nextQuote, $('#quote').empty());
			if ($('#quote').is(':visible')) {
				this.play(event);
			}
		});
		QuotesPlayer.setUp();
		
		$('.tab').on('click.quotes', function(event) {
			var tab = $(this);
			if (tab.hasClass('tab-active')) {
				// todo
				if (QuotesPlayer.isSuspended()) {
					QuotesPlayer.toggle(event);
				} else {
					QuotesPlayer.resume(event);
				}
			} else {
				$('.tab').removeClass('tab-active');
				$('.tab-content').removeClass('tab-content-active');
				tab.addClass('tab-active');
				$(tab.attr('href')).addClass('tab-content-active');
				QuotesPlayer.suspend(event);
			}
		});		
		$('#nextQuote').on('click.quotes', function(event) {
			QuotesPlayer.next(event);
		});
		$('#previousQuote').on('click.quotes', function(event) {
			QuotesPlayer.previous(event);
		});
		$(document).on('keydown.editor', function(event) {
			if ($('#tab-play').hasClass('tab-active')) {
				if ($.isKeyEvent(39, event) || $.isKeyEvent(40, event)) { // left, down
					return QuotesPlayer.next(event);
				}
				if ($.isKeyEvent(37, event) || $.isKeyEvent(38, event)) { // right, up
					return QuotesPlayer.previous(event);
				}
				if ($.isKeyEvent(32, event)) { // space
					return QuotesPlayer.toggle(event);
				}
			}
		});
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
			QuotesPlayer.resume(event);
			return true;
		});
		editor.onChange(function(event) {
			QuotesPlayer.suspend(event);
		});
		editor.onFocus(function(event) {
			QuotesPlayer.suspend(event);
		});
		editor.onCancel(function(event) {
			QuotesPlayer.resume(event);
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
