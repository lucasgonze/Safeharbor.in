
var ROLES = require('../lib/roles.js').ROLES;

    
var checkRole = exports.checkRole = function(acceptableRole)
{
    var login = require('../lib/loginstate.js');
    
    return function (req, res, next) 
    {
        var ok = false;
        
        if( !acceptableRole ) {
            // then why did you call this?
            // assert here?
            ok = true;
        }
        else 
        {
            var user = login.getUser(req);

            if( !user )
            {
                ok = acceptableRole == ROLES.not_logged_in;
            }
            else if( user.role == ROLES.admin )
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
        }
        
        if( ok ) {
            next();
        }
        else {
            next( new Error('Wrong permission for this operation') );
        }
    }
}

exports.setup = function(app){
            
    app.checkRole = checkRole;
    app.ROLES = ROLES;
    
	app.trivialRoute = function(name,partial,pathOffsetFromViews,pageTitle,check){
	    function handler(req, res) {
		    res.render(
				pathOffsetFromViews+'/'+partial+'.html',			
	  			 { layout:'global.html', 
	  			    pageTitle:pageTitle, 
	  			    bodyClass: pathOffsetFromViews }
			);
		}
		if( check )
		    app.get(name,check,handler);
		else
    		app.get(name,handler);
	}

	app.trivialRoute('/','home','firstrun');

    require('./profile-routes.js').install(app);
    require('./reg-routes.js').install(app);
    require('./box-routes.js').install(app);
    require('./dash-routes.js').install(app);

    require('./admin-routes.js').install(app);
    require('./dev-routes.js').install(app);

}