QuotesFetcher = function() {
	this._interval = 5 * 60 * 1000;
	this._specs = [];
	this._requests = [];
	this._timer = null;
	this._onHandleQuote = function(quote, request, response) {};
	this._onAfterFetch = function(request, response) {};
	this._onFetchAborted = function(url, interval, callback) {};
	this._onBeforeFetch = function(request) {};
};

QuotesFetcher.prototype = {
	register: function(urls, interval, callback) {
		var self = this;
		self.schedule(function() {
			self.fetch(urls, interval, function(request, response) {
				callback(request, response, function(text, author, keywords, source, language, safe) {
					self.handle(text, author, keywords, source, language, safe, request, response);
				});
			});
		});
	},
	setUp: function() {
		var self = this;
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
		}, self._interval);
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
		if (self.canFetchUrl(url, interval, callback)) {
			var request = new QuotesRequest(url, interval, callback);
			self._requests.push(request);
			request.onBefore(function() {
				if (self._onBeforeFetch) {
					self._onBeforeFetch(request);
				}
			});
			request.onSuccess(function() {
				if (self._onAfterFetch) {
					self._onAfterFetch(request, request.response);
				}
			});
			request.onError(function(error) {
				console.log(error);
			});
			request.get();
		} else {
			if (self._onFetchAborted) {
				self._onFetchAborted(url, interval, callback);
			}
		}
	},
	fetchAll: function(urls, interval, callback) {
		var self = this;
		$(urls).each(function(index, each) {
			self.fetchOne(each, interval, callback);
		});
	},
	canFetchUrl: function(url, interval, callback) {
		var self = this;
		if (!url || !callback) {
			return false;
		}
		if (interval && interval > 0 && self._requests) {
			for (i = self._requests.length - 1; i >= 0; i--) {
				var request = self._requests[i];
				if (request && request.url == url) {
					if (request.timestamp && request.timestamp + interval > $.timestamp()) {
						return false;
					}
				}
			}
		}
		return true;
	},
	onHandleQuote: function(callback) {
		this._onHandleQuote = callback;
	},
	onHandleUnsafeQuote: function(callback) {
		this._onHandleUnsafeQuote = callback;
	},
	onAfterFetch: function(callback) {
		this._onAfterFetch = callback;
	},
	onFetchAborted: function(callback) {
		this._onFetchAborted = callback;
	},
	handle: function(text, author, keywords, source, language, safe, request, response) {
		var self = this;
		if (text) {
			var quote = new Quote(text, author, keywords, source, language, ((request && request.timestamp ? request.timestamp : null) || $.timestamp()), safe);
			if (request) {
				request['quotes'].push(quote);
			}
			if (self.isSafe(text) && self.isSafe(author) && $.allSatisfy(keywords, function(each) { return self.isSafe(each); })) {
				if (self._onHandleQuote) {
					self._onHandleQuote(quote, request, response);
				}
			} else {
				if (self._onHandleUnsafeQuote) {
					self._onHandleUnsafeQuote(quote, request, response);
				}
			}
		}
	},
	isSafe: function(text) {
		return !text.match(/&\w+;/ig);
	},
	forJSON: function() {
		var self = this;
		return $(self._requests).map(function(indexRequest, eachRequest) { return eachRequest.forJSON(); }).toArray();
	},

};