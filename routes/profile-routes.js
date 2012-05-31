
/*****************************
 * Login, logout, edit profile, reset password, edit site
 *****************************/

var models = require("../models/profile-models.js");
var loginstate = require('../lib/loginstate.js');

// log out
exports.clearLogin = function(req,res){
	loginstate.disable(req);
	res.redirect("/login");
}

exports.saveLogin = function(req,res){
	
	if( typeof req.body.email !== "string" || req.body.email.length < 1 ||
		typeof req.body.password !== "string" || req.body.password.length < 1 ) {		
		res.render("error/error.html",{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:"All params must be set.",code:"400"});
		return;		
	}

	try {
		// look into database to see whether the submitted information is correct
		models.checkAcct(req.body.email,req.body.password,function(err,result){
			if(err){
				// reject and show an error
				res.render("profile/login.html",{"layout":"global.html","pageTitle":"Log In","loginStatus":"fail",code:400});
			} else {
				loginstate.enable(req,result.id);
				res.redirect("/dash");
			}
		});
	} catch(exception){
		// 500 error 
		console.log("BP $.4");
		console.log(exception);
		res.render("error/error.html",{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:"Error $.4",code:"500"});
	}

}

// save a secret to the DB and email it to the email. note that we always show the "email sent" page, 
// but we only actually send the email if it was found in the db!
exports.recoverPassword = function(req,res){

	if( typeof req.body.email !== "string" || req.body.email.length < 1 ) {		
		res.render("error/error.html",{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:"All params must be set.",code:"400"});
		return;		
	}

	try {
		models.initPasswordReset(req.body.email,function(err,result){
			if(!err){
				// email a secret to the user with a link to the reset page	
				var backlink = "http://"+req.headers.host+"/lostpassword/"+result;
				var subject = "Password reset for Safeharbor.in";
				var plainOldAscii = "To reset your password go to "+backlink;
				var htmlTemplate = "/../views/profile/theemail.html";
				var htmlVars = {'backlink':backlink};
				require('../lib/mail.js').emailFromTemplate(req.body.email,subject,plainOldAscii,htmlTemplate,htmlVars,
					function(success,result){
						if( !success ){
							console.log("Unable to send email:")
							console.log(result);
							throw new Error("Unable to send email");
						}
					});	
			}
			res.render("profile/success.html",{layout:"global.html",pageTitle:"Password Reset","bodyClass":"profile"});			
		});
	} catch(exception){
		// 500 error 
		console.log("Internal error in initPasswordReset");
		console.log(exception);
		res.render("error/error.html",{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:"Error $.3",code:"500"});
	}
}

// given that the user has passed a password recovery token in the URL, send
// them to the password reset form.
exports.verifySecret = function(req,res){
	var vars = {layout:"global.html",pageTitle:"Enter New Password","bodyClass":"profile","resetSecret":req.params.resetSecret};
	res.render("profile/newpasswordform.html",vars);			
}

// given that the user has passed a password recovery token in the URL, check it in 
// the db and send them on to the password reset page if it checks out.
exports.postNewPassword = function(req,res){
	try {		
		if( typeof req.params.resetSecret !== "string" || req.params.resetSecret.length < 10 ||
			typeof req.body.password !== "string" || req.body.password.length < 4 || 
			typeof req.body.confirm !== "string" || req.body.confirm.length < 4 || 
			req.body.confirm !== req.body.password 
		 )
			throw new Error("Error (sneaky friday)");

		models.saveNewPassword(req.params.resetSecret,req.body.password,function(err,result){
			if(err){
				console.log("fixme: user flow for bad tokens");
				res.render("error/error.html",{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:"Token not found or expired.",code:"404"});
				return;
			}
			var alert = '<div class="alert alert-success"><i class="icon-ok"></i> Success</div>';
			var vars = {layout:"global.html",pageTitle:"Log In",'alert-from-reset':alert};
			res.render("profile/login.html",vars);			
		});
	} catch(exception){
		// 500 error 
		console.log("Internal error in verifySecret");
		console.log(exception);
		res.render("error/error.html",{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:"Error ( ^_)",code:"500"});
	}
}

