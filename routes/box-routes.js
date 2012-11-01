
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

var mailer = require("../lib/mail.js");

var CODES = box.CODES;


exports.install = function( app )
{
	app.get ('/box/bymail/:regid([0-9a-f]+)$',  	getByMail);
	app.get ('/box/form/:regid([0-9a-f]+)$',  		getForm);
	app.get('/myinbox',	   							getOwnForm);
	app.get ('/box/help/learn/:regid([0-9a-f]+)$',	getLearn);
	app.get ('/box/help/role/:regid([0-9a-f]+)$',  	getRoleHelp);
	app.get ('/box/role/:regid([0-9a-f]+)$',  		getRole);
	app.get ('/box/:regid([0-9a-f]+)$',  			getSplash);
	app.post('/box/:regid([0-9a-f]+)',   			postBox);
}

// convenience function for reuse only in this file
function wrapBox(req,res,viewPath,pageTitle,bodyClass,extraVars){

	var p = box.get( req.params.regid, function (code, site) {
        if( code != CODES.SUCCESS ) 
            return;

		var pageVars = 	{
		                    layout:     'box/box_main.html',
		                    skipMenu:   true,
		                    pageTitle:  pageTitle,
		                    bodyClass:  bodyClass,
							regid: 		req.params.regid
	 					};
		pageVars = utils.copy(pageVars,site);
		if( typeof extraVars !== "undefined")
			pageVars = utils.copy(pageVars,extraVars);
			
		// console.log("passing vars to wrapBox")
		// console.log(pageVars)
        res.render( viewPath, pageVars);			
    } );

    p.handleErrors(req,res,[CODES.MULTIPLE_RECORDS_FOUND,CODES.NO_RECORDS_FOUND]).perform();	
}

function getByMail(req,res){
	wrapBox(req,res,'box/bymail.html','Copyright - Submit By Mail','bymail');
};

// for submitting a dispute to yourself
function getOwnForm(req,res){

	var acctid = 1; // assume for now, just to get started
	var viewPath = "dash/admin_add_infringement.html";
	var pageTitle = "fixme";
	var bodyClass = "fixme";
	var extraVars = {};
	
	var p = box.getOwn( acctid, function (code, site) {
        if( code != CODES.SUCCESS ) 
            return;

		var pageVars = 	{
		                    layout:     'box/box_main.html',
		                    skipMenu:   true,
		                    pageTitle:  pageTitle,
		                    bodyClass:  bodyClass,
							regid: 		req.params.regid
	 					};
		pageVars = utils.copy(pageVars,site);
		if( typeof extraVars !== "undefined")
			pageVars = utils.copy(pageVars,extraVars);

		// console.log("passing vars to wrapBox")
		// console.log(pageVars)
        res.render( viewPath, pageVars);			
    } );

    p.handleErrors(req,res,[CODES.MULTIPLE_RECORDS_FOUND,CODES.NO_RECORDS_FOUND]).perform();			
	
}

function getForm(req,res){

	var roleCopyrightOwnerChecked;
	var roleAuthorizedRepresentativeChecked;
	var roleOtherChecked;

	if( req.query["person-type"] === "co" ) // copyright owner
		roleCopyrightOwnerChecked = "checked";
	else if( req.query["person-type"] === "ar" ) // authorized representative
		roleAuthorizedRepresentativeChecked = "checked";
	else
		roleOtherChecked = "checked";
			
	wrapBox(req,res,'box/form.html','Copyright - Submit Dispute','dmcaform',{
		roleCopyrightOwnerChecked: roleCopyrightOwnerChecked,
		roleAuthorizedRepresentativeChecked: roleAuthorizedRepresentativeChecked,
		roleOtherChecked: roleOtherChecked
	});
};

function getRoleHelp(req,res){
	wrapBox(req,res,'box/rolehelp.html','Copyright Help - Role','rolehelp');
};

