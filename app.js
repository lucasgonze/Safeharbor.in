
//******************************
// global variables
//******************************

global_isUserLoggedIn = false;  // ONLY referenced directly by code in lib/loginstate.js

//******************************
// modules
//******************************

var express    = require('express');
var routes     = require('./routes');
var models     = require("./models");
var loginstate = require("./lib/loginstate.js");
var errlib     = require('./lib/error.js');
var debug      = require('./lib/debug.js');
var sessionStore = require('./lib/sessionStore.js');

debug.setVolume(1);

var app = module.exports = express.createServer(
	express.cookieParser(),
	express.session({ secret: 'I loved KH.', userid: null, store: new sessionStore })
	);

//******************************
// middleware
//******************************

// oh, I'm sure there's a prettier way to do this
errlib.init( express.errorHandler({ dumpExceptions: true, showStack: true, showMessage: true }) );

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

       // app.use(express.logger());
        
		app.use(function(req, res, next){
			loginstate.initFromReq(req);
			next();
		});	
	
	    app.use(express.bodyParser());
	    app.use(express.methodOverride());
	
	    app.use(app.router);
	    app.use(express.static(__dirname + '/public'));

        // if you are here that means that no header
        // has been sent out the response object so
        // it's a 404
		app.use(function(req, res, next){ 
            res.status(404);
            throw new Error("Not found!? " + req.originalUrl );
		});

		// misc exceptions
		app.error(function(err, req, res, next) {
			if( err.statusCode !== undefined )
				res.statusCode = err.statusCode; 
			errlib.handleException( err, req, res );
//			errlib.render( res,err.message,err.statusCode,{});
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

express.errorHandler.title = 'Safe Harbor: Geek Error <h4>please report this to the proper authorities</h4>';

//******************************
// Routes
//******************************

routes.setup(app);

process.on('uncaughtException', function (err) {
    // by the time you get to this point
    // the session is screwed. The app will
    // continue to run for other users and
    // this user can use browser's 'back' to
    // unhork. 
    // TODO: notify admin when this happens...
  console.log(['******* Caught-uncaught exception: ', err] );
  console.log( err.stack );
  console.trace('call stack:');
});

//******************************
// Server loop
//******************************

// heroku needs us to accept a dynamically assigned port
var port = process.env.PORT || 3000; 
app.listen(port,
	function() {
	    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
	});
