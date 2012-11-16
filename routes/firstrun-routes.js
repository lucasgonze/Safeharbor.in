
// This file is for the corporate home page at / and for other functions for non-logged-in users

var shi = require('../lib/safeharbor.js');

function contact(req,res){
	console.log("BP 2")
	if( typeof req.body !== "object" 
		|| typeof req.body.name !== "string"
		|| typeof req.body.email !== "string"
		|| typeof req.body.message !== "string"
		|| typeof req.body.email.match("@") != "object"
	){
		console.log("BP 1",req.body)
		err.page(400,res,"Bad parameters");
	}

	console.log("BP 2.1")
	var params = {};
	params.templateVars = {
		name: req.body.name,
		email: req.body.email,
		message: req.body.message
	};
	params.pathToTemplates = 'firstrun';
	params.template = "contact";
	params.to = "lucasgonze@safeharbor.in";
	params.subject = "Contact via SafeHarbor.in contact form";
	console.log("BP 3")
	shi.mail.to(params);
	console.log("BP 4")
	
	res.send(200,"Sent");
}

exports.install = function( app ){		
	app.post('/contact', contact);	
}


