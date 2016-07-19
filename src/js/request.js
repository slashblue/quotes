/*
 * @requires common.js
 */

 QuotesRequests = {
	create: function() {
		return [];
	},
	read: function(array) {
		return $.grep($($.grep($(array || []), function(each) { return !!each; })).map(function(index, each) { return new QuotesRequest().fromJSON(each); }).toArray(), function(each) { return !!each && !each.isOutdated(); });
	},
	write: function(array) {
		return $($.grep($(array || []), function(each) { return !!each && !each.isOutdated(); })).map(function(index, each) { return each.forJSON(); }).toArray();
	}
};

QuotesRequest = function(url, interval, callback) {
	this.initialize(url, interval, callback);
	return this;
};

QuotesRequest.prototype = {
	initialize: function(url, interval, callback) {
		this._type = 'QuotesRequest';
		this.url = url;
		this.interval = interval || (1 * 60 * 60 * 1000); // hourly by default
		this.callback = callback;
		this.timestamp = $.timestamp();
		this.response = null;
		this.quotes = [];
		this.errors = [];
		this.start = null;
		this.stop = null;
		this.duration = 0;
		this._onError = function(error) {};
		this._onSuccess = function() {};
	},
	setUp: function() {
	},
	tearDown: function() {
	},
	getHtml: function() {
		var self = this;
		try {
			self.start = $.timestamp();
			$.get(self.url, function(response) {
				try {
					self.response = response;
					if (self.callback && response) {
						logger.log('debug', 'QuotesRequest.onCallback', { 'url': self.url, 'response': response });
						self.callback(self, response);
					}
					if (self._onSuccess) {
						logger.log('debug', 'QuotesRequest.onSuccess', { 'url': self.url, 'response': response });
						self._onSuccess();
					}
				} catch (error) {
					self.handleError(error, response);
				}
				self.stop = $.timestamp();
				self.duration = (self.stop || 0) - (self.start || 0);
			});
		} catch (error) {
			self.handleError(error);
		}
	},
	onError: function(callback) {
		this._onError = callback;
	},
	onSuccess: function(callback) {
		this._onSuccess = callback;
	},
	handleError: function(error, response) {
		this.errors.push(error);
		if (this._onError) {
			logger.log('error', 'QuotesRequest.onError', { 'error': error, 'url': this.url });
			this._onError(error, response);
		}
	},
	equals: function(request) {
		return this === request || (typeof this == typeof request && this._type == request.type && this.url == request.url);
	},
	isOutdated: function() {
		return this.timestamp + this.interval < $.timestamp();
	},
	canRequest: function(requests) {
		if (!this.url || !this.callback) {
			return false;
		}
		if (requests) {
			for (i = requests.length - 1; i >= 0; i--) {
				var request = requests[i];
				if (this.equals(request)) {
					if (request.timestamp && request.interval && request.timestamp + request.interval > $.timestamp()) {
						return false;
					}
				}
			}
		}
		return true;
	},
	forJSON: function() {
		return {
			'type': this._type,
			'url': this.url,
			'interval': this.interval,
			'start': this.start,
			'stop': this.stop,
			'duration': this.duration,
			'timestamp': this.timestamp
		}
	},
	fromJSON: function(data) {
		this._type = data.type;
		this.url = data.url;
		this.interval = data.interval;
		this.timestamp = data.timestamp;
		this.start = data.start;
		this.stop = data.stop;
		this.duration = data.duration;
		return this;
	}
};