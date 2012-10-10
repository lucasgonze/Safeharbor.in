
var login = require('../lib/loginstate.js');    
var ROLES = require('../lib/roles.js'); // .ROLES;

    
var checkRole = exports.checkRole = function(acceptableRole){

	return function (req, res, next) {

		var helper = function(next){next();return;};

		// these objects are world-readable
		if( acceptableRole == ROLES.not_logged_in ) return(helper(next));
		
		var user = login.getUser(req);
		if( !user ){
			// fixme: set session cookie on where to go after login
			console.log("Redirecting unknown user to /login. Fixme: set session cookie to enable returning to original target after logging in.");
			// redirect to login page
			res.status(302);
			res.redirect('/login');
			return; // or next()?
		}

		if( user.role == ROLES.admin || user.role == ROLES.developer) return(helper(next));
		if( req.session.seekingAccountId == user.acctid) return(helper(next));
		if( acceptableRole <= ROLES.logged_in && user.role <= acceptableRole ) return(helper(next));

		var errlib = require('../lib/error.js');
		var error = errlib.err( 403, 'Forbidden' );
		res.send(403);
		/*
		Victor's original code for handling this error was:
		next( error );
		
		However that cascaded to a 500 Application error. And it's a lot easier to fix it here than there.
		*/	
    }
}

function trivialRoute(app) {

    return function(name,partial,pathOffsetFromViews,pageTitle,check) {
        function handler(req, res) {
            res.render(
                pathOffsetFromViews+'/'+partial+'.html',			
                 {  pageTitle:pageTitle, 
                    bodyClass: pathOffsetFromViews }
            );
        }
        if( check )
            app.get(name,check,handler);
        else
            app.get(name,handler);
    }
}

function home( req, res )
{
	if(true || req.header('host') === "demo.safeharbor.in")
		// pretty URL for the sake of potential investors
        res.redirect('/demo');
    else if( login.isLoggedIn() )
        res.redirect('/dash');
    else
        res.render( 'firstrun/home.html', { layout:'firstrun/nop.html' } );
}

exports.setup = function(app) {

    app.checkRole    = checkRole;
    app.ROLES        = ROLES;
	app.trivialRoute = trivialRoute(app);

    app.get('/',home);

    require('./test-routes.js').install(app);
    require('./profile-routes.js').install(app);
    require('./reg-routes.js').install(app);
    require('./box-routes.js').install(app);
    require('./dash-routes.js').install(app);
    require('./admin-routes.js').install(app);
    require('./dev-routes.js').install(app);
    require('./demo-routes.js').install(app);
}