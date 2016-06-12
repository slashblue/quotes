// quote -> object
// specs -> object
// auto scheduler
// ----------------------------------------------------
/*
QuoteSpecification = function(keyedArguments) {
	url: null,
	interval: null,
	callback: null,
	doFetch: function(handler) {
		if (handler) {
			handler.fetch(self.url, self.interval, self.callback);
		}
	}
};
*/
Quotes = {
	_db: null,
	_cache: {},
	_quotes: {},
	_playedQuotes: [],
	_playedQuotesIndex: -1,
	_playedIntervall: 10 * 1000,
	_lastChange: null,
	_requests: [],
	_specs: [],
	_timer: null,
	_timerSearch: null,
	_timerPlayer: null,
	_onBeforeLoad: function() {},
	_onAfterLoad: function() {},
	_onChange: function() {},
	_onBeforeSave: function() {},
	_onAfterSave: function() {},
	setup: function() {
		var self = this;
		self.init(); // TODO
		self.initUI(); // TODO
		self.load(); // TODO
		self.initSpecs(); // TODO
	},
	init: function() {
		var self = this;
		self._db = low('./data/db.json', { storage: require('lowdb/lib/file-async') });
	},
	load: function() {
		var self = this;
		if (self._onBeforeLoad) {
			self._onBeforeLoad.apply(self);
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
			self._onAfterLoad.apply(self);
		}
	},
	newQuotes: function() {
		return {};
	},
	newRequests: function() {
		return [];
	},
	migrate: function() {
		var self = this;
		var changed = false;
		var changes = [];
		self.each(function(quote) {
			// migrate quote
			var oldText = quote['quote'];
			var newText = self.normalize(quote['quote']);
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
			var newKeywords = $.grep(oldKeywords, function(keyword) { return keyword && self.normalize(keyword); });
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
	changed: function() {
		var self = this;
		self._lastChange = (new Date()).getTime();
		if (self._onChange) {
			self._onChange.apply(self);
		}
	},
	save: function(request, response) {
		var self = this;
		if (self._lastChange) {
			if (self._db && self._db.set) {
				if (self._onBeforeSave) {
					self._onBeforeSave.apply(self);
				}
				self._db.set('quotes', self._quotes).value();
				self._db.set('requests', $(self._requests).map(function(indexRequest, eachRequest) { return self.minimizeRequest(eachRequest); }).toArray()).value();
				self._db.write();
				self._lastChange = null;
				if (self._onAfterSave) {
					self._onAfterSave.apply(self);
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
	initUI: function() {
		var self = this;
		self._onChange = function() {
			self.updateStats();
		};
		self._onAfterLoad = function() {
			self.updateStats();
			self.startPlaying();
		};	
		$('#searchText').on('keyup.quotes', function(event) {
			window.clearTimeout(self._timerSearch);
			self._timerSearch = window.setTimeout(function() {
				var results = [];
				$('#quotes').empty();
				self.searchForText($('#searchText').val(), function(quote) {
					self.append(quote);
					results.push(quote);
				}, function() {
					results = null;
				});
				self.updateStats(results);
			}, 100);	
		});
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
					if (node.hasClass('tab-playing')) {
						self.stopPlaying();
					} else {
						self.startPlaying(true);
					}	
				}			
			}
		});
		$('#nextQuote').on('click.quotes', function(event) {
			self.showQuote(+1);
		});
		$('#previousQuote').on('click.quotes', function(event) {
			self.showQuote(-1);
		});
	},
	pickQuote: function(offset) {
		var self = this;
		var index = Math.max(self._playedQuotesIndex + offset, 0);
		var quote = self._playedQuotes[index];
		while (!quote) {
			var pickedQuote = self.pickRandomQuote();
			if (pickedQuote) {
				self._playedQuotes.push(pickedQuote);
			}
			quote = self._playedQuotes[index];
		}
		self._playedQuotesIndex = index;
		return quote;
	},
	pickRandomQuote: function() {
		var self = this;
		var keys = Object.keys(self._quotes);
		return self._quotes[keys[Math.floor(keys.length * Math.random())]];
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
			self.appendQuote(self.pickQuote(offset), $('#quote').empty());
		} catch (error) {
			console.log("error playing");
		}
		if ($('#tab-play').hasClass('tab-playing')) {
			self._timerPlayer = window.setTimeout(function() {
				self.showQuote(+1);
			}, self._playedIntervall);
		}
	},
	initSpecs: function() {
		var self = this;
		/*
		new QuoteSpecification({
			'url': 'http://www.brainyquote.com',
			'interval': 60 * 1000,
			'callback': function(request, response) {
				var node = $(response).find('.bqcpx');
				var quote = self.normalize(node.find('div.bq-slide-q-text > a').text());
				var author = self.normalize(node.find('a.ws-author').text());
				var keywords = [];
				self.handle(quote, author, keywords, 'en', false, request, response);
			}
		});
		window.setTimeout(function() {
			$(self._specs).each(function(index, each) {
				each.fetch(self);
			});
		}, 60 * 1000 * 60);
		*/
		self.schedule(function() {
			self.fetch('http://www.brainyquote.com/quotes_of_the_day.html', 1 * 60 * 60 * 1000, function(request, response) {
				$(response).find('.bqQt').each(function(indexNode, eachNode) {
					var nodeQuote = $(eachNode);
					var text = self.normalize(nodeQuote.find('.bqQuoteLink > a').text());
					var author = self.normalize(nodeQuote.find('.bq-aut > a').text());
					var keywords = $.grep(nodeQuote.find('.bq_q_nav a').map(function(indexKeywords, eachKeyword) { return self.normalize($(eachKeyword).text()); }), function(eachKeyword) { return eachKeyword && eachKeyword.length > 0; }).sort();
					self.handle(text, author, keywords, null, 'en', false, request, response);
				});
			});
		});	
		self.schedule(function() {
			self.fetch([ "http://www.quotationspage.com/qotd.html", "http://www.quotationspage.com/mqotd.html", "http://www.quotationspage.com/random.php3" ], 1 * 60 * 60 * 1000, function(request, response) {
				$(response).find('#content > dl > dt.quote').each(function(indexNode, eachNode) {
					var nodeQuote = $(eachNode);
					var text = self.normalize(nodeQuote.find("a").text());
					var nodeAuthor = nodeQuote.next("dd.author");
					if (nodeAuthor && nodeAuthor[0]) {
						var author = self.normalize(nodeAuthor.find("b > a").text());
						var keywords = [ self.normalize(nodeAuthor.find("div.related > a").text()) ];
						self.handle(text, author, keywords, null, 'en', false, request, response);
					}
				});
			});
		});
		self.schedule(function() {
			self.fetch('http://www.brainyquote.com', 1 * 60 * 60 * 1000, function(request, response) {
				var nodeQuote = $(response).find('.bqcpx');
				var text = self.normalize(nodeQuote.find('div.bq-slide-q-text > a').text());
				var author = self.normalize(nodeQuote.find('a.ws-author').text());
				self.handle(text, author, [], null, 'en', false, request, response);
			});
		});
		self.schedule(function() {
			self.fetch('http://www.goodreads.com/quotes', 1 * 60 * 60 * 1000, function(request, response) {
				$(response).find('.quotes .quote').each(function(indexNode, eachNode) {
					var nodeQuote = $(eachNode);
					var rawText = nodeQuote.find('.quoteText').text().match(/\u201C(.*)\u201D/g)[0];
					var text = self.normalize(rawText.slice(1, rawText.length - 1));
					var author = self.normalize(nodeQuote.find('.quoteText > a.authorOrTitle').text());
					var keywords = $.grep(nodeQuote.find('.quoteFooter > div.smallText > a').map(function(indexKeywords, eachKeyword) { return self.normalize($(eachKeyword).text()).capitalize(); }), function(eachKeyword) { return eachKeyword && eachKeyword.length > 0 && eachKeyword.indexOf('no-source') < 0 && eachKeyword.indexOf('attributed') < 0 && eachKeyword.indexOf('Attributed') < 0; }).sort();
					var source = self.normalize(nodeQuote.find('.quoteText > span > a.authorOrTitle').text());
					self.handle(text, author, keywords, null, 'en', false, request, response);
				});
			});
		});
		self.schedule(function() {
			self.fetch('http://zitate.net/', 1 * 60 * 60 * 1000, function(request, response) {
				$(response).find('div > table.a-auto').each(function(indexNode, eachNode) {
					var nodeQuote = $(eachNode);
					var text = self.normalize(nodeQuote.find('table.a-auto span.quote').text());
					var author = self.normalize(nodeQuote.find('table.a-auto a.quote-btn').text());
					self.handle(text, author, [], null, 'de', false, request, response);
				});
			});
		});
		self.schedule(function() {
			self.fetch([ 'http://zitatezumnachdenken.com/', 'http://zitatezumnachdenken.com/zufaellig' ], 1 * 60 * 60 * 1000, function(request, response) {
				$(response).find('div.post').each(function(indexNode, eachNode) {
					var nodeQuote = $(eachNode);
					var text = self.normalize(nodeQuote.find('.stripex > a > p').text());
					var author = self.normalize(nodeQuote.find('div.authorInLoop > a').text());
					var keywords = $($.grep($(nodeQuote).attr('class').split(' '), function(className) { return className && className.indexOf('tag-') >= 0; })).map(function(indexClassName, eachClassName) { return self.normalize(eachClassName.replace('tag-', '')).capitalize(); }).toArray();
					self.handle(text, author, keywords, null, 'de', false, request, response);
				});
			});
		});
		self.schedule(function() {
			self.fetch([ 'https://www.aphorismen.de/top10?rubrik=zitate', 'https://www.aphorismen.de/suche?spezial=zufall' ], 1 * 60 * 60 * 1000, function(request, response) {
				$(response).find('li.context').each(function(indexNode, eachNode) {
					var nodeQuote = $(eachNode);
					var text = self.normalize(nodeQuote.find('p.spruch > a').text());
					var author = self.normalize(nodeQuote.find('p.autor > a').text());
					self.handle(text, author, [], null, 'de', false, request, response);
				});
			});
		});
		self.schedule(function() {
			self.fetch([ 'http://www.zitate.de/' ], 1 * 60 * 60 * 1000, function(request, response) {
				$(response).find('.quote-box blockquote').each(function(indexNode, eachNode) {
					var nodeQuote = $(eachNode);
					var text = self.normalize(nodeQuote.find('p').text());
					var author = self.normalize(self.swap(nodeQuote.find('small > a').text()));
					self.handle(text, author, [], null, 'de', false, request, response);
				});
			});
		});
		self.schedule(function() {
			self.fetch([ 'http://natune.net/zitate/', 'http://natune.net/zitate/Zufalls5' ], 1 * 60 * 60 * 1000, function(request, response) {
				$(response).find('ul.quotes > li').each(function(indexNode, eachNode) {
					var nodeQuote = $(eachNode);
					var text = self.normalize(nodeQuote.find('.quote_text').text());
					var author = self.normalize(nodeQuote.find('.quote_author > a').text());
					self.handle(text, author, [], null, 'de', false, request, response);
				});
			});
		});	
		self.schedule(function() {
			self.fetch([ 'http://www.zitate-online.de/literaturzitate/' ], 1 * 60 * 60 * 1000, function(request, response) {
				$(response).find('.witz').each(function(indexNode, eachNode) {
					var nodeQuote = $(eachNode);
					var text = self.normalize(nodeQuote.find('p.witztext').text());
					var author = self.normalize(nodeQuote.find('p.autor > a').text());
					var keywords = $.grep(nodeQuote.find('p.schlagworte > a').map(function(indexKeyword, eachKeyword) { return self.normalize($(eachKeyword).text()); }), function(keyword) { return keyword && keyword.length > 0; }).sort();
					self.handle(text, author, keywords, null, 'de', false, request, response);
				});
			});
		});
		self.schedule(function() {
			self.fetch([ 'http://www.global-av.ch/reiseberichte/kolumne/zeitzitate.html' ], 1 * 60 * 60 * 1000, function(request, response) {
				$(response).find('h2 ~ p').each(function(indexNode, eachNode) {
					var nodeQuote = $(eachNode);
					if (nodeQuote.prevAll('h3').length <= 0) {
						var rawText = nodeQuote.html();
						var text = self.normalizeHtml(rawText.slice(0, rawText.indexOf('<span')));
						var rawAuthor = nodeQuote.find('span.kursiv').text();
						var indexAuthor = rawAuthor.indexOf('(');
						var author = self.normalize((indexAuthor > 0 ? rawAuthor.slice(0, indexAuthor) : rawAuthor).replace(/<\s*\/?\s*br\s*\/?\s*>/g, ''));
						if (text && author) {
							self.handle(text, author, [], null, 'de', false, request, response);
						}
					}
				});
			});
		});
		self.schedule(function() {
			self.fetch([ 'http://www.hauenstein-rafz.ch/de/extra/zitate.php' ], 1 * 60 * 60 * 1000, function(request, response) {
				$(response).find('#ZitateZeigen ~ div.elementBox_var0').each(function(indexNode, eachNode) {
					var nodeQuote = $(eachNode);
					var rawText = nodeQuote.html();
					var text = self.normalizeHtml(rawText.slice(0, rawText.indexOf('<i')));
					var rawAuthor = nodeQuote.find('i').text();
					var matchAuthor = rawAuthor.match(/([a-zA-ZÀÁÂÃÄÅàáâãäåĀāąĄæÇçćĆčČđĐďĎÈÉÊËèéêëěĚĒēęĘÌÍÎÏìíîïĪīłŁÑñňŇńŃÒÓÔÕÕÖØòóôõöøŌōřŘŠšśŚťŤÙÚÛÜùúûüůŮŪūŸÿýÝŽžżŻźŹ\-'. ]*[a-zA-ZÀÁÂÃÄÅàáâãäåĀāąĄÇçćĆčČđĐďĎÈÉÊËèéêëěĚĒēęĘÌÍÎÏìíîïĪīłŁÑñňŇńŃÒÓÔÕÕÖØòóôõöøŌōřŘŠšśŚťŤÙÚÛÜùúûüůŮŪūŸÿýÝŽžżŻźŹ])(\s+\*?\d+\s*(-\s*(\d+))?\s*(v|n\.\s*Chr\.)?)?/);
					var author = matchAuthor ? self.normalize(matchAuthor[1]) : null;
					if (text && author) {
						self.handle(text, author, [], null, 'de', false, request, response);
					}
				});
			});
		});
		self.schedule(function() {
			self.fetch([ 'http://lebensweisheiten-sprueche.ch/kluge-schlaue-sprueche/', 'http://lebensweisheiten-sprueche.ch/schoene-sprueche-zum-nachdenken/', 'http://lebensweisheiten-sprueche.ch/lustige-sprueche/' ], 1 * 60 * 60 * 1000, function(request, response) {
				$(response).find('div.content section blockquote > p').each(function(indexNode, eachNode) {
					var nodeQuote = $(eachNode);
					var rawText = nodeQuote.html();
					var text = null;
					var author = null;
					var indexText = rawText.indexOf('<em');
					var matchText = rawText.match(/(<\s*\/?\s*br\s*\/?\s*>)(\s*↵*\s*(–|-)\s*)(.*)$/);
					var unsafe = false;
					if (matchText && matchText[0] && indexText <= 0) {
						indexText = rawText.indexOf(matchText[0]);
						if (indexText > 0) {
							text = self.normalizeHtml(rawText.slice(0, indexText));
							author = self.normalize(matchText[4]);
							unsafe = true;
						} 
					} else {
						if (indexText < 0) {
							unsafe = true;
						}
						text = self.normalizeHtml(rawText.slice(0, indexText));
						author = self.normalize(nodeQuote.find('em').text()) || 'Unbekannter Autor';

					}
					self.handle(text, author, [], null, 'de', unsafe, request, response);
				});
			});
		});
		window.setTimeout(function() {
			self.fetchSpecs();
		}, 100);
	},
	searchForText: function(text, callback, callbackOnAbort) {
		var self = this;
		if (text && text.replace(/^\s*/ig, '').replace(/\s*$/ig, '').length > 3) {
			self.searchForTerms(self.searchTerms(text), callback, callbackOnAbort);
		} else {
			if (callbackOnAbort) {
				callbackOnAbort();
			}
		}
	},
	searchForTerms: function(searchTerms, callback, callbackOnAbort) {
		var self = this;
		if (searchTerms && searchTerms.length > 0) {
			self.each(function(quote) {
				if (self.matchesSearchTerms(searchTerms, quote)) {
					if (callback) {
						callback(quote);
					}
				}
			});
		} else {
			if (callbackOnAbort) {
				callbackOnAbort();
			}
		}
	},
	schedule: function(callback) {
		var self = this;
		self.unschedule();
		self._specs.push(callback);
		self._timer = window.setInterval(function() {
			self.fetchSpecs();
		}, 1 * 60 * 60 * 1000);
	},
	fetchSpecs: function() {
		var self = this;
		$(self._specs).each(function(index, each) {
			each();
		});
	},
	unschedule: function() {
		var self = this;
		window.clearInterval(self._timer);
	},
	searchTerms: function(text) {
		var self = this;
		return $.grep(text.split(' '), function(substring) { return substring.length > 0; });

	},
	swap: function(text) {
		var self = this;
		var fragments = text.split(',');
		if (fragments && fragments.length === 2) {
			return self.normalize(fragments[1]) + ' ' + self.normalize(fragments[0]);
		}
		return text;
	},
	matchesSearchTerms: function (searchTerms, quote) {
		var self = this;
		var continueSearch = true;
		$(searchTerms).each(function(index, searchTerm) {
			if (continueSearch && !self.matchesSearchTerm(searchTerm, quote)) {
				continueSearch = false;
			}
		});
		return continueSearch;
	},
	matchesSearchTerm: function(searchTerm, quote) {
		var self = this;
		if (quote) {
			if (quote['quote'] && self.matchesSubstring(searchTerm, quote['quote'])) {
				return true;
			}
			if (quote['author'] && self.matchesSubstring(searchTerm, quote['author'])) {
				return true;
			}
			if (quote['source'] && self.matchesSubstring(searchTerm, quote['source'])) {
				return true;
			}
			if (quote['language'] && self.matchesSubstring(searchTerm, quote['language'])) {
				return true;
			}
			if (quote['keywords'] && $.grep(quote['keywords'], function(eachKeyword) { return self.matchesSubstring(searchTerm, eachKeyword); }).length > 0) {
				return true;
			}
		}
		return false;
	},
	matchesSubstring(searchTerm, text) {
		var self = this;
		return searchTerm && text && (text.indexOf(searchTerm) >= 0 || text.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0);
	},
	each: function(callback) {
		var self = this;
		for (key in self._quotes) {
			if (self._quotes.hasOwnProperty(key) && callback) {
				callback(self._quotes[key]);
			}
		}
	},	
	handle: function(text, author, keywords, source, language, unsafe, request, response) {
		var self = this;
		if (text) {
			if (self.isSafe(text) && self.isSafe(author) && $.allSatisfy(keywords, function(each) { return self.isSafe(each); })) {
				var quote = self.createNewQuote(text, author, keywords, source, language, unsafe, request, response);
				self.handleQuote(quote, request, response);
			} else {
				console.log([ '--- POSSIBLE ERROR --- ', text, author, keywords, source, language, unsafe, request, response ]);
			}
		}
	},
	isSafe: function(text) {
		return !text.match(/&\w+;/ig);
	},
	handleQuote: function(quote, request, response) {
		var self = this;
		if (quote) {
			if (request && request['quotes']) {
				request['quotes'].push(quote);
			}
			self.store(quote, request, response);
		}
	},
	append: function(quote, request, response) {
		var self = this;
		var container = $('#quotes');
		var node = $('<li class="quote"></li>');
		self.appendQuote(quote, node);
		container.append(node);
	},
	appendQuote: function(quote, jqNode) {
		var self = this;
		if (quote['quote']) {
			var nodeQuote = $('<q class="quote-text">' + quote['quote'] + '</q>');
			self.editable(nodeQuote);
			jqNode.append(nodeQuote);
		} 
		if (quote['author']) {
			var nodeAuthor = $('<span class="quote-author">' + quote['author'] + '</span>');
			self.editable(nodeAuthor);
			jqNode.append(nodeAuthor);
		}
		if (quote['keywords'] && quote['keywords'].length > 0) {
			var keywords = $('<div class="quote-keywords">');
			$(quote['keywords']).each(function(index, each) {
				keywords.append($('<span class="quote-keyword">' + each + '</span>'))
			})
			jqNode.append(keywords);
		}
		if (quote['source']) {
			var nodeSource = $('<cite class="quote-source">' + quote['source'] + '</cite>');
			self.editable(nodeSource);
			jqNode.append(nodeSource);
		}
	},
	editable: function(jqNode) {
		var self = this;
		var editor = null;
		var text = null;
		$(jqNode).hover(function(event) {
			text = jqNode.text();
			editor = $('<div class="editor" contentEditable="true">' + text + '</div>')
			jqNode.empty().append(editor);
		}, function(event) {
			if (editor) {
				jqNode.empty().text(editor.text());
				editor = null;
				text = null;
			}
		});
	},
	minimizeRequest: function(request) {
		var self = this;
		return { 
			'timestamp': request['timestamp'], 
			'url': request['url'], 
			'duration': request['duration'] 
		};
	},
	fetch: function(urlOrUrls, interval, callback) {
		var self = this;
		if (urlOrUrls) {
			if (typeof urlOrUrls ===  "string") {
				self.fetchOne(urlOrUrls, interval, callback);
			} else {
				if (typeof urlOrUrls ===  "object") {
					self.fetchAll(urlOrUrls, interval, callback);
				} else {
					console.log("invalid url: " + urlOrUrls);
				}
			}
		}
	},
	fetchOne: function(url, interval, callback) {
		var self = this;
		if (self.canRequestUrl(url, interval, callback)) {
			var request = self.createNewRequest(url, interval, callback);
			console.log("fetching " + url);		
			try {
				$.get(url, function(response) {
					request['response'] = response;
					try {
						if (response) {
							callback(request, response);
							self.save(request, response);
						}
					} catch (error) {
						request['error'] = error;
						console.log('callback error');
						console.log(error);
					}	
					request['duration'] = self.timestamp() - request['timestamp'];
				});
			} catch (error) {
				request['error'] = error;
				console.log('get error');
			}
		} else {
			console.log('cannot request');
		}
	},
	fetchAll: function(urls, interval, callback) {
		var self = this;
		$(urls).each(function(index, each) {
			self.fetchOne(each, interval, callback);
		});
	},
	canRequestUrl: function(url, interval, callback) {
		var self = this;
		if (!url || !callback) {
			return false;
		}
		if (interval && interval > 0 && self._requests) {
			for (i = self._requests.length - 1; i >= 0; i--) {
				var request = self._requests[i];
				if (request && request['url'] == url) {
					if (request['timestamp'] && request['timestamp'] + interval > self.timestamp()) {
						return false;
					}
				}
			}
		}
		return true;
	},
	createNewRequest: function(url, interval, callback) {
		var self = this;
		var newRequest = {
			'url': url,
			'interval': interval,
			'callback': callback,
			'timestamp': self.timestamp(),
			'response': null,
			'quotes': [],
			'error': null,
			'duration': null
		}
		self._requests.push(newRequest);
		return newRequest;
	},
	createNewQuote: function(quote, author, keywords, source, language, unsafe, request, response) {
		var self = this;
		var newQuote = {};
		if (quote) {
			newQuote['quote'] = quote;
		}
		if (author) {
			newQuote['author'] = author;
		}
		if (keywords && typeof keywords === 'object' && keywords.length > 0) {
			newQuote['keywords'] = keywords;
		}
		if (language) {
			newQuote['language'] = language;
		}
		if (source) {
			newQuote['source'] = source;
		}
		newQuote['timestamp'] = (request && request.timestamp ? request.timestamp : null) || self.timestamp();
		newQuote['unsafe'] = !!unsafe;
		return newQuote;
	},
	store: function(quote, request, response) {
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
	timestamp: function() {
		return (new Date()).getTime();
	},
	normalize: function(text) {
		return (text || '')
				.replace(/[^a-zA-Z0-9ÀÁÂÃÄÅàáâãäåĀāąĄæÇçćĆčČđĐďĎÈÉÊËèéêëěĚĒēęĘÌÍÎÏìíîïĪīłŁÑñňŇńŃÒÓÔÕÕÖØòóôõöøŌōřŘŠšśŚťŤÙÚÛÜùúûüůŮŪūŸÿýÝŽžżŻźŹ.,:;?!\-='¿´_%&/()+*°§$£€… ]/, '')
				.replace('ß', 'ss')
				.replace('"', '')
				.replace('“', '')
				.replace(/^\s+/, '')
				.replace(/\s+$/, '');
	},
	normalizeHtml: function(html) {
		var self = this;
		return self.normalize((html || '')
				.replace(/<\s*\/?\s*br\s*\/?\s*>/ig, '\n')
				.replace(/&nbsp;/ig, ' ')
				.replace(/\s\s+/ig, ' '));
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
	updateStats: function(results) {
		var self = this;
		var text = '';
		if (results) {
			text = 'Displaying ' + results.length + ' of ' + self.size() + ' quotes';
		} else {
			text = self.size() + ' quotes available';
		}
		$('#stats').empty().text(text);
	},
	size: function() {
		var self = this;
		var length = 0;
		self.each(function() {
			length++;
		});
		return length;
	}
};

String.prototype.hashCode = function() {
	var hash = 0, i = 0, len = this.length, chr;
	while ( i < len ) {
		hash  = ((hash << 5) - hash + this.charCodeAt(i++)) << 0;
	}
	return hash;
};

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

$.allSatisfy = function(array, callback) {
	return array && $.grep(array, function(each) { return callback(each); }).length === array.length;
};

$.unique = function(list) {
	var result = [];
	$.each(list, function(index, each) {
		if ($.inArray(each, result) == -1) {
			if (each) {
				result.push(each);
			}
		}
	});
	return result;
};

$.isSameArray = function(array1, array2) {
	for (var object in array1) {
		if (!$.inArray(object, array2)) {
			return false;
		}
	}
	for (var object in array2) {
		if (!$.inArray(object, array1)) {
			return false;
		}
	}
	return true;
};

$(document).ready(function() {
	Quotes.setup();
});