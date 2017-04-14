
QuotesFetcherSpec = function() {
	return this;
}

QuotesFetcherSpec.prototype = {
	initialize: function(fetcher, database) {
		var self = this;
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
	}
};