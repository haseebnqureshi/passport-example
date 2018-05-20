'use strict';

var users = require('nosqldb')('users');
var crypto = require('crypto');
var _ = require('underscore');

var hashPassword = module.exports.hashPassword = function(password) {
	return crypto.createHmac('sha256', process.env.SALT).update(password).digest('hex');
};

module.exports.findById = function(id) {
	var user = users.findWhere({ id });
	return _.isEmpty(user) ? null : user;
};

module.exports.findByEmailAndPassword = function(email, password) {
	var password = hashPassword(password);
	var user = users.findWhere({ email, password });
	return _.isEmpty(user) ? null : user;
};

module.exports.create = function(email, password, options) {
	var password = hashPassword(password);
	users.create({ email, password });
	var user = users.findWhere({ email, password });
	return _.isEmpty(user) ? null : user;
};

module.exports.save = function(user) {
	users.saveItem(user);
};
