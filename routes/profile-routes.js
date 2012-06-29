
/***********************************************************
 * Login, logout, edit profile, reset password, edit site
 ***********************************************************/

var safeharbor = require('../lib/safeharbor.js');
var debug      = safeharbor.debug;
var utils      = safeharbor.utils;
var errlib     = safeharbor.errors;
var page       = safeharbor.page;
var loginstate = safeharbor.loginstate;
var Performer  = safeharbor.Performer;

var util    = require('util');
var errout  = errlib.errout();
var profile = require("../models/profile-models.js");

var CODES          = profile.CODES;
var exp            = errlib.err;
var errout         = errlib.errout();

/*--------------------------
    EXPORTED
----------------------------*/

exports.install = function( app )
{
    var not_logged_in = app.checkRole(app.ROLES.not_logged_in),
        logged_in = app.checkRole(app.ROLES.logged_in);
    
	app.trivialRoute('/login','login','profile','Log In',not_logged_in);
	app.post('/login', not_logged_in, saveLogin);
	
	app.trivialRoute('/lostpassword','lostpassword','profile','Lost Password',not_logged_in);
	app.post('/lostpassword',                             not_logged_in, lostPasswordStart);	
	app.get ('/lostpassword/:resetSecret([0-9a-z]{10})$', not_logged_in, lostPasswordGet );
	app.post('/lostpassword/:resetSecret([0-9a-z]{10})$', not_logged_in, lostPasswordPost);
	
	app.trivialRoute('/logout','logout','profile','Log Out',logged_in);
	app.post('/logout', logged_in, clearLogin);
	
	app.trivialRoute('/passwordreset','passwordreset','profile','Reset Password',logged_in);
	app.post('/passwordreset', logged_in, savePasswordReset);
	
	app.trivialRoute('/accountdeleter','delete','profile','Delete Account',logged_in);
	app.post('/accountdeleter', logged_in, deleteAccount);

	app.get('/siteeditor', emitSiteEditor,logged_in);
	app.post('/siteeditor', logged_in, saveSiteEdit);
	
	app.get('/accteditor', emitAcctEditor,logged_in);
	app.post('/accteditor', logged_in, saveAcctEditor);
	
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
	
    var model = profile.acctFromEmailPassword( req.body, function(code,acct) { 
        if( code == CODES.SUCCESS )
        {
            loginstate.enable(req,acct);
            res.redirect("/dash");
        }
        else if( code == CODES.NO_RECORDS_FOUND )
        {
            errlib.render( res, 'Wups, not a valid user and password combination', "401 Unauthorized" );
        }
    });

    model.handleErrors( req, res ).perform();
}

