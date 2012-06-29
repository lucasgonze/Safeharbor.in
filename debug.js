
//******************************
// global variables
//******************************

global_isUserLoggedIn = false;  // ONLY referenced directly by code in lib/loginstate.js

//******************************
// modules
//******************************

var express = require('express');
var routes = require('./routes');
var models = require("./models");
var loginstate = require("./lib/loginstate.js");

var RedisStore = require('./connect-lg.js')(express);

var app = module.exports = express.createServer(
	express.cookieParser(),
	express.session({ store: new RedisStore, secret: 'I loved KH.', userid: null })
	);

//******************************
// middleware
//******************************

app.configure(function() {

	    app.set('views', __dirname + '/views');

		var Handlebars = require('handlebars');
		Handlebars.registerHelper('loggedInStatusClass', function() {
			var isLoggedIn = loginstate.isLoggedIn();
			if( isLoggedIn )
				return('loggedin'); // that's a class name
			else
				return('loggedout');
		});
	    app.register('.html', Handlebars);
	    app.set('view engine', 'handlebars');

		app.use(function(req, res, next){
			loginstate.initFromReq(req);
			next();
		});	
	
	    app.use(express.bodyParser());
	    app.use(express.methodOverride());
	
	    app.use(app.router);
	    app.use(express.static(__dirname + '/public'));

		// 404s in particular
		app.use(function(req, res, next){ 
		    res.status(404);
			throw new Error("Not found!?");
		});

		// misc exceptions
		app.use(function(err, req, res, next) {
			if( err.statusCode !== undefined )
				res.statusCode = err.statusCode; 
			res.render("error/error.html",{layout:"shared/main.html",pageTitle:"Error","bodyClass":"error",message:err.message});
		});

	});

app.configure('development',
	function() {
	    app.use(express.errorHandler({
	        dumpExceptions: true,
	        showStack: true
	    }));
	});

app.configure('production',
	function() {
	    app.use(express.errorHandler());
	});

//******************************
// Routes
//******************************

routes.setup(app);

//******************************
// Server loop
//******************************

// heroku needs us to accept a dynamically assigned port
var port = process.env.PORT || 3000; 
app.listen(port,
	function() {
	    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
	});
