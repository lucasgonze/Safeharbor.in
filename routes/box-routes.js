
/*****************************
 * Initial submission of a takedown request and other features in support of rights holders.
 *****************************/

"use strict";

var box     = require('../models/box-models.js');
var dash   = require('../models/dash-models.js');

var CODES = box.CODES;

var helpers = require('./router-helpers.js');

var util       = require('util');
var debug      = require('../lib/debug.js');
var utils      = require('../lib/utils.js');
var errlib     = require('../lib/error.js');
var Performer  = require('../lib/performer.js').Performer;

var errout           = errlib.errout();
var checkForSQLErr   = errlib.errout( [CODES.SQL_ERROR] );

exports.install = function( app )
{
	app.get ('/box/:regid([0-9a-f]+)$',  getBox);
	app.post('/box/:regid([0-9a-f]+)',   postBox);
}

function getBox(req,res){
	// look up metadata for the box number
	var p = box.get( req.params.regid, function (code, site) {
        checkForSQLErr( req, res, code, site );
        if( code == CODES.NO_RECORDS_FOUND )
        {
            errlib.render( res, 'That account does not exists!', 404 );
        }
        else if( code == CODES.SUCCESS ) 
        {
            res.render( 'box/top.html', utils.copy( {
                        layout:       'global.html',
                        pageTitle:    'Copyright Inbox',
                        bodyClass:    'box' }, 
                        site ));			
        }
    } );

    p.perform();
};

function notifyEmailer(req, res, contactInfo, mediaInfo ) {	
    return new Performer( 
            {   
                req: req,
                
                res: res,
            
                // N.B. these params are flipped coming from sendgrid
                callback: function(success,message) {
                    if( success ) {
                        res.render("box/success.html",
                                    { layout:"global.html",
                                       pageTitle:"Success",
                                       bodyClass:"box" } );
                    }   
                    else {
                        errout( req, res, err( 400, 'Email notify failed: ' + message)  );
                        this.stopChain();
                    }                    
                    
                },
                
                performer: function() {            
                    var subject = "IMPORTANT: DMCA takedown request received",
                        path = "../views/box/notificationemail.html",
                        mailerValues = this.findValue('auditDetail'),
                        mailer = require("../lib/mail.js");
                        
                    mailerValues.dashurl =  'http://'+req.headers.host+'/dash';                    
                    mailer.emailFromTemplate( 
                                          mailerValues.agentemail,
                                          subject,
                                          'text goes here', // TODO: um, did 'text' ever work here??
                                          path,
                                          mailerValues,
                                          this.bound_callback());
                }                
            });            
}

/*

 this is what comes in:
 { 
 
  belief: 'on',
  authorized: 'on',

  owners_full_name: 'fullNaming',
  full_name: 'Victor Stone',
  job_title: 'copy thug',  
  postal: 'aefewfijw aweifjaew few ',
  email: 'victor.stodne@gmail.com',
  phone: '5107175153',
  fax: '888393993',

    // N.B. These might not be arrays if there is only one
    // incident
  description: [ 'work is being', 'desc2', [length]: 2 ],
  page: 
   [ 'http://localhost.com/box/24738',
     'http://localhost.net/box/24738',
     [length]: 2 ],
  anchor: [ 'ch work is be', 'page2', [length]: 2 ] }


*/

function extractFields( body, argNames, expectsArray )
{
    if( util.isArray( body[argNames[0]] ) )
    {
        var ret = [ ], len = body[argNames[0]].length;
        
        for( var i = 0; i < len; i++ )
        {
            var rec = {};
            for( var n in argNames )
            {
                var name = argNames[n];
                rec[name] = body[name][i] || '';
            }
            ret.push(rec);            
        }
        return ret;
    }
    else
    {
        var rec = {};
        for( n in argNames )
        {
            var name = argNames[n];
            rec[name] = body[name] || '';
        }
        return expectsArray ? [ rec ] : rec;
    }
}

function postBox(req,res){

    // TODO: verify parameters
    
    function verifyCB( code, err )
    {
        checkForSQLErr( req, res, code, err );
        if( code == CODES.NO_RECORDS_FOUND )
        {
            errlib.render( res, 'Invalid account id', 404 );
        }
    }
    
    if( req.body.belief !== "on" || req.body.authorized !== "on") {
        errout( req, res, err( 400, 'invalid options to postBox') );
        return;
	}
    
    var regid = req.params.regid;
    
    var mediaArgNames = ['description','page','media_url','anchor'];
    var mediaArgs = extractFields(req.body, mediaArgNames,true);
        
    var contactArgNames = [ 'owners_full_name', 'full_name', 'job_title', 'postal', 'email', 'phone', 'fax' ];
    var contactArgs = extractFields(req.body, contactArgNames,false);
    
    var verify   = box.get( regid, verifyCB );
    var auditer  = dash.logTakeDownRequest( regid, contactArgs, mediaArgs, function( code, err ) { checkForSQLErr( req, res, code, err ) } );
    var detail   = dash.getAuditDetail( function( code, err ) { checkForSQLErr( req, res, code, err ) } );    
    var notifier = notifyEmailer( req, res );
    
    verify              // verify site record is valid
      .chain( auditer ) // put the TR into our database
      .chain( detail )  // get the new record back with SELECT
      .chain( notifier) // send email
      .perform();

};
