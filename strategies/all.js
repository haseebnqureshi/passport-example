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

//loading test user info for purposes of example
var testUser = { id: 12198, firstName: 'John', lastName: 'Doe', username: 'john@doe.com', password: '1234567890' };

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
passport.use(new LocalStrategy({
	passReqToCallback: true
}, function(req, username, password, done) {
	if (!req.user) {
		console.log('no pre-existing account to associate...');
		if (username !== testUser.username) { 
			return done(null, false, { message: 'Incorrect username' });
		}
		if (password !== testUser.password) {
			return done (null, false, { message: 'Incorrect password' });
		}
		return done(null, testUser);
	}
	else {
		console.log('need to associate accounts...');
		console.log(req.user);	
		return done(null, req.user);
	}
}));

//login endpoint for front-end form
app.post('/login', passport.authenticate('local', {
	successRedirect: '/app',
	failureRedirect: '/login',
	failureFlash: true
}))

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

//google login endpoint
app.get('/auth/google', 
	passport.authenticate('google', {
		scope: ['https://www.googleapis.com/auth/plus.login']
	}
));

//google callback endpoint, after google generates our access token
app.get('/auth/google/callback', 
	passport.authenticate('google', {
		failureRedirect: '/login'
	}),
	function(req, res, next) {
		res.redirect('/app')
	}
);

//start express server
app.listen(process.env.PORT, function() {

	//and open our login screen
	opn(`http://localhost:${process.env.PORT}/login`);
});
