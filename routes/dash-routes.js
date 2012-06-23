var util       = require('util');
var dash       = require('../models/dash-models.js');
var profile    = require('../models/profile-models.js');
var loginstate = require('../lib/loginstate.js');
var errlib     = require("../lib/error.js");
var debug      = require("../lib/debug.js");

var CODES          = dash.CODES;
var exp            = errlib.err;
var errout         = errlib.errout();
var checkForSQLErr = errlib.errout( [ CODES.SQL_ERROR ] );

function getDash( req, res )
{
    var uid = loginstate.getID(req);
    
    if( !uid ) {
	    errout( req, res, exp( 400, "Only somebody signed in can see site info." ) );
        return(false);
    }

    var log = dash.getAuditLog(uid,function(code,rows) 
                    {
                        checkForSQLErr( req, res, code, rows );
                        if( code == CODES.SUCCESS )
                        {
                            if( rows && rows.length )
                            {
                                res.render( '../views/disputes/all.html',
                                            {
                                               layout: 'signedin.html',
                                               pageTitle: 'Safe Harbor - Disputes',
                                               bodyClass: 'disputes',
                                               auditItems: rows
                                            } );
                            }
                            else
                            {
                                errlib.render( res, 'Good news! No has compained about your site! Thank you! Drive Safely', 0, 0 );
                            }
                        }
                    });
    
    log.perform();
}

function getDetail( req, res )
{
    var auditId = req.params.auditid;
    var detail = dash.getAuditDetail( auditId, function( code, detail ) {
                checkForSQLErr( req, res, code, detail );
                if( code == CODES.SUCCESS )
                {
                    res.render( '../views/disputes/detail.html',
                                {
                                   layout: 'signedin.html',
                                   pageTitle: 'Safe Harbor - Disputes',
                                   bodyClass: 'disputes',
                                   detail: detail[0]
                                } );
                }
    });
    
    detail.perform();
}

exports.install = function(app) 
{
    app.get( '/dash', getDash );
    app.get( '/disputes', getDash );
    app.get( '/detail/:auditid([0-9]+)$', getDetail );
    /*
	// Dealing with takedown requests for logged in customers
	trivialRoute('/dash','home','dash','Todo');
	trivialRoute('/dash/list','list','dash','List');
	trivialRoute('/dash/stats','stats','dash','Stats');
	*/    
}