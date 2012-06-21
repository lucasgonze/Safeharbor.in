
var models     = require('../models/dash-models.js');
var profile    = require('../models/profile-models.js');
var loginstate = require('../lib/loginstate.js');
var errlib     = require("../lib/error.js");
var debug      = require("../lib/debug.js");

var exp            = errlib.err;
var errout         = errlib.errout();
var checkForSQLErr = errlib.errout( [ models.CODES.SQL_ERROR ] );

/* stub to fill in later */
function getDisputes(req,res)
{
    var uid = 1; // loginstate.getID(req);
    
    if( !uid ) {
	    errout( req, res, exp( 400, "Only somebody signed in can see site info." ) );
        return(false);
    }

    var log = models.getAuditLog(uid,function(code,rows) 
                    {
                        checkForSQLErr( req, res, code, rows );
                        if( code == models.CODES.SUCCESS )
                        {
                            res.render( '../views/disputes/all.html',
                                        {
                                           layout: 'signedin.html',
                                           pageTitle: 'Safe Harbor - Disputes',
                                           bodyClass: 'disputes',
                                           body: require('util').inspect(rows,true,null)
                                        } );
                        }
                    });
    
    log.perform();

}

function getDash( req, res )
{
    var uid = loginstate.getID(req);
    
    if( !uid ) {
	    errout( req, res, exp( 400, "Only somebody signed in can see site info." ) );
        return(false);
    }

    var log = models.getAuditLog(uid,function(code,rows) 
                    {
                        checkForSQLErr( req, res, code, rows );
                        if( code == models.CODES.SUCCESS )
                        {
                            debug.render( res, rows );
                            /*
                            res.render( '../views/dash/home.html',
                                        {
                                           layout: 'global.html',
                                           pageTitle: 'Safe Harbor Dashboard',
                                           bodyClass: 'dash',
                                           auditItems: rows
                                        } );
                            */
                        }
                    });
    
    log.perform();
}

exports.install = function(app) 
{
    app.get( '/dash', getDash );
    app.get( '/disputes', getDisputes );
    /*
	// Dealing with takedown requests for logged in customers
	trivialRoute('/dash','home','dash','Todo');
	trivialRoute('/dash/list','list','dash','List');
	trivialRoute('/dash/stats','stats','dash','Stats');
	*/    
}