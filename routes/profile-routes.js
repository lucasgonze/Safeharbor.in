
/*****************************
 * Login, logout, edit profile, reset password, edit site
 *****************************/

var models = require("../models/profile-models.js");

exports.saveLogin = function(req,res){
	console.log("BP postLogin");
	
	if( typeof req.body.email !== "string" || req.body.email.length < 1 ||
		typeof req.body.password !== "string" || req.body.password.length < 1 ) {		
		res.render("error/error.html",{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:"All params must be set.",code:"400"});
		return;		
	}

	// look into database to see whether the submitted information is correct
	models.checkAcct(req.body.email,req.body.password,function(err,result){
		if(err){
			// reject and show an error
			res.render("error/error.html",{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:"Not implemented yet - send user back to login with error message to check input.",code:"500"});
		} else {
			req.session.userid = result.id;			
			// fixme: can't send session cookie and redirect in same request/response
			res.redirect("/dash");
		}
	})

}
