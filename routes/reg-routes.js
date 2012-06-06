
/*****************************
 * Account Creation
 *****************************/

var models     = require("../models/reg-models.js");
var loginstate = require('../lib/loginstate.js');
var helpers    = require('./router-helpers.js');

var checkStringParams = helpers.checkStringParams;
var genCallback = helpers.genCallback;

exports.install = function( app )
{
	app.trivialRoute('/reg','acct','reg','Try It'); 
	app.post('/reg', startEmailHandshake );	
	app.get('^/reg/:regid([0-9]+)$', getVerifyAcct );
	app.post('^/reg/:regid([0-9]+)$', saveConfig);
}

function getVerifyAcct( req, res ) {
    // TODO: we should be checking the regid right here
    res.render('reg/fromemail.html',
        { layout: 'global.html', pageTitle:'Verify', bodyClass:'regid', regid: req.params.regid });
}

function saveConfig(req,res){

    var p1 = [ 'sitename', 1, 'domain', 1, 'agentaddress', 1, 'agentemail', 1, ];
    var p2 = [ 'regid', 1 ];
    
    var values     = checkStringParams( req, res, req.body, p1 );
    var regidCheck = checkStringParams( req, res, req.params, p2 );

    // console.log( [ 'req.body', req.body, 'values', values, 'regidCheck', regidCheck ] );
    
    if( values === false || regidCheck === false )
        return;

    var extraParams = { pageTitle:"Error (1)", bodyClass:"error",message:"Unable to save" };

    function innerSuccess( result ) {
        res.render( "reg/done.html",
                   { layout:"global.html",
                     pageTitle:"Setup Done",
                     bodyClass:"regfinal",
                     siteid: result.oid
                     } );
    }

    function success( result ) {

        // save newly created user ID to a session variable
        loginstate.enable(req,result.id);
    
        extraParams.pageTitle = "Error (2)";
         
        // insert the site data into db
        models.createSite( result.id, values.sitename, values.domain, 
               values.agentaddress,values.agentemail, genCallback( req, res, extraParams, innerSuccess ) );
    }
    
    
	models.createAcct(regidCheck.regid, genCallback( req, res, extraParams, success ) );
}

function emailHandshake(email,regid,host) {	
	var to = email;
	var subject = "New account at Safeharbor.in";
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

function startEmailHandshake(req, res) {
	
	// validate form input for corruption but not for user-friendliness. User-friendliness is handled in the browser before submitting the form.

    var values = checkStringParams( req, res, req.body, ['email',1,'password',1,'confirm',1] );
	
	if( values === false )
	    return;

    if( values.confirm != values.password )	    
	    return(errlib.render(res,"Passwords don't match","400",err));

    function innerSuccess(result) {
        emailHandshake(req.body.email,""+result.oid,req.headers.host);
        return(res.render("reg/checkyouremail.html",{layout:"global.html",pageTitle:"Check Your Email",bodyClass:"gocheckemail"}));
    }
    var extraParams = { t: "error/error.html", p: {layout:"global.html",pageTitle:"Error",bodyClass:"error",message:"Database 23",code:"500"}};
        
	    
	models.checkForAccount(req.body.email, function(err,result) {
        
 		if( result.rows[0].count > 0 ){
			res.render("profile/login.html",{
				layout:"global.html",pageTitle:"Account exists",bodyClass: "login",
				'alert-from-create': '<div class="alert alert-info">You already have an account</div>'
			});
		} 
		else {
            models.initEmailConfirmation(req.body.email,req.body.password, 
                                    genCallback( req, res, extraParams, innerSuccess ) );
        }

	}); // end checkForAccount call

};

