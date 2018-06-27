'use strict';

var items = require('nosqldb')('items');
var generate = require('nanoid/generate');
var _ = require('underscore');


module.exports.findById = function(id) {
	var item = items.findWhere({ id });
	return _.isEmpty(item) ? null : item;
};

module.exports.findAllByListId = function(list_id) {
	return items.where({ list_id });
};

module.exports.create = function(list_id, data) {
	var id = generate('1234567890qwertyuiopasdfghjklzxcvbnm', 14);
	var args = _.extend(data || {}, { id, list_id });
	items.create(args);
	var item = items.findWhere({ id, list_id });
	return _.isEmpty(item) ? null : item;
};

// module.exports.save = function(item) {
// 	items.saveItem(item);
// };

module.exports.updateById = function(id, values) {
	items.updateWhere({ id }, values);
};

module.exports.deleteById = function(id) {
	items.deleteWhere({ id });
};

