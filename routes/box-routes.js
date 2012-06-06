
/*****************************
 * Initial submission of a takedown request and other features in support of rights holders.
 *****************************/

"use strict";

var models = require('../models/box-models.js');
var errlib = require('../lib/error.js');
var helpers = require('./router-helpers.js');

var checkStringParams = helpers.checkStringParams;
var genCallback = helpers.genCallback;

exports.install = function( app )
{
	app.get('/box/:siteid([0-9]+)$',  getBox);
	app.post('/box/:siteid([0-9]+)',  postBox);
//	app.post('/box/:siteid([0-9]+)$', postBox);
}

function getBox(req,res){

    function success(result) {
		var vars = {
			layout:       'global.html',
			pageTitle:    'Copyright Inbox',
			bodyClass:    'box',
			sitename:     result.sitename,
			domain:       result.domain,
			agentaddress: result.agentaddress,
			agentemail:   result.agentemail,
			oid:          result.oid
		};
	    res.render('box/top.html',vars);			
    }
    
	// look up metadata for the box number
	models.get( req.params.siteid, genCallback( req, res, { is404: true }, success ) );

};

function postBox(req,res){

    var strs = [ 'page', 1, 'description', 1, 'email', 1, 'phone', 1,
                 'postal', 1 ];
    var values = checkStringParams( req, res, req.body, strs );
    var siteIDval = checkStringParams( req, res, req.params, [ 'siteid', 1 ] );
    
    if( values === false || siteIDval === false  )
        return;

    if( req.body.belief !== "on" || req.body.authorized !== "on") {
		return errlib.render(res,'I fail to see the humor in the situation','400');
	}
		
	// look up metadata for the box number
	models.get(req.params.siteid,function(err,result){

		// Box ID not found. A real user should never be in this position, hence the 
		// reason to consider it an application error.
		if(err !== null){ return(errlib.render(res,"model fail","500")); }
		
		var subject = "IMPORTANT: DMCA takedown request received";
		var templateRelativePath = "../views/box/notificationemail.html";
		var templateVars = req.body;
		templateVars.sitename = result.sitename;
		templateVars.domain = result.domain;
		
		var callback = function(success,message){	
			// Sendgrid's error flag doesn't use the Node.js convention of having non-null mean success			
			if( !success ){
				errlib.render(res,"Unable to send mail","500","Unable to send mail: "+message);
			} else {
				res.render("box/success.html",{layout:"global.html",pageTitle:"Success",bodyClass:"box"});
			}
		};

		var mailer = require("../lib/mail.js");
		mailer.emailFromTemplate( result.agentemail,
		                          subject,
		                          'text goes here', // TODO: um, did 'text' ever work here??
		                          templateRelativePath,
		                          templateVars,
		                          callback);
	});

};
