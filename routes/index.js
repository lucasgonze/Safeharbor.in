
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
		
		var SendGrid = require('sendgrid').SendGrid;
		var username = process.env.SENDGRID_USERNAME || "app4651289@heroku.com";
		var password = process.env.SENDGRID_PASSWORD || "2z6pwu9y";
		var sendgrid = new SendGrid(username, password);
		sendgrid.send({
		    to: tgt,
		    from: "noreply@safeharbor.in",
		    subject: "Please confirm account",
		    text: 'Please confirm your copyright account at Safeharbor.in. ',
			html: data
			}, function(ok) { 
				if( !ok ) callback(true); 
			}
		);
		
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

	regEmitEmailConfirmationRequest(req.body.email, function mailFailed(){
		var msg = 'Unable to send confirmation email. Please come back and try again tomorrow.';
		res.render("error/error.html",{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:msg,code:"500"});
		return;	
	});

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





