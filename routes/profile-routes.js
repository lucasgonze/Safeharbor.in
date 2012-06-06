
/*****************************
 * Login, logout, edit profile, reset password, edit site
 *****************************/

var models = require("../models/profile-models.js");
var loginstate = require('../lib/loginstate.js');
var errlib = require("../lib/error.js");
var helpers = require('./router-helpers.js');

var checkStringParams = helpers.checkStringParams;
var genCallback = helpers.genCallback;

/*--------------------------
    EXPORTED
----------------------------*/

exports.install = function( app )
{
	app.trivialRoute('/login','login','profile','Log In');
	app.post('/login', saveLogin);
	
	app.trivialRoute('/lostpassword','lostpassword','profile','Lost Password');
	app.post('/lostpassword', recoverPassword);
	
	app.get('/lostpassword/:resetSecret([0-9a-z]{10})$', verifySecret);
	app.post('/lostpassword/:resetSecret([0-9a-z]{10})$', postNewPassword);
	
	app.trivialRoute('/logout','logout','profile','Log Out');
	app.post('/logout', clearLogin);
	
	app.trivialRoute('/passwordreset','passwordreset','profile','Reset Password');
	app.post('/passwordreset', savePasswordReset);
	
	app.trivialRoute('/accountdeleter','delete','profile','Delete Account');
	app.post('/accountdeleter', deleteAccount);

	app.get('/siteeditor', emitSiteEditor);
	app.post('/siteeditor', saveSiteEdit);
}


/*--------------------------
    URL Handlers
----------------------------*/

// log out
function clearLogin(req,res) {
	loginstate.disable(req);
	res.redirect("/login");
}


function saveLogin(req,res) {
	
	var values = checkStringParams( req, res, req.body, ['email',1,'password',1] );
	
	if( values === false )
	    return;

    var extraParams = { t: 'profile/login.html', p: { pageTitle :"Log In", loginStatus:"fail" } };

    function success(result)
    {
        loginstate.enable(req,result.id);
        res.redirect("/dash");
    }
    
	// look into database to see whether the submitted information is correct
	models.checkAcct( values.email, values.password, genCallback( req, res, extraParams, success ) );
}

// save a secret to the DB and email it to the email. note that we always show the "email sent" page, 
// but we only actually send the email if it was found in the db!
function recoverPassword(req,res){

	var values = checkStringParams( req, res, req.body, ['email',1] );

	if( values === false )
        return;

    // success.html?? really?
    var extraParams = { t: 'profile/success.html', p: {pageTitle:"Password Reset"} };

    function success( result ) {
        // email a secret to the user with a link to the reset page	
        var backlink = "http://"+req.headers.host+"/lostpassword/"+result,
            subject = "Password reset for Safeharbor.in",
            plainOldAscii = "To reset your password go to "+backlink,
            htmlTemplate = "/../views/profile/theemail.html",
            htmlVars = {'backlink':backlink},
            sendgrid = require('../lib/mail.js');
            
        sendgrid.emailFromTemplate(values.email,subject,plainOldAscii,
                                      htmlTemplate,htmlVars,
            function( success, result ) {
                if( !success ){
                    console.log("Unable to send email:")
                    console.log(result);
                    throw new Error("Unable to send email");
                }
            });	

        res.render("profile/success.html",
            {layout:"global.html", pageTitle:"Password Reset", bodyClass: "profile"});			
    }
    
	models.initPasswordReset(values.email, genCallback( req, res, extraParams, success ) );
}

// given that the user has passed a password recovery token in the URL, send
// them to the password reset form.
function verifySecret(req,res){
	var vars = { layout:      "global.html",
	             pageTitle:   "Enter New Password",
	             bodyClass:   "profile", 
	             resetSecret: req.params.resetSecret
	             };
	res.render("profile/newpasswordform.html",vars);			
}

// given that the user has passed a password recovery token in the URL, check it in 
// the db and send them on to the password reset page if it checks out.
function postNewPassword(req,res){ 

    var resetId = checkStringParams( req, res, req.params, ['resetSecret',10] );
	var values = checkStringParams( req, res, req.body, ['password',4,'confirm',4] );
    
	if( values === false || resetId === false )
        return;

    function success() {
         res.render("success.html",{layout:"global.html",pageTitle:"Success"});    
    }
    
    models.saveNewPassword( resetId.resetSecret, values.password, 
                               genCallback( req, res, { is404: true }, success ) );

}

/* Different than postNewPassword in that it's used by a logged-in user rather than one who has lost their password. */
function savePasswordReset(req,res){

	var values = checkStringParams( req, res, req.body, ['current',4,'newpassword',4,'confirm',1] );

	if( values === false )
        return;
        
    if( req.body.newpassword !== req.body.confirm ) 
	    return(errlib.render(res,"Mismatched passwords","400","Bad params"));

	if( !loginstate.isLoggedIn() )
		 return(errlib.render(res,"Only somebody signed in can reset their password.","400"));

    var extraParams = { t: 'profile/passwordreset.html', p: { pageTitle:"Reset Password",bodyClass:'showerror'} };

    function success() {
        res.render("profile/success.html",{layout:"global.html",pageTitle:"Success"});	
    }
    
	models.resetPasswordForLoggedInUser( loginstate.getID(req), values.current, values.newpassword, 
	                                       genCallback( req, res, extraParams, success ) );
}


function deleteAccount(req,res){

	if( ! loginstate.isLoggedIn() ){
		return(errlib.render(res,"Sign in to sign out.","400"));
	}

	models.deleteAccount(req.session.userid,function(err,result){

		if( err !== null ){ 
			return(errlib.render(res,"Internal error (45)","500",err)); // DB error			
		}

		loginstate.disable(req);
		res.render("success.html",{layout:"global.html",pageTitle:"Success"});	
	});
}

function emitSiteEditor(req,res){	
	
	if( ! loginstate.isLoggedIn() ){
		return(errlib.render(res,"You must be signed in to edit site info.","400",err));
	}
	
	var uid = loginstate.getID(req);

    function success(result) {
        var vars = {
                layout: "global.html",
                pagetitle: "Edit Site",
                bodyClass: "siteeditor",
                sitename: result.sitename,
                sitedomain: result.domain,
                agentaddress: result.agentaddress,
                agentemail: result.agentemail
            };			
        res.render("profile/siteeditor.html",vars);
    }
    
	models.getSiteForUser(uid, genCallback( req, res, { is404: true }, success ) );
}

function saveSiteEdit(req,res) {

	var values = checkStringParams( req, res, req.body, 
	                            ['sitename',1,'domain',4,'agentaddress',1,'agentemail',1] );

	if( values === false )
        return;

    if( ! loginstate.isLoggedIn() ){
        errlib.render(res,"You must be signed in to edit site info.","400");
        return(false);
    }

    if( loginstate.getID(req) === null ){
        errlib.render(res,"Corrupt session state.","500");
        return(false);
    }

    uid = loginstate.getID(this.req);
    
    models.updateSiteForUser(uid,values.sitename,values.domain,values.agentaddress,values.agentemail,
        genCallback(req,res,{t:'success.html'}));
	
}
