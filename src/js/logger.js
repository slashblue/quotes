/*
 * @requires settings.js
 */

 if (winston && winston.Logger) {
	logger = window.logger = new (winston.Logger)({
		transports: [
			new (winston.transports.Console)({ 
				level: 'warn'
			}),
			(logrotate && logrotate.Rotate) ? 
				(new logrotate.Rotate({
					file: Settings ? Settings.getLogFilePath() : '/fatal.log',
					timestamp: true,
					max: '100m',
					keep: 7,
					compress: true,
					level: 'info' 
				})) : 
				(new (winston.transports.File)({
					filename: Settings ? Settings.getLogFilePath() : '/fatal.log',
					level: 'info'
				}))
		]
	});
} else {
	logger = window.logger = {
		log: function() {
			console.log('log', arguments);
		},
		error: function() {
			console.log('error', arguments);
		},
		warn: function() {
			console.log('warn', arguments);
		},
		info: function() {
			console.log('info', arguments);
		},
		debug: function() {
			console.log('debug', arguments);
		},
		silly: function() {
			console.log('silly', arguments);
		}
	};
}
