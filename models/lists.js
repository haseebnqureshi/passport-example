'use strict';

var lists = require('nosqldb')('lists');
var generate = require('nanoid/generate');
var _ = require('underscore');


module.exports.findById = function(id) {
	var list = lists.findWhere({ id });
	return _.isEmpty(list) ? null : list;
};

module.exports.findAll = function() {
	return lists.all();
};

module.exports.create = function() {
	var id = generate('1234567890qwertyuiopasdfghjklzxcvbnm', 10);
	lists.create({ id });
	var list = lists.findWhere({ id });
	return _.isEmpty(list) ? null : list;
};

// module.exports.save = function(list) {
// 	lists.saveItem(list);
// };

module.exports.updateById = function(id, values) {
	lists.updateWhere({ id }, values);
};
