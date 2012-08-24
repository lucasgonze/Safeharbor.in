
var login = require('../lib/loginstate.js');    
var ROLES = require('../lib/roles.js'); // .ROLES;

    
var checkRole = exports.checkRole = function(acceptableRole)
{
    return function (req, res, next) 
    {
        var ok = false;
        
        var user = login.getUser(req);

        if( !user )
        {
            ok = acceptableRole == ROLES.not_logged_in;
        }
        else if( user.role == ROLES.admin || user.role == ROLES.developer)
        {
            ok = true;
        }
        else
        {
            if( acceptableRole <= ROLES.logged_in )
            {
                ok = user.role <= acceptableRole;
            }
            else  // 'owner'
            {
                ok = req.session.seekingAccountId == user.acctid;
            }
        }

        if( true || ok ) {
            next();
        }
        else {    
            next( new Error('Wrong permission for this operation') );
        }
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

    require('./profile-routes.js').install(app);
    require('./reg-routes.js').install(app);
    require('./box-routes.js').install(app);
    require('./dash-routes.js').install(app);
    require('./admin-routes.js').install(app);
    require('./dev-routes.js').install(app);
    require('./demo-routes.js').install(app);
}