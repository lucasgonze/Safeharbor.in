
/*****************************
 * Login, logout, edit profile, reset password, edit site
 *****************************/

var models = require("../models/profile-models.js");
var loginstate = require('../lib/loginstate.js');
var errlib = require("../lib/error.js");
var routeUtils = require("./route-utils.js");

// log out
exports.clearLogin = function(req,res){
	loginstate.disable(req);
	res.redirect("/login");
}

// fixme: OOPy rewrite using routeUtils.RouteHandler
exports.saveLogin = function(req,res){
	
	if( typeof req.body.email !== "string" || req.body.email.length < 1 ||
		typeof req.body.password !== "string" || req.body.password.length < 1 ) {
		return(errlib.render(res,"All params must be set.","400",req.body));		
	}

	// look into database to see whether the submitted information is correct
	models.checkAcct(req.body.email,req.body.password,function(err,result){
		if( err !== null){
			// db fault. 
			return(errlib.render(res,"DB fault","500",req.body));		
		} 
		if( result === null ){
			// wrong username or password
			res.render("profile/login.html",{"layout":"global.html","pageTitle":"Log In","loginStatus":"fail",code:400});
			return;
		}
		loginstate.enable(req,result.id);
		res.redirect("/dash");
	});
}

// save a secret to the DB and email it to the email. note that we always show the "email sent" page, 
// but we only actually send the email if it was found in the db!
// fixme: OOPy rewrite using routeUtils.RouteHandler
exports.recoverPassword = function(req,res){

	if( typeof req.body.email !== "string" || req.body.email.length < 1 ) {		
		return(errlib.render(res,"All params must be set.","400",req.body));		
	}

	models.initPasswordReset(req.body.email,function(err,result){
		
		if( err !== null ){	
			return(errlib.render(res,"No luck.","500",err));		
		}

		if( result === null ){ // null means not found
			res.render("profile/success.html",{layout:"global.html",pageTitle:"Password Reset","bodyClass":"profile"});	
			return;		
		}

		// email a secret to the user with a link to the reset page	
		var backlink = "http://"+req.headers.host+"/lostpassword/"+result;
		var subject = "Password reset for Safeharbor.in";
		var plainOldAscii = "To reset your password go to "+backlink;
		var htmlTemplate = "/../views/profile/theemail.html";
		var htmlVars = {'backlink':backlink};
		var sendgrid = require('../lib/mail.js');
		sendgrid.emailFromTemplate(req.body.email,subject,plainOldAscii,htmlTemplate,htmlVars,
			function(success,result){
				if( !success ){
					console.log("Unable to send email:")
					console.log(result);
					throw new Error("Unable to send email");
				}
			});	

		res.render("profile/success.html",{layout:"global.html",pageTitle:"Password Reset","bodyClass":"profile"});			
	});
}

// given that the user has passed a password recovery token in the URL, send
// them to the password reset form.
exports.verifySecret = function(req,res){
	var vars = {layout:"global.html",pageTitle:"Enter New Password","bodyClass":"profile","resetSecret":req.params.resetSecret};
	res.render("profile/newpasswordform.html",vars);			
}

// given that the user has passed a password recovery token in the URL, check it in 
// the db and send them on to the password reset page if it checks out.
// fixme: OOPy rewrite using routeUtils.RouteHandler
exports.postNewPassword = function(req,res){ 

		if( typeof req.params.resetSecret !== "string" || req.params.resetSecret.length < 10 ||
			typeof req.body.password !== "string" || req.body.password.length < 4 || 
			typeof req.body.confirm !== "string" || req.body.confirm.length < 4 || 
			req.body.confirm !== req.body.password 
		 ){ return(errlib.render(res,"Bad params","400",err));}

		models.saveNewPassword(req.params.resetSecret,req.body.password,function(err,result){
			if( err !== null ){
				return(errlib.render(res,"Internal error (43)","500",err)); // DB error
			}

			if( result === null){ // not found
				// bad tokens could well come from a cracker testing the doors. this is the 
				// location to do security measures like rate limiting.
				return(errlib.render(res,"Not found","404",err)); // DB error
			}

			res.render("success.html",{layout:"global.html",pageTitle:"Success"});	
/*

			var alert = '<div class="alert alert-success"><i class="icon-ok"></i> Success</div>';
			var vars = {layout:"global.html",pageTitle:"Log In",'alert-from-reset':alert};
			res.render("profile/login.html",vars);			
			*/
		});
}

