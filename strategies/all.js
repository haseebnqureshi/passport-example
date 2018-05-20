'use strict';

//======================================================================
// LOADING ENVIRONMENT VARIABLES ---------------------------------------
// This application expects the following variables:
//
// PORT
// GOOGLE_CLIENT_ID
// GOOGLE_CLIENT_SECRET
// GOOGLE_CALLBACK_URL
// SALT
//======================================================================

require('dotenv').config();


//======================================================================
// DEPENDENCIES --------------------------------------------------------
//======================================================================

var express = require('express');
var app = express();
var path = require('path');
var _ = require('underscore');
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


//======================================================================
// EXPRESS CONFIGURATION -----------------------------------------------
//======================================================================

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

var paths = {
	login: '/login',
	register: '/register',
	app: '/app',
	logout: '/logout',
	account: '/account',
	authGoogle: '/auth/google',
	authLocal: '/auth/local',
	detachGoogle: '/detach/google'
};


//======================================================================
// PASSPORT SERIALIZATION ----------------------------------------------
//======================================================================

passport.serializeUser(function(user, done) {
	
	//taking our user, and returning its identifying id
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {

	//taking our found user id, returning found user
	var user = Users.findById(id);
	done(null, user);
});


//======================================================================
// CONFIGURED PASSPORT STRATEGIES --------------------------------------
//======================================================================

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

//@see https://console.cloud.google.com/apis/credentials
passport.use(new GoogleStrategy({
	clientID: process.env.GOOGLE_CLIENT_ID,
	clientSecret: process.env.GOOGLE_CLIENT_SECRET,
	callbackURL: process.env.GOOGLE_CALLBACK_URL,
	passReqToCallback: true
}, function(req, accessToken, refreshToken, profile, done) {
	if (!req.user) {
		console.log('no pre-existing account to associate...');
		req.user = _.omit(profile, 'id', '_raw', '_json', 'name');
		req.user.familyName = profile.name.familyName;
		req.user.givenName = profile.name.givenName;
		req.user.google_id = profile.id;
		req.user.email = profile.emails[0].value;
		req.user.photo = profile.photos[0].value;
		Users.create(req.user.email, false, req.user);
	}
	else {
		console.log('need to associate accounts...');	
		req.user.google_id = profile.id;
		Users.updateById(req.user.id, { google_id: profile.id });
	}
	req.login(req.user, function(err) {
		if (err) { return done(err); }
		return done(null, req.user);
	});
}));


//======================================================================
// AUTH MIDDLEWARE -----------------------------------------------------
//======================================================================

var isAuthenticated = function(req, res, next) {
	var isAuthenticated = req.isAuthenticated();
	console.log({ isAuthenticated });
	if (isAuthenticated) {
		console.log({ user: req.user });
		return next();
	}
	res.redirect(paths.login);
};


//======================================================================
// PROFILE MIDDLEWARE --------------------------------------------------
//======================================================================

//make a clean copy of user for various front-end uses
app.use(function(req, res, next) {
	if (!req.user) { return next(); }
	req.profile = _.pick(req.user, 'displayName', 'email', 'photo', 'givenName', 'familyName', 'gender');
	next();
});


//======================================================================
// APP -----------------------------------------------------------------
//======================================================================

app.get(paths.app, isAuthenticated, function(req, res, next) {
	res.render('app', { paths, user: req.user, message: req.flash('error') });
});


//======================================================================
// ACCOUNT -------------------------------------------------------------
//======================================================================

app.get(paths.account, isAuthenticated, function(req, res, next) {
	res.render('account', { paths, user: req.user, profile: req.profile, message: req.flash('error') });
});

app.post(paths.account, isAuthenticated, function(req, res, next) {
	Users.updateById(req.user.id, req.body);
	req.flash('error', 'Profile has been saved');
	res.redirect(paths.account);
});

//======================================================================
// GOOGLE AUTH ---------------------------------------------------------
// For all available scopes,
// @see https://developers.google.com/identity/protocols/googlescopes
//======================================================================

//makes originating request to google for account verification
app.get(paths.authGoogle, 
	passport.authenticate('google', {
		scope: [
			'https://www.googleapis.com/auth/plus.login',
			'https://www.googleapis.com/auth/userinfo.email'
		]
	}
));

//receives google's access token after account verification
app.get(`${paths.authGoogle}/callback`, 
	passport.authenticate('google', {
		successRedirect: paths.app,
		failureRedirect: paths.login,
		failureFlash: true
	})
);


//======================================================================
// DISCONNECT GOOGLE AUTH ----------------------------------------------
//======================================================================

app.get(paths.detachGoogle, isAuthenticated, function(req, res, next) {
	if (!req.user.google_id) {
		req.flash('error', 'You have no connected Google accounts.');
	}
	else {
		req.flash('error', 'Your Google account has now been successfully disconnected.');
		Users.nullifyById(req.user.id, 'google_id');
	}
	return res.redirect(req.get('Referer'));
});


//======================================================================
// LOCAL AUTH ----------------------------------------------------------
//======================================================================

app.post(paths.authLocal, passport.authenticate('local', {
	successRedirect: paths.app,
	failureRedirect: paths.login,
	failureFlash: true
}));


//======================================================================
// LOGIN / LOGOUT ------------------------------------------------------
//======================================================================

app.get(paths.login, function(req, res, next) {
	if (req.isAuthenticated()) {
		res.redirect(paths.app);
	}
	var email = req.flash('email')[0] || '';
	res.render('login', { paths, email, message: req.flash('error') });
});

app.get(paths.logout, function(req, res) {
	req.logout();
	res.redirect(paths.login);
});


//======================================================================
// REGISTRATION --------------------------------------------------------
//======================================================================

app.get(paths.register, function(req, res, next) {
	var email = req.flash('email')[0] || '';
	res.render('register', { paths, email, message: req.flash('error') });
});

app.post(paths.register, function(req, res, next) {

	//verify our form input first
	if (req.body.password !== req.body.password_confirm) {
		req.flash('error', 'Passwords did not match. Please try again.');
		req.flash('email', req.body.email);
		return res.redirect(paths.register);
	}

	//create and register our new user
	var user = Users.create(req.body.email, req.body.password);

	//and automatically log them in
	req.login(user, function(err) {
		if (err) { 
			req.flash('error', err);
			return res.redirect(paths.login);
		}
		return res.redirect(paths.app);
	});
});

//======================================================================
// RUN SERVER ----------------------------------------------------------
//======================================================================

app.listen(process.env.PORT, function() {

	//and open our login screen
	opn(`http://localhost:${process.env.PORT}${paths.login}`);
});
