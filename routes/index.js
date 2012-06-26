
var util  = require('util');
var login = require('../lib/loginstate.js');
var ROLES = require('../lib/roles.js').ROLES;

    
var checkRole = exports.checkRole = function(acceptableRole)
{
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
            
    function cbn( req, res, next, id ) 
    {
        function cb0( code, user ) 
        {
            if( code == profile.CODES.SUCCESS ) {
                req.session.seekingAccountId = user.acctid;
                next();
            }
            else {
                next( new Error('invalid id' ) );
            }
        }
        
        var profile = require('../models/profile-model.js');
        var idLookup = profile.acctFromId( id, cb0 );
        idLookup.perform();
    }
    
    app.param( 'userid', cbn);

    function cb2( req, res, next, id ) 
    {
        function cb1( code, err ) 
        {
            if( code == profile.CODES.SUCCESS ) 
            {
                req.session.seekingAccountId = user.acct;
                next( new Error('invalid site id') )
            }    
        }
        
        var profile = require('../models/profile-model.js');
        var forreal = profile.siteFromSiteIdOrHash( id, cb1 );
        forreal.perform()
    }
    
    app.param( 'siteid', cb2 );

	app.trivialRoute = function(name,partial,pathOffsetFromViews,pageTitle){
		app.get(name,function(req, res) {
		    res.render(
				pathOffsetFromViews+'/'+partial+'.html',			
				{ layout:'global.html', pageTitle:pageTitle, bodyClass: pathOffsetFromViews }
			);
		});
	}

	app.trivialRoute('/','home','firstrun');

    require('./profile-routes.js').install(app);
    require('./reg-routes.js').install(app);
    require('./box-routes.js').install(app);
    require('./dash-routes.js').install(app);

    require('./admin-routes.js').install(app);
    require('./dev-routes.js').install(app);

}