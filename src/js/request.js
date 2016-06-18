QuotesRequests = {
	create: function() {
		return [];
	},
	read: function(array) {
		return $($.grep($(array || []), function(each) { return !!each; })).map(function(index, each) { return new QuotesRequest().fromJSON(each); }).toArray();
	},
	write: function(array) {
		return $($.grep($(array || []), function(each) { return !!each; })).map(function(index, each) { return each.forJSON(); }).toArray();
	}
};

QuotesRequest = function(url, interval, callback) {
	this.type = 'request';
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
	this._onBefore = function() {};
	this._onSuccess = function() {};
};

QuotesRequest.prototype = {
	get: function() {
		var self = this;
		try {
			self.start = $.timestamp();
			if (self._onBefore) {
				self._onBefore();
			}
			$.get(self.url, function(response) {
				try {
					self.response = response;
					if (self.callback && response) {
						self.callback(self, response);
					}
					if (self._onSuccess) {
						self._onSuccess();
					}
				} catch (error) {
					self.handleError(error);
				}
				self.stop = $.timestamp();
				self.duration = (self.stop || 0) - (self.start || 0);

			});
		} catch (error) {
			self.handleError(error);
		}
	},
	onBefore: function(callback) {
		this._onBefore = callback;
	},
	onError: function(callback) {
		this._onError = callback;
	},
	onSuccess: function(callback) {
		this._onSuccess = callback;
	},
	handleError: function(error) {
		this.errors.push(error);
		if (this._onError) {
			this._onError(error);
		}
	},
	equals: function(request) {
		return this === request || (this.type == request.type && this.url == request.url);
	},
	forJSON: function() {
		return {
			'type': this.type,
			'url': this.url,
			'interval': this.interval,
			'start': this.start,
			'stop': this.stop,
			'duration': this.duration,
			'timestamp': this.timestamp
		}
	},
	fromJSON: function(data) {
		this.type = data.type;
		this.url = data.url;
		this.interval = data.interval;
		this.timestamp = data.timstamp;
		this.start = data.start;
		this.stop = data.stop;
		this.duration = data.duration;
	}
};