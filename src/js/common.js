String.prototype.hashCode = function() {
	var hash = 0, i = 0, len = this.length, chr;
	while ( i < len ) {
		hash  = ((hash << 5) - hash + this.charCodeAt(i++)) << 0;
	}
	return hash;
};


String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};


$.allSatisfy = function(array, callback) {
	return array && $.grep(array, function(each) { return callback(each); }).length === array.length;
};


$.unique = function(list) {
	var result = [];
	$.each(list, function(index, each) {
		if ($.inArray(each, result) == -1) {
			if (each) {
				result.push(each);
			}
		}
	});
	return result;
};


$.normalize = function(text) {
	return (text || '')
			.replace(/[^a-zA-Z0-9ÀÁÂÃÄÅàáâãäåĀāąĄæÇçćĆčČđĐďĎÈÉÊËèéêëěĚĒēęĘÌÍÎÏìíîïĪīłŁÑñňŇńŃÒÓÔÕÕÖØòóôõöøŌōřŘŠšśŚťŤÙÚÛÜùúûüůŮŪūŸÿýÝŽžżŻźŹ.,:;?!\-='¿´_%&/()+*°§$£€… ]/, '')
			.replace('ß', 'ss')
			.replace('"', '')
			.replace('“', '')
			.replace(/^\s+/, '')
			.replace(/\s+$/, '');
};


$.normalizeList = function(list) {
	return $.unique($.grep($(list).map(function(index, each) { return $.normalize(each); }).toArray(), function(each) { return each && each.length > 0; })).sort();
};


$.normalizeHtml = function(html) {
	return $.normalize((html || '')
			.replace(/<\s*\/?\s*br\s*\/?\s*>/ig, '\n')
			.replace(/&nbsp;/ig, ' ')
			.replace(/\s\s+/ig, ' '));
};


$.isSameArray = function(array1, array2) {
	if ((!array1 && array2) || (array1 && !array2)) {
		return false;
	}
	if (typeof array1 != typeof array2) {
		return false;
	}
	if (array1 && array2 && array1.length != array2.length) {
		return false;
	}
	for (var object in array1) {
		if (!$.inArray(object, array2)) {
			return false;
		}
	}
	for (var object in array2) {
		if (!$.inArray(object, array1)) {
			return false;
		}
	}
	return true;
};


$.isKeyEvent = function(charOrNumber, event) {
	if (event) {
		if (typeof charOrNumber === 'number') {
			return (event.which ? event.which : event.keyCode) == charOrNumber;
		}
		if (typeof charOrNumber === 'string') {
			return (event.which ? String.fromCharCode(event.which) : String.fromCharCode(event.keyCode)) == charOrNumber;
		}
	}
	return false;
};

$.timestamp = function() {
	return (new Date()).getTime();
};