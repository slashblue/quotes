Settings = {
	getDBFilePath: function() {
		return this.getSettings().db;
	},
	getLogFilePath: function() {
		return this.getSettings().log;
	},
	getSettings: function() {
		if (window && window.electron && window.electron.remote && window.electron.remote.getGlobal) {
			return window.electron.remote.getGlobal('settings');
		} else {
			console.log('FATAL: unable to get global objectfrom main process');
			return {};
		}
	},
	getOptions: function(key, fallbackValue) {
		var settings = this.getSettings().options;
		if (settings && settings.hasOwnProperty(key)) {
			return settings[key] || fallbackValue;
		} else {
			return fallbackValue;
		}
	},
	isDesktop: function() {
		return this.getOptions('desktop', false);
	},
	isWindow: function() {
		return !this.isDesktop();
	}
};