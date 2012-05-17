
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

var regConfirmEmail = function(to){
	console.log("BP V");
	console.log(process.env.SENDGRID_USERNAME);
	console.log(process.env.SENDGRID_PASSWORD);
	var SendGrid = require('sendgrid').SendGrid;
	var sendgrid = new SendGrid(
	  process.env.SENDGRID_USERNAME,
	  process.env.SENDGRID_PASSWORD
	  );
	sendgrid.send({
		to : "lucas@gonze.com",
		from : "noreply@safeharbor.in",
		subject : "node_mailer test email",
		text: 'Sending email with NodeJS through SendGrid!'
	}, function(err, result){
	  if(err){ console.log(err); }
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

	regConfirmEmail(req.body.email);

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





