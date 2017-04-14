/*
 * @requires external/jquery.scrollTo.min.js
 * @requires database.js
 * @requires fetcher.js
 * @requires editors.js
 * @requires searcher.js
 * @requires player.js
 */

QuotesUI = {
	database: null,
	fetcher: null,
	searcher: null,
	player: null,
	importers: null,
	history: null,
	setUp: function(event) {
		try {
			logger.log('info', 'QuotesUI.setUp');
			this.setUpDocument();
			this.setUpDatabase();
		} catch (error) {
			logger.log('error', 'QuotesUI.setUp', { 'error': error });
		}
	},
	setUpDocument: function() {
		var html = $('html');
		if (Settings && Settings.isDesktop()) {
			html.addClass('desktop');
		} else {
			html.removeClass('desktop');
		}
		$(Settings && Settings.getSettings().platform || []).each(function(index, each) {
			html.addClass(each);
		});
	},
	setUpPlayer: function() {
		var self = this;
		self.player = new QuotesPlayer(Settings.getOptions('player', {}));
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
			self.replaceQuote(nextQuote, $('#quote'));
		});
		self.player.onPrevious(function(nextQuote, previousQuote, event) {
			self.replaceQuote(nextQuote, $('#quote'));
		});
		self.player.onPick(function() {
			return self.database.getRandomQuote();
		});
		self.player.onReady(function(nextQuote, event){
			if ($('#quote').is(':visible')) {
				self.player.play(event);
			}
		});
		self.player.setUp();
	},
	setUpDatabase: function() {
		var self = this;
		self.database = new QuotesDatabase(Settings.getDBFilePath());
		self.database.onChange(function(event) {
			self.updateStats();
		});
		self.database.onAfterLoad(function(event) {
			self.updateStats();
		});
		self.database.onWriteRequests(function(requests) {
			if (self.fetcher) {
				self.fetcher.eachRequest(function(index, each) {
					requests.push(each.forJSON());
				});
			}
		});
		self.database.onReady(function() {
			self.setUpFetcher();
			self.setUpPlayer();
			self.setUpSearcher();
			self.setupHistory();
			self.setupImporters();
			self.setUpControl();
			self.setupMainWindow();
		});
		self.database.setUp();
	},
	setUpFetcher: function() {
		var self = this;
		self.fetcher = new QuotesFetcher(self.database.getRequests());
		self.fetcher.onHandleQuote(function(quote, request, response) {
			self.database.addQuote(quote, request, response);
		});
		self.fetcher.onHandleUnsafeQuote(function(quote, request, response) {
			self.database.addQuote(quote, request, response);
		});
		self.fetcher.onAfterFetch(function(request, response) {
			var message = 'Found ' + request.quotes.length + ' quotes at url: ' + request.url;
			if (request.quotes.length > 0) {
				logger.log('info', message);
			} else {
				logger.log('warn', message);
			}
			self.database.saveDelayed(request, response);
		});
		self.fetcher.register('http://www.brainyquote.com/quotes_of_the_day.html', 1 * 60 * 60 * 1000, function(request, response, handler) {
			$(response).find('.bqQt').each(function(indexNode, eachNode) {
				var nodeQuote = $(eachNode);
				var text = $.normalize(nodeQuote.find('.bqQuoteLink > a').text());
				var author = $.normalize(nodeQuote.find('.bq-aut > a').text());
				var keywords = $.normalizeList(nodeQuote.find('.bq_q_nav a').map(function(indexKeywords, eachKeyword) { return $(eachKeyword).text(); }));
				handler(text, author, keywords, null, 'en', true, request, response);
			});
		});
		self.fetcher.register([ "http://www.quotationspage.com/qotd.html", "http://www.quotationspage.com/mqotd.html", "http://www.quotationspage.com/random.php3" ], 1 * 60 * 60 * 1000, function(request, response, handler) {
			$(response).find('#content > dl > dt.quote').each(function(indexNode, eachNode) {
				var nodeQuote = $(eachNode);
				var text = $.normalize(nodeQuote.find("a").text());
				var nodeAuthor = nodeQuote.next("dd.author");
				if (nodeAuthor && nodeAuthor[0]) {
					var author = $.normalize(nodeAuthor.find("b > a").text());
					var keywords = $.normalizeList([ nodeAuthor.find("div.related > a").text() ]);
					handler(text, author, keywords, null, 'en', true, request, response);
				}
			});
		});
		self.fetcher.register('http://www.brainyquote.com', 1 * 60 * 60 * 1000, function(request, response, handler) {
			var nodeQuote = $(response).find('.bqcpx');
			var text = $.normalize(nodeQuote.find('div.bq-slide-q-text > a').text());
			var author = $.normalize(nodeQuote.find('a.ws-author').text());
			handler(text, author, [], null, 'en', true, request, response);
		});
		self.fetcher.register('http://www.goodreads.com/quotes', 1 * 60 * 60 * 1000, function(request, response, handler) {
			$(response).find('.quotes .quote').each(function(indexNode, eachNode) {
				var nodeQuote = $(eachNode);
				var rawText = nodeQuote.find('.quoteText').text().match(/\u201C(.*)\u201D/g)[0];
				var text = $.normalize(rawText.slice(1, rawText.length - 1));
				var author = $.normalize(nodeQuote.find('.quoteText > a.authorOrTitle').text());
				var keywords = $.normalizeList($.grep(nodeQuote.find('.quoteFooter > div.smallText > a').map(function(indexKeywords, eachKeyword) { return $.normalize($(eachKeyword).text()).capitalize(); }), function(eachKeyword) { return eachKeyword && eachKeyword.length > 0 && eachKeyword.indexOf('no-source') < 0 && eachKeyword.indexOf('attributed') < 0 && eachKeyword.indexOf('Attributed') < 0; }));
				var source = $.normalize(nodeQuote.find('.quoteText > span > a.authorOrTitle').text());
				handler(text, author, keywords, null, 'en', true, request, response);
			});
		});
		self.fetcher.register('http://zitate.net/', 1 * 60 * 60 * 1000, function(request, response, handler) {
			$(response).find('div > table.a-auto').each(function(indexNode, eachNode) {
				var nodeQuote = $(eachNode);
				var text = $.normalize(nodeQuote.find('table.a-auto span.quote').text());
				var author = $.normalize(nodeQuote.find('table.a-auto a.quote-btn').text());
				handler(text, author, [], null, 'de', true, request, response);
			});
		});
		self.fetcher.register([ 'http://zitatezumnachdenken.com/', 'http://zitatezumnachdenken.com/zufaellig' ], 1 * 60 * 60 * 1000, function(request, response, handler) {
			$(response).find('div.post').each(function(indexNode, eachNode) {
				var nodeQuote = $(eachNode);
				var text = $.normalize(nodeQuote.find('.stripex > a > p').text());
				var author = $.normalize(nodeQuote.find('div.authorInLoop > a').text());
				var keywords = $.normalizeList($($.grep($(nodeQuote).attr('class').split(' '), function(className) { return className && className.indexOf('tag-') >= 0; })).map(function(indexClassName, eachClassName) { return $.normalize(eachClassName.replace('tag-', '')).capitalize(); }));
				handler(text, author, keywords, null, 'de', true, request, response);
			});
		});
		self.fetcher.register([ 'https://www.aphorismen.de/top10?rubrik=zitate', 'https://www.aphorismen.de/suche?spezial=zufall' ], 1 * 60 * 60 * 1000, function(request, response, handler) {
			$(response).find('li.context').each(function(indexNode, eachNode) {
				var nodeQuote = $(eachNode);
				var text = $.normalize(nodeQuote.find('p.spruch > a').text());
				var author = $.normalize(nodeQuote.find('p.autor > a').text());
				handler(text, author, [], null, 'de', true, request, response);
			});
		});
		self.fetcher.register([ 'http://www.zitate.de/' ], 1 * 60 * 60 * 1000, function(request, response, handler) {
			$(response).find('.quote-box blockquote').each(function(indexNode, eachNode) {
				var nodeQuote = $(eachNode);
				var text = $.normalize(nodeQuote.find('p').text());
				var author = $.normalize($.swapNameFragments(nodeQuote.find('small > a').text()));
				handler(text, author, [], null, 'de', true, request, response);
			});
		});
		self.fetcher.register([ 'http://natune.net/zitate/', 'http://natune.net/zitate/Zufalls5' ], 1 * 60 * 60 * 1000, function(request, response, handler) {
			$(response).find('ul.quotes > li').each(function(indexNode, eachNode) {
				var nodeQuote = $(eachNode);
				var text = $.normalize(nodeQuote.find('.quote_text').text());
				var author = $.normalize(nodeQuote.find('.quote_author > a').text());
				handler(text, author, [], null, 'de', true, request, response);
			});
		});
		self.fetcher.register([ 'http://www.zitate-online.de/literaturzitate/' ], 1 * 60 * 60 * 1000, function(request, response, handler) {
			$(response).find('.witz').each(function(indexNode, eachNode) {
				var nodeQuote = $(eachNode);
				var text = $.normalize(nodeQuote.find('p.witztext').text());
				var author = $.normalize(nodeQuote.find('p.autor > a').text());
				var keywords = $.normalizeList(nodeQuote.find('p.schlagworte > a').map(function(indexKeyword, eachKeyword) { return $(eachKeyword).text(); }));
				handler(text, author, keywords, null, 'de', true, request, response);
			});
		});
		self.fetcher.register([ 'http://www.global-av.ch/reiseberichte/kolumne/zeitzitate.html' ], 1 * 60 * 60 * 1000, function(request, response, handler) {
			$(response).find('h2 ~ p').each(function(indexNode, eachNode) {
				var nodeQuote = $(eachNode);
				if (nodeQuote.prevAll('h3').length <= 0) {
					var rawText = nodeQuote.html();
					var text = $.normalizeHtml(rawText.slice(0, rawText.indexOf('<span')));
					var rawAuthor = nodeQuote.find('span.kursiv').text();
					var indexAuthor = rawAuthor.indexOf('(');
					var author = $.normalize((indexAuthor > 0 ? rawAuthor.slice(0, indexAuthor) : rawAuthor).replace(/<\s*\/?\s*br\s*\/?\s*>/g, ''));
					if (text && author) {
						handler(text, author, [], null, 'de', true, request, response);
					}
				}
			});
		});
		self.fetcher.register([ 'http://www.hauenstein-rafz.ch/de/extra/zitate.php' ], 1 * 60 * 60 * 1000, function(request, response, handler) {
			$(response).find('#ZitateZeigen ~ div.elementBox_var0').each(function(indexNode, eachNode) {
				var nodeQuote = $(eachNode);
				var rawText = nodeQuote.html();
				var text = $.normalizeHtml(rawText.slice(0, rawText.indexOf('<i')));
				var rawAuthor = nodeQuote.find('i').text();
				var matchAuthor = rawAuthor.match(/([a-zA-ZÀÁÂÃÄÅàáâãäåĀāąĄæÇçćĆčČđĐďĎÈÉÊËèéêëěĚĒēęĘÌÍÎÏìíîïĪīłŁÑñňŇńŃÒÓÔÕÕÖØòóôõöøŌōřŘŠšśŚťŤÙÚÛÜùúûüůŮŪūŸÿýÝŽžżŻźŹ\-'. ]*[a-zA-ZÀÁÂÃÄÅàáâãäåĀāąĄÇçćĆčČđĐďĎÈÉÊËèéêëěĚĒēęĘÌÍÎÏìíîïĪīłŁÑñňŇńŃÒÓÔÕÕÖØòóôõöøŌōřŘŠšśŚťŤÙÚÛÜùúûüůŮŪūŸÿýÝŽžżŻźŹ])(\s+\*?\d+\s*(-\s*(\d+))?\s*(v|n\.\s*Chr\.)?)?/);
				var author = matchAuthor ? $.normalize(matchAuthor[1]) : null;
				if (text && author) {
					handler(text, author, [], null, 'de', true, request, response);
				}
			});
		});
		self.fetcher.register([ 'http://lebensweisheiten-sprueche.ch/kluge-schlaue-sprueche/', 'http://lebensweisheiten-sprueche.ch/schoene-sprueche-zum-nachdenken/', 'http://lebensweisheiten-sprueche.ch/lustige-sprueche/' ], 1 * 60 * 60 * 1000,function(request, response, handler) {
			$(response).find('div.content section blockquote > p').each(function(indexNode, eachNode) {
				var nodeQuote = $(eachNode);
				var rawText = nodeQuote.html();
				var text = null;
				var author = null;
				var indexText = rawText.indexOf('<em');
				var matchText = rawText.match(/(<\s*\/?\s*br\s*\/?\s*>)(\s*↵*\s*(–|-)\s*)(.*)$/);
				var safe = true;
				if (matchText && matchText[0] && indexText <= 0) {
					indexText = rawText.indexOf(matchText[0]);
					if (indexText > 0) {
						text = $.normalizeHtml(rawText.slice(0, indexText));
						author = $.normalize(matchText[4]);
						safe = false;
					} 
				} else {
					if (indexText < 0) {
						safe = false;
					}
					text = $.normalizeHtml(rawText.slice(0, indexText));
					author = $.normalize(nodeQuote.find('em').text()) || 'Unbekannter Autor';

				}
				handler(text, author, [], null, 'de', safe, request, response);
			});
		});
		self.fetcher.setUp();
	},
	setUpSearcher: function() {
		var self = this;
		self.searcher = new QuotesSearcher();
		self.searcher.onEach(function(callback){
			self.database.eachQuote(callback);
		});
		self.searcher.onBeforeSearch(function(searchTerm, searchTerms, event) {
			QuotesEditors.detach(null);
			$('#searchQuotes').empty();
		});
		self.searcher.onSearch(function(quote, searchTerm, searchTerms, event) {
			var node = $('<li class="quote"></li>')
			self.appendQuote(quote, node);
			$('#searchQuotes').append(node);
		});
		self.searcher.onEmptySearch(function(searchTerm, searchTerms, event){
			self.updateStats([]);
		});
		self.searcher.onAfterSearch(function(quotes, searchTerm, searchTerms, event){
			self.updateStats(quotes);
		});
		self.searcher.setUp();
	},
	setupHistory: function() {
		var self = this;
		self.history = new QuotesHistory();
		self.history.onRefresh(function() {
			$('#historyQuotes').empty();
			return self.database.getQuotes();
		});
		self.history.onBeforeQuote(function(timestamp, quote) {
			$('#historyQuotes').append($("<li class='quote quote-separator'><h2>" + timestamp + "</h2></li>"));
		});
		self.history.onQuote(function(quote) {
			var node = $('<li class="quote"></li>')
			self.appendQuote(quote, node);
			$('#historyQuotes').append(node);
		});
	},
	setupImporters: function() {
		var self = this;
		self.importers = [ ];
		var jsonImporter = new QuotesImporterJSON();
		jsonImporter.onQuotes(function(json) {
			return Quotes.read(json['quotes']);
		});
		jsonImporter.onQuote(function(quote) {
			self.database.addQuote(quote);
		});
		self.importers.push(jsonImporter);
	},
	setUpControl: function() {
		var self = this;
		$('.tab').on('click.quotes', function(event) {
			var tab = $(this);
			if (tab.hasClass('tab-active')) {
				if (!QuotesEditors.isEditing()) {
					self.player.toggle(event);
				}
			} else {
				$('.tab').removeClass('tab-active');
				$('.tab-content').removeClass('tab-content-active');
				tab.addClass('tab-active');
				$(tab.attr('href')).addClass('tab-content-active');
				self.player.suspend(event);
			}
		});		
		$('#nextQuote').on('click.quotes', function(event) {
			if (!QuotesEditors.isDirty()) {
				QuotesEditors.abort();
				self.player.next(event);
			} else {
				QuotesEditors.highlight();
			}
		});
		$('#previousQuote').on('click.quotes', function(event) {
			if (!QuotesEditors.isDirty()) {
				QuotesEditors.abort();
				self.player.previous(event);
			} else {
				QuotesEditors.highlight();
			}
		});
		$(document).on('keydown.editor', function(event) {
			if ($('#tab-play').hasClass('tab-active')) {
				if (!QuotesEditors.isEditing()) {
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
			}
		});
		$('#searchText').on('keyup.quotes', function(event) {
			if (!QuotesEditors.isDirty()) {
				QuotesEditors.abort();
				self.searcher.search($('#searchText').val(), event);
			} else {
				QuotesEditors.highlight();
			}
		});
		$('#tab-search').on('click.quotes', function(event) {
			$('#searchText').focus();
		});
		$('#tab-history').on('click.quotes', function(event) {
			self.history.refresh();
		});
		$('#historyMore').on('click.quotes', function(event) {
			self.history.showMore();
		});
	},
	setupMainWindow: function() {
		var self = this;
		if (window && window.electron && window.electron.ipcRenderer) {
			var ipc = window.electron.ipcRenderer;
			ipc.on('copy-quote', function(event, arg) {
				event.sender.send('copy-quote', self.player.currentQuote().toString());
			});
			ipc.on('player-toggle', function(event, arg) {
				self.player.toggle();
			});
			ipc.on('player-next', function(event, arg) {
				self.player.next();
			});
			ipc.on('player-previous', function(event, arg) {
				self.player.previous();
			});
			ipc.on('player-faster', function(event, arg) {
				self.player.faster();
				event.sender.send('player-options', self.player.options);
			});
			ipc.on('player-slower', function(event, arg) {
				self.player.slower();
				event.sender.send('player-options', self.player.options);
			});
			ipc.on('player-reset', function(event, arg) {
				self.player.reset();
				event.sender.send('player-options', self.player.options);
			});
			ipc.on('import-quotes', function(event, arg) {
				QuotesImporters.import(self.database, self.importers, arg, event);
			});
		}
		$("body").removeClass("loading").addClass("loaded");
	},
	tearDown: function(event) {
		try {
			logger.log('info', 'QuotesUI.tearDown');
			this.database.tearDown();
			this.fetcher.tearDown();
			this.player.tearDown();	
			this.searcher.tearDown();
			this.history.tearDown();
		} catch (error) {
			logger.log('error', 'QuotesUI.tearDown', { 'error': error });
		}
		
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
			if (quote.getUrl()) {
				var nodeUrl = $('<a class="quote-url" href="' + quote.getUrl() + '" target="_blank">© ' + quote.getDomain() + '</a>');
				jqNode.append(nodeUrl);
			}
			var controls = $('<div class="controls"></div>');
			var buttonSave = $('<a class="control save icon-ok" title="save"></a>');
			buttonSave.on('click.editor', function(event) {
				QuotesEditors.each(function(each) {
					each.save();
				}, jqNode) ;
			});
			var buttonCancel = $('<a class="control save icon-ccw" title="cancel"></a>');
			buttonCancel.on('click.editor', function(event) {
				QuotesEditors.each(function(each) {
					each.abort();
				}, jqNode) ;
			});
			var buttonCopy= $('<a class="control copy icon-docs" title="copy to clipboard"></a>');
			buttonCopy.on('click.editor', function(event) {
				window.electron.ipcRenderer.send("copy-quote", quote.toString());
			});
			var buttonDelete = $('<a class="control delete icon-trash-empty" title="delete"></a>');
			buttonDelete.on('click.editor', function(event) {
				self.database.removeQuote(quote);
				jqNode.remove();
			});
			buttonSave.appendTo(controls);
			buttonCancel.appendTo(controls);
			buttonCopy.appendTo(controls);
			buttonDelete.appendTo(controls);
			controls.appendTo(jqNode);
		}
	},
	replaceQuote: function(quote, jqNode) {
		var self = this;
		QuotesEditors.detach(null);
		jqNode.empty();
		// BUG: very strange bug when rendering transparent windows, this compensates for most disturbances !
		window.setTimeout(function() {
			self.appendQuote(quote, jqNode);
		}, 50);
	},
	editable: function(jqNode, editor, quote, callback) {
		var self = this;
		editor.setUp();
		editor.onSave(function(oldValue, newValue, event) {
			callback(newValue);
			quote.change();
			self.database.changed({ 'edit': [ quote ]});
			return true;
		});
		editor.onChange(function(event) {
			self.player.suspend(event);
		});
		editor.onFocus(function(event) {
			self.player.suspend(event);
		});
		editor.onCancel(function(event) {
		});
		editor.attach();
	},
	updateStats: function(results) {
		var text = '';
		if (results) {
			text = 'Displaying ' + results.length + ' of ' + this.database.size() + ' quotes';
		} else {
			text = this.database.size() + ' quotes available';
		}
		$('#stats').empty().text(text);
	}
};


$(document).ready(function(event) {
	QuotesUI.setUp(event);
});


$(window).on('unload', function(event) {
	QuotesUI.tearDown(event);
});
