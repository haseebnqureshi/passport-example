'use strict';

//loading environment variables
require('dotenv').config();

//dependencies
var express = require('express');
var app = express();
var path = require('path');
var opn = require('opn');
var session = require('express-session');
var flash = require('connect-flash');
var bodyParser = require('body-parser');
var passport = require('passport');

//loading strategies for passport auth
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

//loading any necessary data modeling
var Users = require(path.resolve(__dirname, '../models/users.js'));

//express configuration
app.set('view engine', 'pug');
app.set('views', path.resolve(__dirname, '../views'));
app.use(express.static(path.resolve(__dirname, '../public')));
app.use(session({ 
	secret: 'dog',
	resave: false,
	saveUninitialized: true
}));
app.use(flash());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

//
var paths = {
	login: '/login',
	register: '/register',
	app: '/app',
	logout: '/logout'
};



/* START PASSPORT */ 

//taking our user, and returning its identifying id
passport.serializeUser(function(user, done) {
	done(null, user.id);
});

//taking our found user id, returning found user
passport.deserializeUser(function(id, done) {
	var user = Users.findById(id);
	done(null, user);
});

//configuring local strategy
passport.use(new LocalStrategy({
	usernameField: 'email',
	passwordField: 'password',
	passReqToCallback: true
}, function(req, email, password, done) {
	if (!req.user) {
		console.log('no pre-existing account to associate...');
		var user = Users.findByEmailAndPassword(email, password);
		if (!user) {
			return done(null, false, { message: 'Email and/or password did not match.' });
		}
		return done(null, user);
	}
	else {
		console.log('need to associate accounts...');
		console.log(req.user);	
		return done(null, req.user);
	}
}));

//configuring google strategy
passport.use(new GoogleStrategy({

	/*
	generate your credentials on the google cloud console 
	https://console.cloud.google.com/apis/credentials

	also make sure your appropriate apis are enabled onto 
	your project. those have to match your scopes listed
	below.
	*/

	clientID: process.env.GOOGLE_CLIENT_ID,
	clientSecret: process.env.GOOGLE_CLIENT_SECRET,
	callbackURL: process.env.GOOGLE_CALLBACK_URL,
	passReqToCallback: true
}, function(req, accessToken, refreshToken, profile, done) {
	if (!req.user) {
		console.log('no pre-existing account to associate...');
	}
	else {
		console.log('need to associate accounts...');		
	}
	console.log({ profile });
	return done(null, profile);
}));

/* END PASSPORT */ 

//middleware for ensuring only authorized users
var isAuthenticated = function(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect(paths.login);
};

//restricted area
app.get(paths.app, isAuthenticated, function(req, res, next) {
	res.render('app');
});

//login screen
app.get(paths.login, function(req, res, next) {
	if (req.isAuthenticated()) {
		res.redirect(paths.app);
	}
	var email = req.flash('email')[0] || '';
	res.render('login', { email, message: req.flash('error') });
});

//logout endpoint
app.get(paths.logout, function(req, res) {
	req.logout();
	res.redirect(paths.login);
});

//google login endpoint
//https://developers.google.com/identity/protocols/googlescopes
app.get('/auth/google', 
	passport.authenticate('google', {
		scope: [
			'https://www.googleapis.com/auth/plus.login',
			'https://www.googleapis.com/auth/userinfo.email'
		]
	}
));

//google callback endpoint, after google generates our access token
app.get('/auth/google/callback', 
	passport.authenticate('google', {
		failureRedirect: paths.login
	}),
	function(req, res, next) {
		res.redirect(paths.app)
	}
);

//login endpoint for front-end form
app.post('/auth/local', passport.authenticate('local', {
	successRedirect: paths.app,
	failureRedirect: paths.login,
	failureFlash: true
}));


app.get(paths.register, function(req, res, next) {
	var email = req.flash('email')[0] || '';
	res.render('register', { email, message: req.flash('error') });
});

app.post(paths.register, function(req, res, next) {
	if (req.body.password !== req.body.password_confirm) {
		req.flash('error', 'Passwords did not match. Please try again.');
		req.flash('email', req.body.email);
		return res.redirect(paths.register);
	}

	var user = Users.create(req.body.email, req.body.password);

	req.login(user, function(err) {
		if (err) { 
			req.flash('error', err);
			return res.redirect(paths.login);
		}
		return res.redirect(paths.app);
	});
});

//start express server
app.listen(process.env.PORT, function() {

	//and open our login screen
	opn(`http://localhost:${process.env.PORT}/login`);
});
