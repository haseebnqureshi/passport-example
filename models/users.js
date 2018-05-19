'use strict';

var users = require('nosqldb')('users');
var crypto = require('crypto');
var _ = require('underscore');

var hashPassword = module.exports.hashPassword = function(password) {
	return crypto.createHmac('sha256', process.env.SALT).update(password).digest('hex');
};

module.exports.findById = function(id) {
	return users.findWhere({ id });
};

module.exports.findByEmailAndPassword = function(email, password) {
	var password = hashPassword(password);
	return users.findWhere({ email, password });
};

module.exports.create = function(email, password, options) {
	var password = hashPassword(password);
	users.create({ email, password });
	return users.findWhere({ email, password });
};
