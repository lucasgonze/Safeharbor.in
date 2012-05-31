
exports.emailFromTemplate = function(to,subject,text,templateRelativePath,templateVars,callback){
	
	var fs = require('fs');
	var Handlebars = require('handlebars');
	fs.readFile(__dirname+"/"+templateRelativePath, 'utf8',function(err,source){

		if(err){
			console.log("ERROR READING EMAIL TEMPLATE");
			console.log(err);
			callback(false,"ERROR READING EMAIL TEMPLATE");
			return;
		}

		var template = Handlebars.compile(source);
		var html    = template(templateVars);

		// http://docs.sendgrid.com/documentation/get-started/integrate/examples/node-js-email-example-for-smtp/
		var SendGrid = require('sendgrid').SendGrid;
		var username = process.env.SENDGRID_USERNAME || "app4651289@heroku.com";
		var password = process.env.SENDGRID_PASSWORD || "2z6pwu9y";
		var sendgrid = new SendGrid(username, password);

		var params = {
		    'to': to,
		    'from': "noreply@safeharbor.in",
		    'subject': subject,
		    'text': text,
			'html': html
		};
		sendgrid.send(params,callback);
	});
}