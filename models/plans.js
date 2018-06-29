'use strict';

var plans = require('nosqldb')('plans');
var generate = require('nanoid/generate');
var _ = require('underscore');


module.exports.findById = function(id) {
	var plan = plans.findWhere({ id });
	return _.isEmpty(plan) ? null : plan;
};

module.exports.findAll = function() {
	return plans.all();
};

module.exports.create = function() {
	var id = generate('1234567890qwertyuiopasdfghjklzxcvbnm', 10);
	var title = 'Your new plan';
	plans.create({ id, title });
	var plan = plans.findWhere({ id });
	return _.isEmpty(plan) ? null : plan;
};

// module.exports.save = function(plan) {
// 	plans.saveItem(plan);
// };

module.exports.updateById = function(id, values) {
	plans.updateWhere({ id }, values);
};
