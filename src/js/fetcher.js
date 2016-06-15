QuotesFetcher = function() {
	this._specs = [];
	this._requests = [];
	this._timer = null;
	this._onHandleQuote = function(quote, request, response) {};
	this._onFetchFinished = function(request, response) {};
};

QuotesFetcher.prototype = {
	/*
	register: function(urls, interval, callback) {
		var self = this;
		self.fetch(urls, interval, function(request, response) {
			callback(request, response, function(text, author, keywords, source, language, safe) {
				self.handle(text, author, keywords, source, language, safe, request, response);
			});
		});
	},
	*/
	setUp: function() {
		var self = this;
		/*
		self.register('http://www.brainyquote.com/quotes_of_the_day.html', function(request, response, callback) {
			$(response).find('.bqQt').each(function(indexNode, eachNode) {
				var nodeQuote = $(eachNode);
				var text = $.normalize(nodeQuote.find('.bqQuoteLink > a').text());
				var author = $.normalize(nodeQuote.find('.bq-aut > a').text());
				var keywords = $.normalizeList(nodeQuote.find('.bq_q_nav a').map(function(indexKeywords, eachKeyword) { return $(eachKeyword).text(); }));
				callback(text, author, keywords, null, 'en', false, request, response);
			});
		});
		*/
		self.schedule(function() {
			self.fetch('http://www.brainyquote.com/quotes_of_the_day.html', 1 * 60 * 60 * 1000, function(request, response) {
				$(response).find('.bqQt').each(function(indexNode, eachNode) {
					var nodeQuote = $(eachNode);
					var text = $.normalize(nodeQuote.find('.bqQuoteLink > a').text());
					var author = $.normalize(nodeQuote.find('.bq-aut > a').text());
					var keywords = $.normalizeList(nodeQuote.find('.bq_q_nav a').map(function(indexKeywords, eachKeyword) { return $(eachKeyword).text(); }));
					self.handle(text, author, keywords, null, 'en', true, request, response);
				});
			});
		});	
		self.schedule(function() {
			self.fetch([ "http://www.quotationspage.com/qotd.html", "http://www.quotationspage.com/mqotd.html", "http://www.quotationspage.com/random.php3" ], 1 * 60 * 60 * 1000, function(request, response) {
				$(response).find('#content > dl > dt.quote').each(function(indexNode, eachNode) {
					var nodeQuote = $(eachNode);
					var text = $.normalize(nodeQuote.find("a").text());
					var nodeAuthor = nodeQuote.next("dd.author");
					if (nodeAuthor && nodeAuthor[0]) {
						var author = $.normalize(nodeAuthor.find("b > a").text());
						var keywords = $.normalizeList([ nodeAuthor.find("div.related > a").text() ]);
						self.handle(text, author, keywords, null, 'en', true, request, response);
					}
				});
			});
		});
		self.schedule(function() {
			self.fetch('http://www.brainyquote.com', 1 * 60 * 60 * 1000, function(request, response) {
				var nodeQuote = $(response).find('.bqcpx');
				var text = $.normalize(nodeQuote.find('div.bq-slide-q-text > a').text());
				var author = $.normalize(nodeQuote.find('a.ws-author').text());
				self.handle(text, author, [], null, 'en', true, request, response);
			});
		});
		self.schedule(function() {
			self.fetch('http://www.goodreads.com/quotes', 1 * 60 * 60 * 1000, function(request, response) {
				$(response).find('.quotes .quote').each(function(indexNode, eachNode) {
					var nodeQuote = $(eachNode);
					var rawText = nodeQuote.find('.quoteText').text().match(/\u201C(.*)\u201D/g)[0];
					var text = $.normalize(rawText.slice(1, rawText.length - 1));
					var author = $.normalize(nodeQuote.find('.quoteText > a.authorOrTitle').text());
					var keywords = $.normalizeList($.grep(nodeQuote.find('.quoteFooter > div.smallText > a').map(function(indexKeywords, eachKeyword) { return $.normalize($(eachKeyword).text()).capitalize(); }), function(eachKeyword) { return eachKeyword && eachKeyword.length > 0 && eachKeyword.indexOf('no-source') < 0 && eachKeyword.indexOf('attributed') < 0 && eachKeyword.indexOf('Attributed') < 0; }));
					var source = $.normalize(nodeQuote.find('.quoteText > span > a.authorOrTitle').text());
					self.handle(text, author, keywords, null, 'en', true, request, response);
				});
			});
		});
		self.schedule(function() {
			self.fetch('http://zitate.net/', 1 * 60 * 60 * 1000, function(request, response) {
				$(response).find('div > table.a-auto').each(function(indexNode, eachNode) {
					var nodeQuote = $(eachNode);
					var text = $.normalize(nodeQuote.find('table.a-auto span.quote').text());
					var author = $.normalize(nodeQuote.find('table.a-auto a.quote-btn').text());
					self.handle(text, author, [], null, 'de', true, request, response);
				});
			});
		});
		self.schedule(function() {
			self.fetch([ 'http://zitatezumnachdenken.com/', 'http://zitatezumnachdenken.com/zufaellig' ], 1 * 60 * 60 * 1000, function(request, response) {
				$(response).find('div.post').each(function(indexNode, eachNode) {
					var nodeQuote = $(eachNode);
					var text = $.normalize(nodeQuote.find('.stripex > a > p').text());
					var author = $.normalize(nodeQuote.find('div.authorInLoop > a').text());
					var keywords = $.normalizeList($($.grep($(nodeQuote).attr('class').split(' '), function(className) { return className && className.indexOf('tag-') >= 0; })).map(function(indexClassName, eachClassName) { return $.normalize(eachClassName.replace('tag-', '')).capitalize(); }));
					self.handle(text, author, keywords, null, 'de', true, request, response);
				});
			});
		});
		self.schedule(function() {
			self.fetch([ 'https://www.aphorismen.de/top10?rubrik=zitate', 'https://www.aphorismen.de/suche?spezial=zufall' ], 1 * 60 * 60 * 1000, function(request, response) {
				$(response).find('li.context').each(function(indexNode, eachNode) {
					var nodeQuote = $(eachNode);
					var text = $.normalize(nodeQuote.find('p.spruch > a').text());
					var author = $.normalize(nodeQuote.find('p.autor > a').text());
					self.handle(text, author, [], null, 'de', true, request, response);
				});
			});
		});
		self.schedule(function() {
			self.fetch([ 'http://www.zitate.de/' ], 1 * 60 * 60 * 1000, function(request, response) {
				$(response).find('.quote-box blockquote').each(function(indexNode, eachNode) {
					var nodeQuote = $(eachNode);
					var text = $.normalize(nodeQuote.find('p').text());
					var author = $.normalize(self.swap(nodeQuote.find('small > a').text()));
					self.handle(text, author, [], null, 'de', true, request, response);
				});
			});
		});
		self.schedule(function() {
			self.fetch([ 'http://natune.net/zitate/', 'http://natune.net/zitate/Zufalls5' ], 1 * 60 * 60 * 1000, function(request, response) {
				$(response).find('ul.quotes > li').each(function(indexNode, eachNode) {
					var nodeQuote = $(eachNode);
					var text = $.normalize(nodeQuote.find('.quote_text').text());
					var author = $.normalize(nodeQuote.find('.quote_author > a').text());
					self.handle(text, author, [], null, 'de', true, request, response);
				});
			});
		});	
		self.schedule(function() {
			self.fetch([ 'http://www.zitate-online.de/literaturzitate/' ], 1 * 60 * 60 * 1000, function(request, response) {
				$(response).find('.witz').each(function(indexNode, eachNode) {
					var nodeQuote = $(eachNode);
					var text = $.normalize(nodeQuote.find('p.witztext').text());
					var author = $.normalize(nodeQuote.find('p.autor > a').text());
					var keywords = $.normalizeList(nodeQuote.find('p.schlagworte > a').map(function(indexKeyword, eachKeyword) { return $(eachKeyword).text(); }));
					self.handle(text, author, keywords, null, 'de', true, request, response);
				});
			});
		});
		self.schedule(function() {
			self.fetch([ 'http://www.global-av.ch/reiseberichte/kolumne/zeitzitate.html' ], 1 * 60 * 60 * 1000, function(request, response) {
				$(response).find('h2 ~ p').each(function(indexNode, eachNode) {
					var nodeQuote = $(eachNode);
					if (nodeQuote.prevAll('h3').length <= 0) {
						var rawText = nodeQuote.html();
						var text = $.normalizeHtml(rawText.slice(0, rawText.indexOf('<span')));
						var rawAuthor = nodeQuote.find('span.kursiv').text();
						var indexAuthor = rawAuthor.indexOf('(');
						var author = $.normalize((indexAuthor > 0 ? rawAuthor.slice(0, indexAuthor) : rawAuthor).replace(/<\s*\/?\s*br\s*\/?\s*>/g, ''));
						if (text && author) {
							self.handle(text, author, [], null, 'de', true, request, response);
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
					var text = $.normalizeHtml(rawText.slice(0, rawText.indexOf('<i')));
					var rawAuthor = nodeQuote.find('i').text();
					var matchAuthor = rawAuthor.match(/([a-zA-ZÀÁÂÃÄÅàáâãäåĀāąĄæÇçćĆčČđĐďĎÈÉÊËèéêëěĚĒēęĘÌÍÎÏìíîïĪīłŁÑñňŇńŃÒÓÔÕÕÖØòóôõöøŌōřŘŠšśŚťŤÙÚÛÜùúûüůŮŪūŸÿýÝŽžżŻźŹ\-'. ]*[a-zA-ZÀÁÂÃÄÅàáâãäåĀāąĄÇçćĆčČđĐďĎÈÉÊËèéêëěĚĒēęĘÌÍÎÏìíîïĪīłŁÑñňŇńŃÒÓÔÕÕÖØòóôõöøŌōřŘŠšśŚťŤÙÚÛÜùúûüůŮŪūŸÿýÝŽžżŻźŹ])(\s+\*?\d+\s*(-\s*(\d+))?\s*(v|n\.\s*Chr\.)?)?/);
					var author = matchAuthor ? $.normalize(matchAuthor[1]) : null;
					if (text && author) {
						self.handle(text, author, [], null, 'de', true, request, response);
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
					self.handle(text, author, [], null, 'de', safe, request, response);
				});
			});
		});
		window.setTimeout(function() {
			self.fetchSpecs();
		}, 100);
	},
	schedule: function(callback) {
		var self = this;
		self.unschedule();
		self._specs.push(callback);
		self._timer = window.setInterval(function() {
			self.fetchSpecs();
		}, 5 * 60 * 1000);
	},
	unschedule: function() {
		var self = this;
		window.clearInterval(self._timer);
		self._timer = null;
	},
	fetchSpecs: function() {
		var self = this;
		$(self._specs).each(function(index, each) {
			each();
		});
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
							if (self._onFetchFinished) {
								self._onFetchFinished(request, response);
							}
						}
					} catch (error) {
						request['error'] = error;
						console.log('callback error');
						console.log(error);
					}	
					request['duration'] = $.timestamp() - request['timestamp'];
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
					if (request['timestamp'] && request['timestamp'] + interval > $.timestamp()) {
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
			'timestamp': $.timestamp(),
			'response': null,
			'quotes': [],
			'error': null,
			'duration': null
		}
		self._requests.push(newRequest);
		return newRequest;
	},
	createNewQuote: function(quote, author, keywords, source, language, safe, request, response) {
		var newQuote = new Quote(quote, author, keywords, source, language, !!safe);
		newQuote.setTimestamp((request && request.timestamp ? request.timestamp : null) || $.timestamp());
		return newQuote;
	},
	swap: function(text) {
		var self = this;
		var fragments = text.split(',');
		if (fragments && fragments.length === 2) {
			return $.normalize(fragments[1]) + ' ' + $.normalize(fragments[0]);
		}
		return text;
	},
	onHandleQuote: function(callback) {
		this._onHandleQuote = callback;
	},
	onFetchFinished: function(callback) {
		_onFetchFinished = callback;
	},
	handle: function(text, author, keywords, source, language, safe, request, response) {
		var self = this;
		if (text) {
			if (self.isSafe(text) && self.isSafe(author) && $.allSatisfy(keywords, function(each) { return self.isSafe(each); })) {
				var quote = self.createNewQuote(text, author, keywords, source, language, safe, request, response);
				if (request) {
					request['quotes'].push(quote);
				}
				if (self._onHandleQuote) {
					self._onHandleQuote(quote, request, response);
				}
			} else {
				console.log([ '--- POSSIBLE ERROR --- ', text, author, keywords, source, language, safe, request, response ]);
			}
		}
	},
	isSafe: function(text) {
		return !text.match(/&\w+;/ig);
	},
	getRequests: function() {
		var self = this;
		return $(self._requests).map(function(indexRequest, eachRequest) { return self.minimizeRequest(eachRequest); }).toArray();
	},
	minimizeRequest: function(request) {
		var self = this;
		return { 
			'timestamp': request['timestamp'], 
			'url': request['url'], 
			'duration': request['duration'] 
		};
	}
};