QuotesEditors = {
	setUp: function() {
		var self = this;
		$(document).on('keydown.globaleditor', function(event) {
			if (event.keyCode == 27) {
				self.abort(event);
			}
		});
	},
	abort: function(event) {
		this.each(function(each) {
			each.abort(event);
		});
	},
	detach: function(event) {
		this.each(function(each) {
			each.abort(event);
			each.detach();
		});
	},
	each: function(callback, jqNode) {
		if (callback) {
			(jqNode ? $(jqNode.find('.editor')) : $('.editor')).each(function(index, each) {
				var editor = $(each).parent().data('editor');
				if (editor) {
					callback(editor);
				}
			});
		}
	}
};
QuotesEditors.setUp();


QuotesStringEditor = function(jqNode) {
	this.type = 'QuotesStringEditor';
	this._node = $(jqNode);
	this._editor = null;
	this._text = null;
	this._timerScheduled = null;
	this._timerState = null;
	this._onChange = function(event) {};
	this._onSave = function(event) {};
	this._onCancel = function(event) {};
	return this;
};


QuotesStringEditor.prototype = {
	setUp: function() {
		var self = this;
		self._node.hover(function(event) {
			window.clearTimeout(self._timerScheduled);
			self._timerScheduled = null;
			self.start(event);
		}, function(event) {
			self.stopDelayed(event);
		});
		self._node.on('keydown.editor', function(event) {
			if (event.keyCode == 27) {
				self.abort(event);
				return false;
			}
			if ((event.ctrlKey || event.metaKey) && ($.isKeyEvent('s', event) || $.isKeyEvent('S', event))) {
				self.save(event);
				return false;
			}
		});
		self._node.on('keyup.editor', function(event) {
			if (self.hasChanged()) {
				self.dirty();
				if (self._onChange) {
					logger.log('debug', 'QuotesEditor.onChange');
					self._onChange(event);
				}
			} else {
				self.clean();
			}
		});
		self._node.on('click.editor', function(event) {
			if (self._onFocus) {
				logger.log('debug', 'QuotesEditor.onFocus');
				self._onFocus(event);
			}
		});
	},
	tearDown: function() {
		this._node.off();
		this.stop();
	},
	attach: function() {
		logger.log('debug', 'QuotesEditor.attach');
		this._node.data('editor', this);
		this._node.parent().addClass('editable');
	},
	detach: function() {
		logger.log('debug', 'detach');
		this._node.parent().removeClass('editable');
		this._node.data('editor', null);
	},
	start: function(event) {
		if (!this.isEditing()) {
			logger.log('debug', 'QuotesEditor.start');
			this._start(event);
		}
	},
	_start: function(event) {
		this.setOriginalText(this._node.text());
		this._editor = $('<div class="editor" contentEditable="true">' + this.getOriginalText() + '</div>');
		this._node.empty().append(this._editor);
	},
	stop: function(event) {
		if (this.isEditing() && !this.hasChanged()) {
			logger.log('debug', 'QuotesEditor.stop');
			this._stop(event);
			this.clean();
			if (this._onCancel) {
				logger.log('debug', 'QuotesEditor.stop.onCancel');
				this._onCancel(event);
			}
		}
	},
	_stop: function(event) {
		this._node.empty().text(this.getCurrentText());
		this._editor = null;
		this.setOriginalText(null);
	},
	stopDelayed: function(event) {
		var self = this;
		logger.log('debug', 'QuotesEditor.stopDelayed');
		window.clearTimeout(self._timerScheduled);
		self._timerScheduled = window.setTimeout(function() {
			self._timerScheduled = null;
			self.stop(event);
		}, 2000);
	},
	abort: function(event) {
		if (this.isEditing()) {
			logger.log('debug', 'QuotesEditor.abort');
			this._abort(event);
			this.clean();
			if (this._onCancel) {
				logger.log('debug', 'QuotesEditor.abort.onCancel');
				this._onCancel(event);
			}
		}
	},
	_abort: function(event) {
		this._node.empty().text(this.getOriginalText());
		this._editor = null;
		this.setOriginalText(null);
	},
	save: function(event) {
		if (this.isEditing()) { 
			logger.log('debug', 'QuotesEditor.save');
			if (this._onSave) {
				if (this.hasChanged()) {
					try {		
						this._save(event);
						this.clean();
					} catch (error) {
						this.fail();
					}
				}
			}
		}
	},
	_save: function() {
		if (this._onSave(this.getOriginalText(), this.getCurrentText(), event)) {
			this.setOriginalText(this.getCurrentText());
			this.success();
		} else {
			this.abort();
			this.fail();
		}
	},
	isEditing: function() {
		return !!this._editor;
	},
	hasChanged: function() {
		return this.isEditing() && this.getOriginalText() != this.getCurrentText();
	},
	getOriginalText: function() {
		return this._text;
	},
	setOriginalText: function(text) {
		this._text = text;
	},
	getCurrentText: function() {
		return $.normalize(this._editor.text());
	},
	onSave: function(callback) {
		this._onSave = callback;
	},
	onChange: function(callback) {
		this._onChange = callback;
	},
	onFocus: function(callback) {
		this._onFocus = callback;
	},
	onCancel: function(callback) {
		this._onCancel = callback;
	},
	success: function() {
		var self = this;
		logger.log('debug', 'QuotesEditor.success');
		self._node.removeClass('fail').addClass('success');
		window.clearTimeout(self._timerState);
		self._timerState = window.setTimeout(function() {
			self._node.removeClass('success');
		}, 500);
	},
	fail: function() {
		var self = this;
		logger.log('debug', 'QuotesEditor.fail');
		self._node.removeClass('success').addClass('fail');
		window.clearTimeout(self._timerState);
		self._timerState = window.setTimeout(function() {
			self._node.removeClass('fail');
		}, 500);
	},
	dirty: function() {
		logger.log('debug', 'QuotesEditor.dirty');
		this._node.addClass('dirty');
		this._node.parent().addClass('dirty-child');
	},
	clean: function() {
		logger.log('debug', 'QuotesEditor.clean');
		this._node.removeClass('dirty');
		if (this._node.parent().find('.dirty').length <= 0) {
			this._node.parent().removeClass('dirty-child');
		};
	}
};


