
/*****************************
 * Login, logout, edit profile, reset password, edit site
 *****************************/

var models     = require("../models/profile-models.js");
var loginstate = require('../lib/loginstate.js');
var utils      = require('../lib/utils.js');
var errlib     = require("../lib/error.js");

var err            = errlib.err;
var errout         = errlib.errout();
var checkForSQLErr = errlib.errout( [ models.CODES.SQL_ERROR, models.INVALID_ARGS ] );

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
	
    var model = models.checkAcct( req.body, function(code,row) { 
        checkForSQLErr( req, res, code, row );
        if( code == models.CODES.SUCCESS )
        {
            loginstate.enable(req,row.acctid);
            res.redirect("/dash");
        }
    });

    model.perform();
}

function resetPasswordEmail(req, res, to) {	
    return new Performer( 
            { 
                req: req,
                
                res: res,
            
                // N.B. these params are flipped coming from sendgrid
                callback: function(success,message) {
                    if( success ) {
                        res.render("profile/success.html",
                            {layout:"global.html", pageTitle:"Password Reset", bodyClass: "profile"});			
                    }   
                    else {
                        errout( req, res, err( 400, 'Email reset failed: ' + message)  );
                        this.stopChain();
                    }
                },
                
                performer: function() {            
                    var backlink = "http://"+req.headers.host+"/lostpassword/"+result,
                        subject = "Password reset for Safeharbor.in",
                        plainOldAscii = "To reset your password go to "+backlink,
                        htmlTemplate = "/../views/profile/theemail.html",
                        htmlVars = {'backlink':backlink},
                        sendgrid = require('../lib/mail.js');
                        sendgrid.emailFromTemplate(to,subject,plainOldAscii,
                                                  htmlTemplate,htmlVars,this.bound_callback());
                 }                
            });            
}

// save a secret to the DB and email it to the email. note that we always show the "email sent" page, 
// but we only actually send the email if it was found in the db!
function recoverPassword(req,res){
    var email = req.body.email;
    var rpe = resetPasswordEmail( req, res, email );
	var init = models.initPasswordReset( email, function( c, err ) { checkForSQLErr(req,res,c,err); } );
	init.chain( rpe ).perform();
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

    var args = utils.copy( {resetSecret: req.params.resetSecret},req.body );

    function cb(code,err) {
        checkForSQLErr( req, res, code, err );
        if( code == models.CODES.SUCCESS )
            res.render("success.html",{layout:"global.html",pageTitle:"Success"});    
    }
    
    models.saveNewPassword( args, cb ).perform();
}

/* Different than postNewPassword in that it's used by a logged-in 
   user rather than one who has lost their password. */
function savePasswordReset(req,res) {

	if( !loginstate.isLoggedIn() ) {
	        errout( req, res, err( 400, "Only somebody signed in can reset their password." ) );
        }
	else if( req.body.newpassword !== req.body.confirm ) {
    	    errout( req, res, err( 400, "Mismatch password." ) );
	    }
    else {
        var args = utils.copy( { userid: loginstate.getID() }, req.body );
        
        models.resetPasswordForLoggedInUser( args, function(code,err) {
                checkForSQLErr( req, res, code, err );
                if( code == models.CODES.SUCCESS )
                    res.render("profile/success.html",{layout:"global.html",pageTitle:"Success"});	
            } ).perform();
    }
}


function deleteAccount(req,res){

	if( ! loginstate.isLoggedIn() ){
    	    errout( req, res, err( 400, "not signed in!." ) );
    	    return;
	}

	models.deleteAccount(req.session.userid,function(code,err){
	    checkForSQLErr(req,res,code,err);
		loginstate.disable(req);
		res.render("success.html",{layout:"global.html",pageTitle:"Success"});	
	}).perform();
}

function emitSiteEditor(req,res){	
	
	if( ! loginstate.isLoggedIn() ){
	    errout( req, res, err( 400, "Only somebody signed in can edit site info." ) );
	    return;
	}
	
	var uid = loginstate.getID(req);

    function success(code, site) {
        console.log( code, site );
	    checkForSQLErr(req,res,code,site);
        if( code == models.CODES.OK )
        {
            res.render("profile/siteeditor.html", utils.copy({
                                                    layout: "global.html",
                                                    pagetitle: "Edit Site",
                                                    bodyClass: "siteeditor" }, site) );
        }
    }
    
	models.getSiteForUser( uid, success ).perform();
}

function saveSiteEdit(req,res) {

    var uid = loginstate.getID(req);
    
    if( !uid ) {
	    errout( req, res, err( 400, "Only somebody signed in can save site info." ) );
        return(false);
    }

    function callback( code, err ) {
	    checkForSQLErr(req,res,code,err);    
        if( code == models.CODES.OK )
            res.render("./success.html",
                {layout:"global.html", pageTitle:"Edit Site", bodyClass: "profile"});			
    }            
    var args = utils.copy( {ownerid: uid}, req.body );

    var model = models.updateSiteForUser( args, callback );    
    model.error_output( req, res );
    model.perform();
}

