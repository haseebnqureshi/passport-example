'use strict';

var tasks = require('nosqldb')('tasks');
var generate = require('nanoid/generate');
var _ = require('underscore');


module.exports.findById = function(id) {
	var task = tasks.findWhere({ id });
	return _.isEmpty(task) ? null : task;
};

module.exports.findAllByPlanId = function(plan_id) {
	return tasks.where({ plan_id });
};

module.exports.create = function(plan_id, data) {
	var id = generate('1234567890qwertyuiopasdfghjklzxcvbnm', 14);
	var args = _.extend(data || {}, { id, plan_id });
	tasks.create(args);
	var task = tasks.findWhere({ id, plan_id });
	return _.isEmpty(task) ? null : task;
};

// module.exports.save = function(task) {
// 	tasks.saveItem(task);
// };

module.exports.updateById = function(id, values) {
	tasks.updateWhere({ id }, values);
};

module.exports.deleteById = function(id) {
	tasks.deleteWhere({ id });
};