function getLearn(req,res){
	wrapBox(req,res,'box/learn.html','Copyright Help - Learn','learn');
};

function getRole(req,res){
	wrapBox(req,res,'box/role.html','Copyright - Select Role','role');
};

function getSplash(req,res){
	wrapBox(req,res,'box/splash.html','Copyright','splash');
};

function notifyEmailer(req, res, contactInfo, mediaInfo ) {	
    return new Performer( 
            {   
                // N.B. these params are flipped coming from sendgrid
                callback: function(success,message) {
                    if( success ) {
						res.status(202);
						wrapBox(req,res,"box/receipt.html","Accepted","nop",{
							sitename: this.sitename,
						    domain: this.domain
						});
                    }   
                    else {
						// fixme: page admin on call
						var emergency = require("lib/emergency");
						emergency.alert('Email notify failed: ' + message);
                        errout( req, res, errlib.err( 500, 'Email notify failed: ' + message)  );
                        this.stopChain();
                    }                 
                    
                },
                
                performer: function() {            
                    var mailerValues = this.findValue('auditDetail');
                    mailerValues.dashurl =  'https://'+req.headers.host+'/dash';   
                 	console.log("Sending notification mail to");
					console.log(mailerValues.agentemail);

					mailer.to(
						{
							viewsSubdir: "box",
							template: "notificationemail", 
							to: mailerValues.agentemail,
						    subject: utils.gettext("IMPORTANT: DMCA takedown request received"),	
						
							templateVars: {
								sitename: mailerValues.sitename,
								domain: mailerValues.domain,
								full_name: mailerValues.full_name,
								email: mailerValues.email,
								phone: mailerValues.phone,
								postal: mailerValues.agentaddress,
								takedownRequests: mailerValues.takedownRequests,
								dashurl: mailerValues.dashurl
							} 
						}, 
						this.bound_callback()
					);

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

	function checkArray(name){
		console.log("sanitizing array "+name);
		console.log(typeof(req.body[name]) )
		if( typeof(req.body[name]) !== "object") return false;
		console.log(req.body[name].length);
		if( req.body[name].length < 1 ) return false; 
		if( req.body[name].length > 255) return false;
		return(true);		
	}
	
	function checkString(name){
		console.log("sanitizing string "+name);
		if( typeof(req.body[name]) !== "string") return false;
		// console.log(req.body[name].length);
		if( req.body[name].length < 1 ) return false; 
		if( req.body[name].length > 255) return false;
		return(true);
	}

	// some form fields may have identical IDs. When that happens the different fields with the same ID are sent as arrays.
	function checkStringOrArray(name){
		console.log("checkStringOrArray")
		if( typeof(req.body[name]) === "string") 
			return(checkString(name));
		if( typeof(req.body[name]) === "object") 
			return(checkArray(name));
		console.log("returning false for name "+name)
		return(false);
	}
	/* these fields are optional, so we don't validate them:
		owners_full_name, job_title, fax
	*/

	console.log("Logging req.body in box-routes.js: "); console.log(req.body);
    if( 
		(req.body.belief !== "on" && req.body.authorized !== "on") ||
		!checkString('full_name') ||
		!checkString('email') ||
		!checkString('phone') ||
		!checkString('postal') ||
		!checkStringOrArray('page') ||
		!checkStringOrArray('anchor') ||
		!checkStringOrArray('description') || 
		!checkString('signature')
		) {
        errout( req, res, errlib.err( 400, 'invalid options to postBox') );
        return;
	}
    
    var regid = req.params.regid;
    
    var mediaArgNames = ['description','page','media_url','anchor'];
    var mediaArgs = extractFields(req.body, mediaArgNames,true);
        
    var contactArgNames = [ 'owners_full_name', 'full_name', 'job_title', 'postal', 'email', 'phone', 'fax', 'signature' ];
    var contactArgs = extractFields(req.body, contactArgNames,false);
    
	debug.setVolume(1) // turn on debugging
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
