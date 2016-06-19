LoggerConsole = {
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

if (winston && winston.Logger) {
	logger = window.logger = new (winston.Logger)({
		transports: [
			new (winston.transports.Console)({ 
				level: 'warn'
			}),
			new (winston.transports.File)({ 
				filename: './logs/app.log', 
				level: 'info' 
			})
		]
	});
} else {
	logger = window.logger = LoggerConsole;
}
