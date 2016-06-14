QuotesEditors = {
	setup: function() {
		var self = this;
		$(document).on('keydown.globaleditor', function(event) {
			self.abort(event);
		});
	},
	abort: function(event) {
		var self = this;
		self.each(function(each) {
			each.abort(event);
		});
	},
	detach: function(event) {
		var self = this;
		self.each(function(each) {
			each.abort(event);
			each.detach();
		});
	},
	each: function(callback) {
		if (callback) {
			$('.editor').each(function(index, each) {
				var editor = $(each).parent().data('editor');
				if (editor) {
					callback(editor);
				}
			});
		}
	}
};


QuotesStringEditor = function(jqNode) {
	this._node = $(jqNode);
	this._editor = null;
	this._text = null;
	this._timerScheduled = null;
	this._timerState = null;
	this._onChange = function(event) {};
	this._onSave = function(event) {};
	this._onCancel = function(event) {};
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
					self._onChange(event);
				}
			} else {
				self.clean();
			}
		});
		self._node.on('click.editor', function(event) {
			if (self._onFocus) {
				self._onFocus(event);
			}
		});
	},
	tearDown: function() {
		var self = this;
		self._node.off();
		self.stop();
	},
	attach: function() {
		var self = this;
		self._node.data('editor', self);
		self._node.parent().addClass('editable');
	},
	detach: function() {
		var self = this;
		self._node.parent().removeClass('editable');
		self._node.data('editor', null);
	},
	start: function(event) {
		var self = this;
		if (!self.isEditing()) {
			self._start(event);
		}
	},
	_start: function(event) {
		var self = this;
		self.setOriginalText(self._node.text());
		self._editor = $('<div class="editor" contentEditable="true">' + self.getOriginalText() + '</div>');
		self._node.empty().append(self._editor);
	},
	stop: function(event) {
		var self = this;
		if (self.isEditing() && !self.hasChanged()) {
			self._stop(event);
			self.clean();
			if (self._onCancel) {
				self._onCancel(event);
			}
		}
	},
	_stop: function(event) {
		var self = this;
		self._node.empty().text(self.getCurrentText());
		self._editor = null;
		self.setOriginalText(null);
	},
	stopDelayed: function(event) {
		var self = this;
		window.clearTimeout(self._timerScheduled);
		self._timerScheduled = window.setTimeout(function() {
			self._timerScheduled = null;
			self.stop(event);
		}, 2000);
	},
	abort: function(event) {
		var self = this;
		if (self.isEditing()) {
			self._abort(event);
			self.clean();
			if (self._onCancel) {
				self._onCancel(event);
			}
		}
	},
	_abort: function(event) {
		var self = this;
		self._node.empty().text(self.getOriginalText());
		self._editor = null;
		self.setOriginalText(null);
	},
	save: function(event) {
		var self = this;
		if (self.isEditing()) { 
			if (self._onSave) {
				if (self.hasChanged()) {
					try {		
						self._save(event);
						self.clean();
					} catch (error) {
						self.fail();
					}
				}
			}
		}
	},
	_save: function() {
		var self = this;
		if (self._onSave(self.getOriginalText(), self.getCurrentText(), event)) {
			self.setOriginalText(self.getCurrentText());
			self.success();
		} else {
			self.abort();
			self.fail();
		}
	},
	isEditing: function() {
		var self = this;
		return !!self._editor;
	},
	hasChanged: function() {
		var self = this;
		return self.isEditing() && self.getOriginalText() != self.getCurrentText();
	},
	getOriginalText: function() {
		var self = this;
		return self._text;
	},
	setOriginalText: function(text) {
		var self = this;
		self._text = text;
	},
	getCurrentText: function() {
		var self = this;
		return $.normalize(self._editor.text());
	},
	onSave: function(callback) {
		var self = this;
		self._onSave = callback;
	},
	onChange: function(callback) {
		var self = this;
		self._onChange = callback;
	},
	onFocus: function(callback) {
		var self = this;
		self._onFocus = callback;
	},
	onCancel: function(callback) {
		var self = this;
		self._onCancel = callback;
	},
	success: function() {
		var self = this;
		self._node.removeClass('fail').addClass('success');
		window.clearTimeout(self._timerState);
		self._timerState = window.setTimeout(function() {
			self._node.removeClass('success');
		}, 500);
	},
	fail: function() {
		var self = this;
		self._node.removeClass('success').addClass('fail');
		window.clearTimeout(self._timerState);
		self._timerState = window.setTimeout(function() {
			self._node.removeClass('fail');
		}, 500);
	},
	dirty: function() {
		var self = this;
		self._node.addClass('dirty');
	},
	clean: function() {
		var self = this;
		self._node.removeClass('dirty');
	}
};


QuotesListEditor = function(jqNode, htmlTemplate) {
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
		var self = this;
		self.setOriginalHtml(self._node.html());
		self._editor = $('<div class="editor" contentEditable="true">' + self.getOriginalText() + '</div>');
		self._node.empty().append(self._editor);
	},
	_stop: function(event) {
		var self = this;
		self._node.empty().html(self.getCurrentHtml());
		self._editor = null;
		self.setOriginalHtml(null);
	},
	_abort: function(event) {
		var self = this;
		self._node.empty().html(self.getOriginalHtml());
		self._editor = null;
		self.setOriginalHtml(null);
	},
	_save: function() {
		var self = this;
		self._onSave(self.getOriginalList(), self.getCurrentList(), event);
		self.setOriginalHtml(self.getCurrentHtml());
	},
	hasChanged: function() {
		var self = this;
		return self.isEditing() && !$.isSameArray(self.getOriginalList(), self.getCurrentList());
	},
	getOriginalText: function() {
		var self = this;
		return self._text;
	},
	getOriginalHtml: function() {
		var self = this;
		return self._html;
	},
	getOriginalList: function() {
		var self = this;
		return self._list;
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
		var self = this;
		return self.concat(self.getCurrentList());
	},
	getCurrentHtml: function() {
		var self = this;
		return self.concat(self.getCurrentList(), self._htmlTemplate);
	},
	getCurrentList: function() {
		var self = this;
		return $.normalizeList(self.split(self._editor.text()));
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