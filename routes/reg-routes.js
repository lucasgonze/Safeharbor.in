
/*****************************
 * Account Creation
 *****************************/

var models = require("../models/reg-models.js");

exports.saveConfig = function(req,res){

	if( typeof req.params.regid !== "string" || req.params.regid.length < 1 ||
		typeof req.body.sitename !== "string" || req.body.sitename.length < 1 ||
		typeof req.body.domain !== "string" || req.body.domain.length < 1 ||
		typeof req.body.agentaddress !== "string" || req.body.agentaddress.length < 1 ||
		typeof req.body.agentemail !== "string" || req.body.agentemail.length < 1 ){						
		res.render("error/error.html",{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:"All params must be set.",code:"400"});
		return;		
	}

	models.createAcct(req.params.regid,function(err,result){
		
		if( typeof result !== "object" || result === null || (typeof err === "object"  && err !== null)){
			console.log("Fatal error returned by models.createAcct");
			console.log(err);
			res.render("error/error.html",{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:"Unable to save",code:"500"});
			return;			
		}

		// save newly created user ID to a session variable
		req.session.userid = result.id;

		// insert the site data into db
		models.createSite(result.id,req.body.sitename,req.body.domain,req.body.agentaddress,req.body.agentemail,
			function(err,result){
				if( typeof result !== "object" || (typeof err === "object"  && err !== null)){
					console.log("Fatal error returned by "+models.createAcct);
					console.log(err);
					res.render("error/error.html",{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:"Unable to save",code:"500"});			
				} else 
					res.render("reg/done.html",{layout:"global.html",pageTitle:"Setup Done","bodyClass":"regfinal",siteid:result.oid});				
			});
	});
	
}

var emailHandshake = function(email,regid,host){	
	var to = email;
	var subject = "Confirm account for Safeharbor.in";
	var text = 'Please confirm your Safeharbor.in account by going to http://safeharbor.in/reg/'+regid;
	var templateRelativePath = "/../views/reg/handshake.html";
	var templateVars = {'regid': regid,'host':host};
	require('../lib/mail.js').emailFromTemplate(to,subject,text,templateRelativePath,templateVars,function(success,message){
		if(!success){
			console.log("ERROR: unable to send handshake email");
			console.log(err);
			console.log(message);
		}
	});
}

exports.saveAcct = function(req, res) {
	
	// validate form input for corruption but not for user-friendliness. User-friendliness is handled in the browser before submitting the form.
	if( req.body.email === undefined ||
		req.body.password === undefined ||
		req.body.confirm === undefined ||
		req.body.confirm !== req.body.password ||
		req.body.email == "" ||
		req.body.password == "" ||
		req.body.confirm == "" ){
			var E = new Error();
			E.statusCode = "400";
			E.message = "Bogus arguments";
			throw(E);
	}
	
	models.checkForAccount(req.body.email,function(err,result){

 		if( typeof result === "object" &&  
			typeof result.rows === "object" &&
 			typeof (result.rows[0]) === "object" &&
			typeof (result.rows[0].count) === "number" &&
			result.rows[0].count > 0 ){
			res.render("profile/login.html",{
				layout:"global.html",pageTitle:"Account exists","bodyClass":"login",
				'alert-from-create': '<div class="alert alert-info">You already have an account</div>'
			});
			return;
		} 
		
		models.initEmailConfirmation(req.body.email,req.body.password,function(err,result){
			if( typeof result === 'object' && typeof result.oid === "number"){
				// all good
				emailHandshake(req.body.email,""+result.oid,req.headers.host);
				return(res.render("reg/checkyouremail.html",{layout:"global.html",pageTitle:"Check Your Email","bodyClass":"gocheckemail"}));
			} else {
				// we have an error
				console.log("Fatal error in initEmailConfirmation.")
				console.log(err);
				return(res.render("error/error.html",{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:"Database 23",code:"500"}));
			}
		});

	}); // end checkForAccount call

	
};

