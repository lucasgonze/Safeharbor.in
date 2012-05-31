
/*****************************
 * Initial submission of a takedown request and other features in support of rights holders.
 *****************************/

"use strict";

var models = require('../models/box-models.js');
var errlib = require('../lib/error.js');

exports.get = function(req,res){
	try {
		// look up metadata for the box number
		models.get(req.params.siteid,function(err,result){
			if(err){
				return(errlib.render(res,'Box not found','404'));
			}
			var vars = {
				'layout':'global.html',
				'pageTitle':'Copyright Inbox',
				'bodyClass':'box',
				'sitename':result.sitename,
				'domain':result.domain,
				'agentaddress':result.agentaddress,
				'agentemail':result.agentemail,
				'oid':result.oid
			};
		    res.render('box/top.html',vars);			
		});
	} catch(exception){
		// 500 error 
		console.log('Foofarraw');
		console.log(exception);
		errlib.render(res,'box.get','500');
	}	
};

// step 1 of submission process is to confirm the submission
exports.post = function(req,res){
	
	if( typeof req.params.siteid !== "string" || req.params.siteid.length < 1 ||
		typeof req.body.page !== "string" || req.body.page.length < 1 ||
		typeof req.body.where !== "string" || req.body.where.length < 1 ||
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
		
	try {
		// look up metadata for the box number
		models.get(req.params.siteid,function(err,result){
			if(err){ return(errlib.render(res,"model fail","500")); }
			
			var subject = "IMPORTANT: DMCA takedown request received";
			var text = "fixme: this text";
			var templateRelativePath = "../views/box/notificationemail.html";
			var templateVars = req.body;
			templateVars.sitename = result.sitename;
			templateVars.domain = result.domain;
			var callback = function(success,message){				
				if( !success ){
					errlib.render(res,"Unable to send mail","500");
					console.log("Unable to send mail: "+message);
				} else {
					errlib.render(res,'fixme: pretty page to say that the message has been sent','500');
				}
			};
			var mailer = require("../lib/mail.js");
			mailer.emailFromTemplate(result.agentemail,subject,text,templateRelativePath,templateVars,callback);
		});
	} catch(exception){
		errlib.render(res,"box.post",500);
		console.log('Caught exception -> 500 error in file '+__filename);
		console.log(exception);
	}

};