/* Different than postNewPassword in that it's used by a logged-in user rather than one who has lost their password. */
// fixme: OOPy rewrite using routeUtils.RouteHandler
exports.savePasswordReset = function(req,res){

	if( typeof req.body.current !== "string" || req.body.current < 4 || 
		typeof req.body.newpassword !== "string" || req.body.newpassword < 4 || 
		typeof req.body.confirm !== "string" || 
		req.body.newpassword !== req.body.confirm 
		 ){ return(errlib.render(res,"Bad params","400",err));}

	if( ! loginstate.isLoggedIn() ){
		 return(errlib.render(res,"Only somebody signed in can reset their password.","400"));
	}

	models.resetPasswordForLoggedInUser( loginstate.getID(req), req.body.current, req.body.newpassword,
	function(err,result){
		
		if( err !== null ){ 
			return(errlib.render(res,"Internal error (44)","500",err)); // DB error			
		}

		if( result === null ){ // not found -> they got current password wrong
			// fixme: instead of inserting html, have this be static html in the original page and show/hide
			// by setting a class variable
			// 'alert':alert,
			var alert = '<div class="alert alert-error"><i class="icon-error"></i> Check your password</div>';	
			var vars = {layout:"global.html",pageTitle:"Reset Password",bodyClass:'showerror'};
			res.render("profile/passwordreset.html",vars);	
			return;
		}
		
		res.render("success.html",{layout:"global.html",pageTitle:"Success"});	
	});
}

// fixme: OOPy rewrite using routeUtils.RouteHandler
exports.deleteAccount = function(req,res){

	if( ! loginstate.isLoggedIn() ){
		return(errlib.render(res,"Sign in to sign out.","400"));
	}

	models.deleteAccount(req.session.userid,function(err,result){

		if( err !== null ){ 
			return(errlib.render(res,"Internal error (45)","500",err)); // DB error			
		}

		loginstate.disable(req);
		res.render("success.html",{layout:"global.html",pageTitle:"Success"});	
	});
}

// fixme: OOPy rewrite using routeUtils.RouteHandler
exports.emitSiteEditor = function(req,res){	
	
	if( ! loginstate.isLoggedIn() ){
		return(errlib.render(res,"You must be signed in to edit site info.","400",err));
	}
	
	var uid = loginstate.getID(req);
	models.getSiteForUser(uid, function(err,result){

		if( err !== null ){
			return(errlib.render(res,"Internal error (46)","500",err)); // DB error						
		}
		if( result === null ){
			return(errlib.render(res,"Internal error (47)","500",err)); // user has no sites
		}

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
}

exports.saveSiteEdit = function(req,res){

	// boilerplate to bootstrap OOP
	function SiteEditRouter(req,res,view){ routeUtils.RouteHandler.call(this,req,res,view);}
	SiteEditRouter.prototype = new routeUtils.RouteHandler();
	SiteEditRouter.prototype.constructor = SiteEditRouter;
	
	SiteEditRouter.prototype.handleSuccess = function(rows){
		this.res.render(this.view,{"layout":"global.html",pageTitle:'Success'});	
	};
	
	SiteEditRouter.prototype.sql = function(){
		return("update site set sitename = $1, domain = $2, agentaddress = $3, agentemail = $4 where ownerid = $5 returning ownerid");		
	}

	SiteEditRouter.prototype.values = function(){
		uid = loginstate.getID(this.req);
		return([this.req.body.sitename, this.req.body.domain, this.req.body.agentaddress, this.req.body.agentemail, uid]);
	}

	SiteEditRouter.prototype.validate = function(){

		if( !routeUtils.validateString("req.body.sitename",this.req.body.sitename,1) ||
			!routeUtils.validateString("req.body.domain",this.req.body.domain,1) ||
			!routeUtils.validateString("req.body.agentaddress",this.req.body.agentaddress,1) ||
			!routeUtils.validateString("req.body.agentemail",this.req.body.agentemail,1) 
		){
			errlib.render(res,"Bad param","400",req.body);
			return(false);
		}

		if( ! loginstate.isLoggedIn() ){
			errlib.render(res,"You must be signed in to edit site info.","400");
			return(false);
		}

		if( loginstate.getID(req) === null ){
			errlib.render(res,"Corrupt session state.","500");
			return(false);
		}
		
		return(true);
	}

	var handler = new SiteEditRouter(req,res,"success.html");
	handler.start();
	
}


