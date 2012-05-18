
// helpful for debugging
exports.nop = function(req, res) {
    res.write("<!DOCTYPE html PUBLIC \"-//W3C//DTD HTML 4.01//EN\"><html><head><title>NOP</title></head><body>NOP</body></html>");
    res.end();
};

exports.loginPost = function(req, res) {
	// this method is a stub for now. in the future we'll validate the user info and open up a session for their specific account.
	res.redirect("/dash");
//    res.render('firstrun/login.html',{layout:"firstrun/layout.html",loginStatus:"success"});
};

var regEmitEmailConfirmationRequest = function(tgt,opaque_id,callback){
	var fs = require('fs');
	var htmlMail = fs.readFile(__dirname+"/../views/reg/confirmemail.html", 'utf8', function(err, data){

		if(err) {
			callback(true,"Unable to read file");
			return;
		}
		
		// fixme: find a way to insert the opaque_id into the URL in the email
		/* 
		email.addFile({
		  filename: 'icon.jpg',
		  url: 'http://i.imgur.com/2fDh8.jpg'
		});
		*/
		// See https://github.com/sendgrid/sendgrid-nodejs
		
		var SendGrid = require('sendgrid').SendGrid;
		var username = process.env.SENDGRID_USERNAME || "app4651289@heroku.com";
		var password = process.env.SENDGRID_PASSWORD || "2z6pwu9y";
		var sendgrid = new SendGrid(username, password);
		// fixme: optimise text in case mail user agent doesn't support html
		sendgrid.send({
		    to: tgt,
		    from: "noreply@safeharbor.in",
		    subject: "Please confirm account",
		    text: 'Please confirm your copyright account at Safeharbor.in. ',
			}, function(ok) { 
				if( !ok ) callback(true); 
			}
		);
		
	});
}

exports.regStep1Post_try1 = function(req, res) {
	
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

	regEmitEmailConfirmationRequest(req.body.email, function mailFailed(){
		var msg = 'Unable to send confirmation email. Please come back and try again tomorrow.';
		res.render("error/error.html",{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:msg,code:"500"});
		return;	
	});

	// this won't work because the above call will come back before it's known whether it succeeded

	var model = require("../models");
	model.createAcct(req.body.email, req.body.password,function accountCreationCallback(err,result){
		if( undefined !== err && null !== err ){
			var msg = 'Unable to create account. Do you already have one? Maybe you should <a href="/login" class="btn">Log In</a> instead.'
			res.render("error/error.html",{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:msg,code:"500"});
		} else 
			res.render("reg/step2.html",{"layout":"global.html","pageTitle":"Try It","bodyClass":"reg"});
	});	
};

exports.regStep4Post = function(req, res) {
	// this method is a stub for now. in the future we'll validate the form input.
	res.redirect("/reg/step5");
};


var regError = function(res,msg){
	res.render("error/error.html",{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:msg,code:"500"});
}

var emailHandshake = function(email,regid,host){

		var fs = require('fs');
		var Handlebars = require('handlebars');
		fs.readFile(__dirname+"/../views/reg/handshake.html", 'utf8',function(err,source){

			if(err){
				console.log("ERROR READING EMAIL TEMPLATE");
				console.log(err);
				return;
			}

			var template = Handlebars.compile(source);
			var context = {regid: regid,'host':host};
			var html    = template(context);

			var SendGrid = require('sendgrid').SendGrid;
			var username = process.env.SENDGRID_USERNAME || "app4651289@heroku.com";
			var password = process.env.SENDGRID_PASSWORD || "2z6pwu9y";
			var sendgrid = new SendGrid(username, password);

			var params = {
			    to: email,
			    from: "noreply@safeharbor.in",
			    subject: "Confirm email for Safeharbor.in",
			    text: 'Please confirm your Safeharbor.in account by going to http://safeharbor.in/reg/'+regid,
				'html': html
			};
			sendgrid.send(params, function(success, message) {
			  if (!success) {
				console.log("ERROR: unable to send handshake email")
			    console.log(message);
			  }
			});
				
	});
	
}

exports.regStep1Post = function(req, res) {
	
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

	require("../models").initEmailConfirmation(req.body.email,req.body.password,function(err,result){
		if( typeof result === 'object' && typeof result.oid === "number"){
			// all good
			emailHandshake(req.body.email,""+result.oid,req.headers.host);
		} else {
			// we have an error
			console.log("Fatal error in initEmailConfirmation.")
			console.log(err);
			return(res.render("error/error.html",{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:"Database 23",code:"500"}));
		}

	});

	return(res.render("reg/step2.html",{layout:"global.html",pageTitle:"Check Your Email","bodyClass":"gocheckemail"}));
	
	//fixme
	// in handler for clickthrough create record by doing insert into acct as select from emailHandshake
				
};

exports.regCheckEmail = function(req,res){
	
}

