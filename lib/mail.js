
var fs = require('fs');
var Handlebars = require('handlebars');

// http://docs.sendgrid.com/documentation/get-started/integrate/examples/node-js-email-example-for-smtp/
var SendGrid = require('sendgrid').SendGrid;
var username = process.env.SENDGRID_USERNAME || "app4651289@heroku.com";
var password = process.env.SENDGRID_PASSWORD || "2z6pwu9y";
var sendgrid = new SendGrid(username, password);

/* 

Example call:
require("./lib/mail.js").to({
	viewsSubdir: "inbox",
	template: "notificationemail", 
	templateVars: {
		sitename: "Etsy",
		domain: "etsy.com",
		full_name: "Mr John K. Doe",
		email: "complainer@example.com",
		phone: "900 555 1212",
		postal: "123 Main St, Gaithersburg MD 12345",
		takedownRequests: [
			{ 
				page: "http://etsy.com/offender1",
				media_url: "http://etsy.com/media_url",
				anchor: "#anchor",
				description: "Imagine by John Lennon"
			}
		],
		dashurl: "http://safeharbor.in/dash"
	}, 
	to: "lucas@gonze.com",
    subject: "testing"	
}, function(success, message) {
	  if (!success)
	    console.log(message);
	}
);

vars = {
	viewsSubdir: view directory containing the relevant templates,
	template: handlebars files which has both .html and .txt variants, 
	templateVars: assoc array of name-val pairs for template, 
	to: target email address,
    subject: email subject line
}

*/
exports.to = function(vars,callbackFromTo){ // new hotttness
	
	/* vars.pathToTemplates *must* be set and point to a valid view directory.
	   vars.template *must* be set and point to a file which has both .html and .txt variants */
	var templates = [
		__dirname+"/../views/"+vars.viewsSubdir+"/"+vars.template+".html",
		__dirname+"/../views/"+vars.viewsSubdir+"/"+vars.template+".txt"
	];
	
	var compiler = function(template,callback){
		// fixme: on error alert SH.i admin
		var source = fs.readFileSync(template, 'utf8');
		var template = Handlebars.compile(source);
		var compiled = template(vars.templateVars);
		/* Testing has shown that setting the err flag in this callback function has no effect. */
		callback(false,compiled);
	};
	
	var sender = function(err,result){
		if(err){
			// fixme: on error alert SH.i admin			
			callbackFromTo(err);
			return;
		}
		var sendgridVars = {
			html: result[0],
			text: result[1],
			from: "noreply@safeharbor.in",
			subject: vars.subject,
			to: vars.to
		}
		sendgrid.send(sendgridVars,callbackFromTo);				
	}

	require('async').map(templates,compiler,sender);
}

// old hotttness - use "to" function above instead of this
exports.emailFromTemplate = function(to,subject,text,templateRelativePath,templateVars,callback){
	
	fs.readFile(__dirname+"/"+templateRelativePath, 'utf8',function(err,source){

		if(err){
			console.log("ERROR READING EMAIL TEMPLATE");
			console.log(err);
			callback(false,"ERROR READING EMAIL TEMPLATE");
			return;
		}

		var template = Handlebars.compile(source);
		var html    = template(templateVars);

		var params = {
		    'to': to,
		    'from': "noreply@safeharbor.in",
		    'subject': subject,
			'html': html
		};
		if( text !== null)
			params.text = text;
		sendgrid.send(params,callback);
	});
}