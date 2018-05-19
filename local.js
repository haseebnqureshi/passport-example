'use strict';

//loading environment variables
require('dotenv').config();

//dependencies
var express = require('express');
var app = express();
var opn = require('opn');
var session = require('express-session');
var flash = require('connect-flash');
var bodyParser = require('body-parser');
var passport = require('passport');

//selecting local strategy for passport auth
var LocalStrategy = require('passport-local').Strategy;

//loading test user info for purposes of example
var testUser = { id: 12198, firstName: 'John', lastName: 'Doe', username: 'john@doe.com', password: '1234567890' };

//express configuration
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(session({ 
	secret: 'dog',
	resave: false,
	saveUninitialized: true
}));
app.use(flash());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());


/* START PASSPORT */ 

//taking our user, and returning its identifying id
passport.serializeUser(function(user, done) {
	done(null, testUser.id);
});

//taking our found user id, returning found user
passport.deserializeUser(function(id, done) {
	done(null, testUser);
});

//configuring local strategy
passport.use(new LocalStrategy(
	function(username, password, done) {
		if (username !== testUser.username) { 
			return done(null, false, { message: 'Incorrect username' });
		}
		if (password !== testUser.password) {
			return done (null, false, { message: 'Incorrect password' });
		}
		return done(null, testUser);
	}
));

//login endpoint for front-end form
app.post('/login', passport.authenticate('local', {
	successRedirect: '/app',
	failureRedirect: '/login',
	failureFlash: true
}))

/* END PASSPORT */ 

//middleware for ensuring only authorized users
var isAuthenticated = function(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/login');
};

//restricted area
app.get('/app', isAuthenticated, function(req, res, next) {
	res.render('app');
});

//login screen
app.get('/login', function(req, res, next) {
	res.render('login', { message: req.flash('error') });
});

//logout endpoint
app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/login');
});

//start express server
app.listen(process.env.PORT, function() {

	//and open our login screen
	opn(`http://localhost:${process.env.PORT}/login`);
});
