var safeharbor = require('../lib/safeharbor.js');
var debug      = safeharbor.debug;
var utils      = safeharbor.utils;
var errlib     = safeharbor.errors;
var page       = safeharbor.page;
var loginstate = safeharbor.loginstate;

var util = require('util');
var errout = errlib.errout();

var dash       = require('../models/dash-models.js');
var profile    = require('../models/profile-models.js');


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
    var log = dash.getAuditLog(uid,
              function(code,rows) 
                    {
                        if( code != CODES.SUCCESS )
                            return;

                        if( rows && rows.length )
                        {
                            res.render( 'dash/list.html',
                                        {
                                           pageTitle: 'Safe Harbor - Disputes',
                                           bodyClass: 'disputes',
                                           auditItems: rows
                                        } );
                        }
                        else
                        {
                            res.outputMessage( 
                                            page.MESSAGE_LEVELS.success,
                                            "Good news!",
                                            "No has compained about your site! Thank you! Drive Safely."
                                            );
                            res.render( page.MESSAGE_VIEW,
                                        {  pageTitle:"Safe Harbor - Disputes",
                                           bodyClass:"disputes"
                                         } );                            
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
                    res.render( 'dash/detail.html',
                                {
                                   pageTitle: 'Safe Harbor - Dispute Detail',
                                   bodyClass: 'disputes',
                                   detail: detail[0] || detail
                                } );
                }
        });
    
    verify.chain(detail).handleErrors(req,res).perform();
}

