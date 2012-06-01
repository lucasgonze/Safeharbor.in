
/*****************************
 * Initial submission of a takedown request and other features in support of rights holders.
 *****************************/

"use strict";

var models = require('../models/box-models.js');
var errlib = require('../lib/error.js');

// fixme: OOPy rewrite using routeUtils.RouteHandler
exports.get = function(req,res){
	// look up metadata for the box number
	models.get(req.params.siteid,function(err,result){
		if(err !== null){
			return(errlib.render(res,'Box not found','404',"Box.get error: "+err));
		}
		var vars = {
			'layout':'global.html',
			'pageTitle':'Copyright Inbox',
			'bodyClass':'box',
			'sitename':result.sitename,
			'domain':result.domain,
			'agentaddress':result.agentaddress,
			'agentemail':result.agentemail,
			'oid':result.oid,
		};
	    res.render('box/top.html',vars);			
	});
};

// fixme: OOPy rewrite using routeUtils.RouteHandler
exports.post = function(req,res){

	if( typeof req.params.siteid !== "string" || req.params.siteid.length < 1 ||
		typeof req.body.page !== "string" || req.body.page.length < 1 ||
		typeof req.body.description !== "string" || req.body.description.length < 1 ||
		typeof req.body.email !== "string" || req.body.email.length < 1 ||
		typeof req.body.phone !== "string" || req.body.phone.length < 1 ||
		typeof req.body.postal !== "string" || req.body.postal.length < 1 ||
		typeof req.body.authorized !== "string" || req.body.authorized.length < 1 ||
		typeof req.body.belief !== "string" || req.body.belief.length < 1 ||
		req.body.belief !== "on" ||
		req.body.authorized !== "on"){
		return errlib.render(res,'I fail to see the humor in the situation','400');
	}
		
	// look up metadata for the box number
	models.get(req.params.siteid,function(err,result){

		// Box ID not found. A real user should never be in this position, hence the 
		// reason to consider it an application error.
		if(err !== null){ return(errlib.render(res,"model fail","500")); }
		
		var subject = "IMPORTANT: DMCA takedown request received";
		var templateRelativePath = "../views/box/notificationemail.html";
		var templateVars = req.body;
		templateVars.sitename = result.sitename;
		templateVars.domain = result.domain;
		
		var callback = function(success,message){	
			// Sendgrid's error flag doesn't use the Node.js convention of having non-null mean success			
			if( !success ){
				errlib.render(res,"Unable to send mail","500","Unable to send mail: "+message);
			} else {
				res.render("box/success.html",{layout:"global.html",pageTitle:"Success",bodyClass:"box"});
			}
		};

		var mailer = require("../lib/mail.js");
		mailer.emailFromTemplate(result.agentemail,subject,text,templateRelativePath,templateVars,callback);
	});

};