function resetPasswordEmail(req, res, to) {	
    return new Performer( 
            { 
                // N.B. these params are flipped coming from sendgrid
                callback: function(success,message) {
                    if( success ) {
                        res.outputMessage( 
                            page.MESSAGE_LEVELS.success,
                            "Password reset in progress!",
                            "Check your email for a link to reset your password.",
                            { quicktip: "If you do not get a message in your inbox, either there is no account for this email or your spam filter is deleting our mail." }
                        );
                    
                        res.render( page.MESSAGE_VIEW,
                                    { pageTitle:"Password Reset", 
                                      bodyClass: "profile"});			
                    }   
                    else {
                        errout( req, res, exp( 400, 'Email reset failed: ' + message)  );
                        this.stopChain();
                    }
                },
                
                performer: function() {            
                    var backlink = "http://"+req.headers.host+"/lostpassword/"+this.prev.resetSecret,
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
function lostPasswordStart(req,res){
    var email = req.body.email;
    var rpe = resetPasswordEmail( req, res, email );
	var init = profile.initPasswordReset( email, function( c, resetSecret ) { 
	        if( c == CODES.OK )
	            this.resetSecret = resetSecret;
	    } );

	init
	  .handleErrors(req,res)
	  .chain( rpe )
	  .perform();
}

// given that the user has passed a password recovery token in the URL, send
// them to the password reset form.
function lostPasswordGet(req,res){
	var vars = { pageTitle:   "Enter New Password",
	             bodyClass:   "profile", 
	             resetSecret: req.params.resetSecret
	             };
	res.render("profile/newpasswordform.html",vars);			
}

// given that the user has passed a password recovery token in the URL, check it in 
// the db and send them on to the password reset page if it checks out.
function lostPasswordPost(req,res){ 

    var args = { password:    req.body.password, 
                 resetsecret: req.params.resetSecret }; 

    function cb(code,err) {
        if( code == CODES.SUCCESS )
        {
            var title = "Password Recovered";
            res.outputMessage( 
                page.MESSAGE_LEVELS.success,
                title,
                "Once you were lost, but now it's found"
            );
        
            res.render( page.MESSAGE_VIEW, {pageTitle:title} );
        }
    }
    
    profile
      .saveNewPassword( args, cb)
      .handleErrors( req, res, [CODES.NO_RECORDS_FOUND]  )
      .perform();
}

/* Different than lostPasswordPost in that it's used by a logged-in 
   user rather than one who has lost their password. */
function savePasswordReset(req,res) {

    var args = utils.copy( { acct: loginstate.getID(req) }, req.body );
    
    var resetPW = profile.resetPasswordForLoggedInUser( args, function(code,err) {   
            if( code == CODES.SUCCESS )
            {
                var title = "Password Reset";
                res.outputMessage( 
                    page.MESSAGE_LEVELS.success,
                    title,
                    "Password successfully reset."
                );
            
                res.render( page.MESSAGE_VIEW, {pageTitle:title} );
            }
            else if( code == CODES.NO_RECORDS_UPDATED )
            {
                errlib.render(res, 'wups, wrong password on current account', 404 );
            }
        } );
        
    resetPW.handleErrors( req, res ).perform();
}

function deleteAccount(req,res)
{
	profile.deleteAccount(req.session.userid,function(code,err){
	    if( code == CODES.SUCCESS )
	    {
            loginstate.disable(req);
            var title = "Account Deleted";
            res.outputMessage( 
                page.MESSAGE_LEVELS.success,
                title,
                "Your account is gone. Thanks for hanging out with us."
            );    
            res.render( page.MESSAGE_VIEW, {pageTitle:title} );
        }
        else
        {
            // TODO: account missing
        }
        
	}).handleErrors(req,res).perform();
}

function emitSiteEditor(req,res){	
	
	var uid = loginstate.getID(req);

    function success(code, site) {
        if( code == CODES.OK )
        {
            res.render("profile/siteeditor.html", utils.copy({
                                                    pagetitle: "Edit Site",
                                                    bodyClass: "siteeditor" }, site) );
        }
    }
    
	profile
	    .getSiteForUser( uid, success )
	    .handleErrors( req, res, [CODES.NO_RECORDS_FOUND] )
	    .perform();
}

function saveSiteEdit(req,res) {

    var uid = loginstate.getID(req);
    
    function callback( code, err ) {
        if( code == CODES.OK )
        {
            var title = "Site Properties";
            res.outputMessage( 
                page.MESSAGE_LEVELS.success,
                title,
                "Changes to site saved."
            );    
            res.render( page.MESSAGE_VIEW, {pageTitle:title} );
        }
    }            
    var args = utils.copy( {acct: uid}, req.body );

    profile
        .updateSiteForUser( args, callback )
        .handleErrors( req, res )
        .perform();
}


function emitAcctEditor(req,res){	

    var uid = loginstate.getID(req);

    function showEditor( code, acct ) {
        debug.out('Show editor: ', code, acct );
	    if( code == CODES.OK )
	    {
            var vars = utils.copy({ 
                         pagetitle: "Edit Your Account",
                         bodyClass: "siteeditor" }, acct);
        
            res.render("profile/accteditor.html", vars );
        }
            
    }	
    
	profile
	  .acctFromID( uid, showEditor )
	  .handleErrors( req, res, [CODES.NO_RECORDS_FOUND] )
	  .perform();
}

function saveAcctEditor(req,res) {

    function setSessionUser(code,acct) 
    { 
        if( code=!CODES.OK )
            return;
            
        loginstate.enable(req,acct); 

        var title = "Account changes saved.";
        res.outputMessage( 
                page.MESSAGE_LEVELS.success,
                title,
                "Changes to your account have been saved."
            );    
        res.render( page.MESSAGE_VIEW, {pageTitle:title} );
    };
    
    var uid = loginstate.getID(req);
    var args = utils.copy( {acct: uid, autologin: '0'}, req.body )

    args.autologin = args.autologin.replace(/on/,'1') >>> 0;

    profile
       .updateAccount( args, function(){} )
       .handleErrors(  req, res )
       .chain( profile.acctFromID( uid, setSessionUser )  )
       .perform();
}
