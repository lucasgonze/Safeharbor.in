var util       = require('util');
var dash       = require('../models/dash-models.js');
var profile    = require('../models/profile-models.js');
var loginstate = require('../lib/loginstate.js');
var errlib     = require("../lib/error.js");
var debug      = require("../lib/debug.js");

var CODES      = dash.CODES;

exports.install = function(app) 
{
    var logged_in = app.checkRole(app.ROLES.logged_in);
    
    app.get( '/dash', logged_in, getDash );
    app.get( '/disputes', logged_in, getDash );
    app.get( '/detail/:auditid([0-9]+)$', logged_in, getDetail );
}

function getDash( req, res  )
{
    renderDashForAccount( req, res, loginstate.getID(req) );
}

var renderDashForAccount = exports.renderDashForAccount = function( req, res, uid )
{
    var log = dash.getAuditLog(uid,function(code,rows) 
                    {
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
    
    log.handleErrors( req, res ).perform();
}

function getDetail( req, res )
{
    var auditId = req.params.auditid;
    
    var verify = dash.verifyAuditDetailOwner( auditId, loginstate.getID(req), function(){} );
    var detail = dash.getAuditDetail( auditId, function( code, detail ) {
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
                else
                {
                        errlib.render( res, 'wups, trouble with this audit detail', 0, 0 );
                }
        });
    
    verify.chain(detail).handleErrors(req,res).perform();
}

