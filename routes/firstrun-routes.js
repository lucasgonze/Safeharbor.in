
// This file is for the corporate home page at / and for other functions for non-logged-in users

var shi = require('../lib/safeharbor.js');

function contact(req,res){res.send("we're good");

	if( typeof req.body !== "object" 
		|| typeof req.body.name !== "string"
		|| typeof req.body.email !== "string"
		|| typeof req.body.message !== "string"
		|| typeof req.body.email.match("@") != "object"
	){
		res.send(400,"Bad parameters");
	}
	
	var params = {};
	params.templateVars = {
		name: req.body.name,
		email: req.body.email,
		message: req.body.message
	};
	
	params.template = "contact";
	params.to = "lucas@gonze.com";
	params.subject = "Contact via SafeHarbor.in contact form";
	params.viewsSubdir = 'firstrun';

	shi.mail.to(params);
		
	res.send(200,"Sent");
}
/*
var params = {};
params.templateVars = {
	name: req.body.name,
	email: req.body.email,
	message: req.body.message
};

params.template = "test-mail";
params.to = "lucas@gonze.com";
params.subject = "Test mail from SH.i";
params.viewsSubdir = 'test';

require('../lib/mail.js').to(params);
nop(req,res);
*/

exports.install = function( app ){		
	app.post('/contact', contact);	
}


