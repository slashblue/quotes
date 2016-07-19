/*
 * @requires external/sha1.js
 */

 String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.trimBlanks = function() {
	return this.replace(/^\s*/ig, '').replace(/\s*$/ig, '');
};

$.allSatisfy = function(array, callback) {
	if (array) {
		for (index in array) {
			if (!callback(index, array[index])) {
				return false;
			}
		}
		return true
	}
	return false;
};

$.anySatisfy = function(array, callback) {
	if (array) {
		for (index in array) {
			if (callback(index, array[index])) {
				return true;
			}
		}
		return false;
	}
	return false;
};

$.gather = function(array, callback) {
	var gathered = [];
	if (array) {
		for (i in array) {
			var subarray = callback(i, array[i]) || [];
			if (subarray) {
				for (j in subarray) {
					gathered.push(subarray[j]);
				}
			}
		}
	}
	return gathered;
};

$.collect = function(array, callback) {
	var collected = [];
	if (array) {
		for (i in array) {
			collected.push(callback(i, array[i]));
		}
	}
	return gathered;
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

$.unquote = function(text) {
	var newText = text || '';
	if (newText.match(/^"/) && newText.match(/"$/)) {
		newText = newText.replace(/^"/g, '').replace(/"$/g, '')
	}
	if (newText.match(/^\'/) && newText.match(/\'$/)) {
		newText = newText.replace(/^\'/g, '').replace(/\'$/g, '')
	}
	if (newText.match(/^“/) && newText.match(/“$/)) {
		newText = newText.replace(/^“/g, '').replace(/“$/g, '')
	}
	return newText;
};

$.normalize = function(text) {
	return $.unquote((text || '')
			.replace(/\r+/g, ' ') // cr
			.replace(/\t+/g, ' ') // tabs
			.replace('ß', 'ss') // double s
			.replace('“', '"') // other double quotes
			.replace(/[^a-zA-Z0-9ÀÁÂÃÄÅàáâãäåĀāąĄæÇçćĆčČđĐďĎÈÉÊËèéêëěĚĒēęĘÌÍÎÏìíîïĪīłŁÑñňŇńŃÒÓÔÕÕÖØòóôõöøŌōřŘŠšśŚťŤÙÚÛÜùúûüůŮŪūŸÿýÝŽžżŻźŹ.,:;?!\-='¿´’"_%&/()+*°§$£€…\n ]/, '')
			.replace(/\s\s+/g, ' ')
			.trimBlanks());
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

$.isSafeText = function(text) {
	return !(text || '').match(/&\w+;/ig);
};

$.hashCode = function(text) {
	var hash = '';
	if (text) {
		var normalizedText = (text || '').replace(/[^a-zA-Z0-9]/, '').toLowerCase().trimBlanks();
		var rawHash = CryptoJS.SHA1(normalizedText);
		$(rawHash.words).each(function(index, each) {
			if (index === 0) {
				hash = hash + each;
			} else {
				hash = hash + ':' + each;
			}
		});
	}
	return hash;
}

$.timestamp = function() {
	return (new Date()).getTime();
};

$.swapNameFragments = function(text) {
	var fragments = text.split(',');
	if (fragments && fragments.length === 2) {
		return $.normalize(fragments[1]) + ' ' + $.normalize(fragments[0]);
	}
	return text;
};