/* Different than postNewPassword in that it's used by a logged-in user rather than one who has lost their password. */
exports.savePasswordReset = function(req,res){
	try {		
		if( typeof req.body.current !== "string" || req.body.current < 4 || 
			typeof req.body.newpassword !== "string" || req.body.newpassword < 4 || 
			typeof req.body.confirm !== "string" || 
			req.body.newpassword !== req.body.confirm 
		 )
			throw new Error("flaky lunch");

		models.resetPasswordForLoggedInUser(loginstate.getID(req),req.body.current,req.body.newpassword,function(err,result){
			if(err){
				var alert = '<div class="alert alert-error"><i class="icon-error"></i> Check your password</div>';	
				var vars = {layout:"global.html",pageTitle:"Reset Password",'alert':alert};
				res.render("profile/passwordreset.html",vars);	
				return;
			} 
			var alert = '<div class="alert alert-success"><i class="icon-ok"></i> Success</div>';
			var vars = {layout:"global.html",pageTitle:"Log In",'alert':alert,'nastykludge':'display:none'};
			res.render("profile/passwordreset.html",vars);	
		});
	} catch(exception){
		// 500 error 
		console.log("Internal error in savePasswordReset");
		console.log(exception);
		res.render("error/error.html",{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:"Error ( *_)",code:"500"});
	}	
}

exports.deleteAccount = function(req,res){
	try {		
		models.deleteAccount(req.session.userid,function(err,result){
			
			var loginstate = require('../lib/loginstate.js');
			loginstate.disable(req);
			
			var alert = '<div class="alert alert-success"><i class="icon-ok"></i> Success</div>';
			var vars = {layout:"global.html",pageTitle:"Log In",'alert':alert,'nastykludge':'display:none'};
			res.render("profile/passwordreset.html",vars);	
		});
	} catch(exception){
		// 500 error 
		console.log("Internal error in deleteAccount");
		console.log(exception);
		res.render("error/error.html",{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:"Error ( *_)",code:"500"});
	}	
}

exports.emitSiteEditor = function(req,res){	
	
	console.log("bp 444");
	process.on('uncaughtException', function (exception) {
		console.log("bp 445");
	   res.send("yay!");
	  });
	console.log("bp 446");
	
	var pageTitle = "";
	console.log("emitSiteEditor session state");
	console.log(req.session);
	
	if( ! loginstate.isLoggedIn() ){
		console.log("bp 444");
		return(res.render("error/error.html",
		{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:"Not Found",code:"404"}));		
	}
	
	try {
		console.log("bp 447");
		var uid = loginstate.getID(req);
		models.getSiteForUser(uid, function(err,result){

			throw("thrown within callback");
		
			if(err) throw("No site for UID");
			var vars = {
					layout: "global.html",
					pagetitle: "Edit Site",
					bodyClass: "siteeditor",
					sitename: result.sitename,
					sitedomain: result.domain,
					agentaddress: result.agentaddress,
					agentemail: result.agentemail
				};			
			res.render("profile/siteeditor.html",vars);
		
		});
	} catch(ex){
		console.log("girls in apartment 3G: ");
		console.log(ex);
		res.render("error/error.html",{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:"Error from the girls in apartment 3G",code:"500"});		
	}
}

exports.saveSiteEdit = function(req,res){

	console.log("saveSiteEdit session state");
	console.log(req.session);	
	
	if( ! loginstate.isLoggedIn() )
		return(res.render("error/error.html",
		{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:"Not Found",code:"404"}));
	
	try {
		var uid = loginstate.getID(req);
		if( uid === null )
			throw("Corrupt session");

		models.setSiteForUser(
			uid,
			req.body.sitename, 
			req.body.domain, 
			req.body.agentaddress, 
			req.body.agentemail, 
			function(err,result){
		
			if(err) throw("Unable to save");
			
			var vars = {
					layout: "global.html",
					pageTitle: "Success",
					bodyClass: "success",
				};			
			res.render("success.html",vars);
		
		});
	} catch(ex){
		console.log("girls in apartment 13G: ");
		console.log(ex);
		res.render("error/error.html",{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:"Error from the girls in apartment 13G",code:"500"});		
	}	

}
