
/*****************************
 * Initial submission of a takedown request and other features in support of rights holders.
 *****************************/

"use strict";

var models  = require('../models/box-models.js');
var audit   = require('../models/dash-models.js');

var helpers = require('./router-helpers.js');

var util       = require('util');
var debug      = require('../lib/debug.js');
var utils      = require('../lib/utils.js');
var errlib     = require('../lib/error.js');
var Performer  = require('../lib/performer.js').Performer;

var errout           = errlib.errout();
var checkForFoundErr = errlib.errout( [models.CODES.NO_RECORDS_FOUND, models.CODES.SQL_ERROR] );
var checkForSQLErr   = errlib.errout( [models.CODES.SQL_ERROR] );

exports.install = function( app )
{
	app.get('/box/:siteid([0-9]+)$',  getBox);
	app.post('/box/:siteid([0-9]+)',  postBox);
//	app.post('/box/:siteid([0-9]+)$', postBox);
}

function getBox(req,res){
	// look up metadata for the box number
	var p = models.get( parseInt(req.params.siteid), function (code, site) {
        checkForFoundErr( req, res, code, site );
        if( code == models.CODES.SUCCESS ) 
        {
            res.render( 'box/top.html', utils.copy( {
                        layout:       'global.html',
                        pageTitle:    'Copyright Inbox',
                        bodyClass:    'box' }, site ));			
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
                    // Sendgrid's error flag doesn't use the Node.js convention of having non-null mean success			
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
                /*
                    Mailer values
                        acct: 1,
                        acctid: 1,
                        agentaddress: '7 foo Ln., Bar Park, IL',
                        agentemail: 'assoverteakettle.org@gmail.com',
                        attachment: '',
                        auditid: 11,
                        contact: 14,
                        contactid: 14,
                        creation: Fri, 22 Jun 2012 05:59:36 GMT,
                        domain: 'assoverteakettle.org',
                        email: 'victor.stodne@gmail.com',
                        fax: '888393993',
                        formatted_date: 'June 22, 2012',
                        full_name: 'Joe Doh',
                        job_title: 'copyright thug',
                        opname: 'takedownRequest' },
                        owners_full_name: 'Sally Doh',
                        password: 'qqqq',
                        phone: '5107175153',
                        postal: 'aefewfijw aweifjaew few ',
                        resetdate: null,
                        resetsecret: null,
                        site: 40,
                        siteid: 40,
                        sitename: 'Ass Over Tea Kettle',
                            
                            takedownRequests: 
                             [ { anchor: 'ch work is be',
                                 media_url: 'http://somemedia.mp3',
                                 audit: 11,
                                 mediaid: 6,
                                 page: 'http://localhost.com/box/24738',
                                 description: 'work is being' },
                               { anchor: 'page2',
                                 media_url: 'http://someothermedia.mp3',
                                 audit: 11,
                                 mediaid: 7,
                                 page: 'http://localhost.net/box/24738',
                                 description: 'desc2' }
                               ],
                            
                        }}
                */                    
                    var subject = "IMPORTANT: DMCA takedown request received",
                        path = "../views/box/notificationemail.html",
                        mailerValues = this.findValue('auditDetail'),
                        mailer = require("../lib/mail.js");
                        
                    mailerValues.dashurl =  'http://'+req.headers.host+'/dash';                    
                    //debug.render( res, ['mailerValues', mailerValues ] );
                    //return;
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
                rec[name] = body[name][i];
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
            rec[name] = body[name];
        }
        return expectsArray ? [ rec ] : rec;
    }
}

function postBox(req,res){

    /*
        // obsolete - doesn't work with array'd parameters
    var values = helpers.checkStringParams( req, 
                                    res, 
                                    utils.copy( {}, req.body, req.params ), 
                                    [ 'siteid','page','anchor','description','email','phone','postal'] );
    debug.out( 'Values: ', values );
    
    if( !values )
        return;
    */
    
    if( req.body.belief !== "on" || req.body.authorized !== "on") {
        errout( req, res, err( 400, 'invalid options to postBox') );
        return;
	}
    
    var siteid = req.params.siteid;
    
    var mediaArgNames = ['description','page','media_url','anchor'];
    var mediaArgs = extractFields(req.body, mediaArgNames,true);
        
    var contactArgNames = [ 'owners_full_name', 'full_name', 'job_title', 'postal', 'email', 'phone', 'fax' ];
    var contactArgs = extractFields(req.body, contactArgNames,false);
    
    var verify   = models.get( siteid, function( code, err ) { checkForFoundErr( req, res, code, err ) } );
    var auditer  = audit.logTakeDownRequest( siteid, contactArgs, mediaArgs, function( code, err ) { checkForSQLErr( req, res, code, err ) } );
    var detail   = audit.getAuditDetail( function( code, err ) { checkForSQLErr( req, res, code, err ) } );    
    var notifier = notifyEmailer( req, res );
    
    verify              // verify site record is valid
      .chain( auditer ) // put the TR into our database
      .chain( detail )  // get the new record back with SELECT
      .chain( notifier) // send email
      .perform();

};
