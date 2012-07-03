
/*****************************
 * Initial submission of a takedown request and other features in support of rights holders.
 *****************************/

"use strict";

var safeharbor = require('../lib/safeharbor.js');
var debug      = safeharbor.debug;
var utils      = safeharbor.utils;
var errlib     = safeharbor.errors;
var page       = safeharbor.page;
var Performer  = safeharbor.Performer;

var util = require('util');
var errout = errlib.errout();

var box     = require('../models/box-models.js');
var dash    = require('../models/dash-models.js');

var CODES = box.CODES;


exports.install = function( app )
{
	app.get ('/box/bymail/:regid([0-9a-f]+)$',  getByMail);
	app.get ('/box/form/:regid([0-9a-f]+)$',  	getForm);
	app.get ('/box/help/learn$',  				getLearn);
	app.get ('/box/help/role$',  				getRoleHelp);
	app.get ('/box/role/:regid([0-9a-f]+)$',  	getRole);
	app.get ('/box/splash/:regid([0-9a-f]+)$',  getSplash);
	app.get ('/box/:regid([0-9a-f]+)$',  		getBox);
	app.post('/box/:regid([0-9a-f]+)',   		postBox);
}

function getByMail(req,res){
       res.render( 'box/bymail.html', {
                   layout:       'box/box_main.html',
                   skipMenu:     true,
                   pageTitle:    'Copyright - Submit Dispute',
                   bodyClass:    'box' } );		
};

function getForm(req,res){
       res.render( 'box/form-v2.html', {
                   layout:       'box/box_main.html',
                   skipMenu:     true,
                   pageTitle:    'Copyright - Submit Dispute',
                   bodyClass:    'box' } );		
};

function getRoleHelp(req,res){
       res.render( 'box/rolehelp.html', {
                   layout:       'box/box_main.html',
                   skipMenu:     true,
                   pageTitle:    'Copyright Help - Role',
                   bodyClass:    'box' } );		
};

function getLearn(req,res){
       res.render( 'box/learn.html', {
                   layout:       'box/box_main.html',
                   skipMenu:     true,
                   pageTitle:    'Copyright Help - Learn',
                   bodyClass:    'box' } );		
};

function getRole(req,res){
       res.render( 'box/role.html', {
                   layout:       'box/box_main.html',
                   skipMenu:     true,
                   pageTitle:    'Copyright Dispute - Select Role',
                   bodyClass:    'box' });			
};

function getSplash(req,res){
       res.render( 'box/splash.html', utils.copy( {
                   layout:       'box/box_main.html',
                   skipMenu:     true,
                   pageTitle:    'Copyright Dispute',
                   bodyClass:    'box' }));			
};

function getBox(req,res){
	// look up metadata for the box number
	var p = box.get( req.params.regid, function (code, site) {
        if( code != CODES.SUCCESS ) 
            return;

        res.render( 'box/form.html', utils.copy( {
                    layout:       'box/box_main.html',
                    skipMenu:     true,
                    pageTitle:    'Copyright Dispute Form',
                    bodyClass:    'box' }, 
                    site ));			
    } );

    p.handleErrors(req,res,[CODES.MULTIPLE_RECORDS_FOUND,CODES.NO_RECORDS_FOUND]).perform();
};

function notifyEmailer(req, res, contactInfo, mediaInfo ) {	
    return new Performer( 
            {   
                // N.B. these params are flipped coming from sendgrid
                callback: function(success,message) {
                    if( success ) {
                        res.outputMessage( 
                                        page.MESSAGE_LEVELS.success,
                                        "Your request has been received.",
                                        "Please expect a response via the contact information you provided."
                                        );
                        res.render({   layout:"box/box_main.html",
                                       pageTitle:"Success",
                                       sitename: this.sitename,
									   domain: this.domain
                                     } );
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
                        
                    this.sitename = mailerValues.sitename;
                    
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
    
    function nop() { }
    
    if( req.body.belief !== "on" || req.body.authorized !== "on") {
        errout( req, res, err( 400, 'invalid options to postBox') );
        return;
	}
    
    var regid = req.params.regid;
    
    var mediaArgNames = ['description','page','media_url','anchor'];
    var mediaArgs = extractFields(req.body, mediaArgNames,true);
        
    var contactArgNames = [ 'owners_full_name', 'full_name', 'job_title', 'postal', 'email', 'phone', 'fax' ];
    var contactArgs = extractFields(req.body, contactArgNames,false);
    
    var verify   = box.get( regid, nop );
    var auditer  = dash.logTakeDownRequest( regid, contactArgs, mediaArgs, nop );
    var detail   = dash.getAuditDetail( nop );    
    var notifier = notifyEmailer( req, res );
    
    verify              // verify site record is valid
      .handleErrors( req, res, [CODES.NO_RECORDS_FOUND] )
      .chain( auditer ) // put the TR into our database
      .chain( detail )  // get the new record back with SELECT
      .chain( notifier) // send email
      .perform();

};
