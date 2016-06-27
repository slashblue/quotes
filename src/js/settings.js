Settings = {
	getDBFilePath: function() {
		return this.getGlobal().db;
	},
	getLogFilePath: function() {
		return this.getGlobal().log;
	},
	getGlobal: function() {
		if (window.electron && window.electron.remote && window.electron.remote.getGlobal) {
			return window.electron.remote.getGlobal('settings');
		} else {
			console.log('FATAL: unable to get global objectfrom main process');
			return {};
		}
	},
	isDesktop: function() {
		return !!this.getGlobal().config.desktop;
	},
	isWindow: function() {
		return !this.isDesktop();
	}
};