QuotesListEditor = function(jqNode, htmlTemplate) {
	this.type = 'QuotesListEditor';
	this._node = $(jqNode);
	this._htmlTemplate = htmlTemplate;
	this._editor = null;
	this._html = null;
	this._text = null;
	this._list = null,
	this._timerScheduled = null;
	this._timerState = null;
	this._onChange = null;
	this._onSave = null;
	this._onCancel = null;
};


QuotesListEditor.prototype = {};
$.extend(QuotesListEditor.prototype, QuotesStringEditor.prototype, {
	_start: function(event) {
		this.setOriginalHtml(this._node.html());
		this._editor = $('<div class="editor" contentEditable="true">' + this.getOriginalText() + '</div>');
		this._node.empty().append(this._editor);
	},
	_stop: function(event) {
		this._node.empty().html(this.getCurrentHtml());
		this._editor = null;
		this.setOriginalHtml(null);
	},
	_abort: function(event) {
		this._node.empty().html(this.getOriginalHtml());
		this._editor = null;
		this.setOriginalHtml(null);
	},
	_save: function() {
		this._onSave(this.getOriginalList(), this.getCurrentList(), event);
		this.setOriginalHtml(this.getCurrentHtml());
	},
	hasChanged: function() {
		return this.isEditing() && !$.isSameArray(this.getOriginalList(), this.getCurrentList());
	},
	getOriginalText: function() {
		return this._text;
	},
	getOriginalHtml: function() {
		return this._html;
	},
	getOriginalList: function() {
		return this._list;
	},
	setOriginalHtml: function(html) {
		var self = this;
		self._html = html;
		if (html) {
			self._list = $.normalizeList($(html).map(function(indexItem, eachItem) { return $(eachItem).text(); }).toArray());
			self._text = self.concat(self._list);
		} else {
			self._list = null;
			self._text = null;
		}
	},
	getCurrentText: function() {
		return this.concat(this.getCurrentList());
	},
	getCurrentHtml: function() {
		return this.concat(this.getCurrentList(), this._htmlTemplate);
	},
	getCurrentList: function() {
		return $.normalizeList(this.split(this._editor.text()));
	},
	split: function(text) {
		return (text || '').split(/[.,;\/\s+]/g);
	},
	concat: function(list, template) {
		var text = '';
		$(list).each(function(index, each) {
			if (template) {
				text = text + (template + '').replace('%{text}', each);
			} else {
				text = text + (index > 0 ? ', ' : '') + each;
			}
		});
		return text;
	}
});