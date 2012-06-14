
var models     = require('../models/dash-models.js');
var loginstate = require('../lib/loginstate.js');
var errlib     = require("../lib/error.js");

var err            = errlib.err;
var errout         = errlib.errout();
var checkForSQLErr = errlib.errout( [ models.CODES.SQL_ERROR ] );

function getDash( req, res )
{
    var uid = loginstate.getID(req);
    
    if( !uid ) {
	    errout( req, res, err( 400, "Only somebody signed in can save site info." ) );
        return(false);
    }

    var rows = [];
    res.render( '../views/dash/home.html',
                {
                   layout: 'global.html',
                   pageTitle: 'Safe Harbor Dashboard',
                   bodyClass: 'dash',
                   auditItems: rows
                } );
}

exports.install = function(app) 
{
    app.get( '/dash', getDash );
    /*
	// Dealing with takedown requests for logged in customers
	trivialRoute('/dash','home','dash','Todo');
	trivialRoute('/dash/list','list','dash','List');
	trivialRoute('/dash/stats','stats','dash','Stats');
	*/
    
}