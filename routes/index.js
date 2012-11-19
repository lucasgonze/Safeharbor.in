
var login = require('../lib/loginstate.js');    
var ROLES = require('../lib/roles.js'); // .ROLES;

    
var checkRole = exports.checkRole = function(acceptableRole){

	return function (req, res, next) {

		var helper = function(next){next();return;};

		// these objects are world-readable
		if( acceptableRole == ROLES.not_logged_in ) return(helper(next));
		
		var user = login.getUser(req);
		if( !user ){
			// redirect to login page
			req.session.detour = req.path;
			res.status(302);
			res.redirect('/#login');
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

function home( req, res, next ){

	if( login.isLoggedIn() ){
		// there are two handlers for '/', depending on whether the user is logged in.
		// this function is the handler for users who aren't logged in. 
		next();
		return;
	}

	// if we're on the public host, show the blank/coming-soon home page.
	if( req.host == "safeharbor.in" ){
        res.render( 'firstrun/comingsoon.html', { layout:'firstrun/nop.html' } );
		return;
	}

	// if we're on a developer host, show the real actual home page. (This will 
	// become / for non-logged-in users once we remove the "coming soon" page and go live).
	res.render( 'firstrun/corp-wip.html', { layout:'firstrun/nop.html' } );	
//	res.render('firstrun/corp.html', { layout:'shared/main.html', corp_home: true } );
//	res.render( 'firstrun/home.html', { layout:'firstrun/nop.html' } );

}

function corp( req, res, next ){
	res.render( { layout:'firstrun/corp-wip.html' } );
}

function err500( req, res, next ){
	var err = require('../lib/error.js')
	err.page(500,res,"This is a page that always returns an application error, but only when it is working.");
}

exports.setup = function(app) {

    app.checkRole    = checkRole;
    app.ROLES        = ROLES;
	app.trivialRoute = trivialRoute(app);

    app.get('/',home);
    app.get('/corp',corp);
	app.get('/err500',err500);

    require('./test-routes.js').install(app);
    require('./profile-routes.js').install(app);
    require('./reg-routes.js').install(app);
    require('./inbox-routes.js').install(app);
    require('./dash-routes.js').install(app);
    require('./admin-routes.js').install(app);
    require('./dev-routes.js').install(app);
    require('./demo-routes.js').install(app);
    require('./firstrun-routes.js').install(app);
}