
/***********************************************************
 * Login, logout, edit profile, reset password, edit site
 ***********************************************************/

var profile    = require("../models/profile-models.js");
var loginstate = require('../lib/loginstate.js');
var util       = require('util');
var utils      = require('../lib/utils.js');
var debug      = require("../lib/debug.js");
var errlib     = require("../lib/error.js");
var Performer  = require('../lib/performer.js').Performer;

var CODES          = profile.CODES;
var exp            = errlib.err;
var errout         = errlib.errout();

/*--------------------------
    EXPORTED
----------------------------*/

exports.install = function( app )
{
	app.trivialRoute('/login','login','profile','Log In');
	app.post('/login', saveLogin);
	
	app.trivialRoute('/lostpassword','lostpassword','profile','Lost Password');
	app.post('/lostpassword', lostPasswordStart);
	
	app.get('/lostpassword/:resetSecret([0-9a-z]{10})$', lostPasswordGet);
	app.post('/lostpassword/:resetSecret([0-9a-z]{10})$', lostPasswordPost);
	
	app.trivialRoute('/logout','logout','profile','Log Out');
	app.post('/logout', clearLogin);
	
	app.trivialRoute('/passwordreset','passwordreset','profile','Reset Password');
	app.post('/passwordreset', savePasswordReset);
	
	app.trivialRoute('/accountdeleter','delete','profile','Delete Account');
	app.post('/accountdeleter', deleteAccount);

	app.get('/siteeditor', emitSiteEditor);
	app.post('/siteeditor', saveSiteEdit);
	
	app.get('/accteditor', emitAcctEditor);
	app.post('/accteditor', saveAcctEditor);
	
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
                        res.render("profile/success.html",
                            {layout:"global.html", pageTitle:"Password Reset", bodyClass: "profile"});			
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
	var vars = { layout:      "global.html",
	             pageTitle:   "Enter New Password",
	             bodyClass:   "profile", 
	             resetSecret: req.params.resetSecret
	             };
	res.render("profile/newpasswordform.html",vars);			
}

// given that the user has passed a password recovery token in the URL, check it in 
// the db and send them on to the password reset page if it checks out.
function lostPasswordPost(req,res){ 

    var args = { password: req.body.password, 
                 resetsecret: req.params.resetSecret }; 

    function cb(code,err) {
        if( code == CODES.SUCCESS )
            res.render("success.html",{layout:"global.html",pageTitle:"Success"});    
    }
    
    profile
      .saveNewPassword( args, cb )
      .handleErrors( req, res )
      .perform();
}

/* Different than lostPasswordPost in that it's used by a logged-in 
   user rather than one who has lost their password. */
function savePasswordReset(req,res) {

	if( !loginstate.isLoggedIn() ) {
	        errout( req, res, exp( 400, "Only somebody signed in can reset their password." ) );
        }
	else if( req.body.newpassword !== req.body.confirm ) {
    	    errout( req, res, exp( 400, "Mismatch password." ) );
	    }
    else {
        var args = utils.copy( { userid: loginstate.getID(req) }, req.body );
        
        var resetPW = profile.resetPasswordForLoggedInUser( args, function(code,err) {   
                if( code == CODES.SUCCESS )
                {
                    res.render("profile/successNoEmail.html",{layout:"global.html",pageTitle:"Success"});	
                }
                else if( code == CODES.NO_RECORDS_UPDATED )
                {
                    errlib.render(res, 'wups, wrong password on current account', 404 );
                }
            } );
            
        resetPW.handleErrors( req, res ).perform();
    }
}


function deleteAccount(req,res){

	if( ! loginstate.isLoggedIn() ){
    	    errout( req, res, exp( 400, "not signed in!." ) );
    	    return;
	}

	profile.deleteAccount(req.session.userid,function(code,err){
		loginstate.disable(req);
		res.render("success.html",{layout:"global.html",pageTitle:"Success"});	
	}).handleErrors(req,res).perform();
}

function emitSiteEditor(req,res){	
	
	if( ! loginstate.isLoggedIn() ){
	    errout( req, res, exp( 400, "Only somebody signed in can edit site info." ) );
	    return;
	}
	
	var uid = loginstate.getID(req);

    function success(code, site) {
        if( code == CODES.OK )
        {
            res.render("profile/siteeditor.html", utils.copy({
                                                    layout: "global.html",
                                                    pagetitle: "Edit Site",
                                                    bodyClass: "siteeditor" }, site) );
        }
    }
    
	profile
	    .getSiteForUser( uid, success )
	    .handleErrors( req, res )
	    .perform();
}

function saveSiteEdit(req,res) {

    var uid = loginstate.getID(req);
    
    if( !uid ) {
	    errout( req, res, exp( 400, "Only somebody signed in can save site info." ) );
        return(false);
    }

    function callback( code, err ) {
        if( code == CODES.OK )
            res.render("./success.html",
                {layout:"global.html", pageTitle:"Edit Site", bodyClass: "profile"});			
    }            
    var args = utils.copy( {acct: uid}, req.body );

    profile
        .updateSiteForUser( args, callback )
        .handleErrors( req, res )
        .perform();
}


function emitAcctEditor(req,res){	

    var uid = loginstate.getID(req);

	if( ! uid ) { // loginstate.isLoggedIn() ){
	    errout( req, res, exp( 400, "Only somebody signed in can edit acct info." ) );
	    return;
	}
	
    function showEditor( code, acct ) {
	    if( code == CODES.OK )
	    {
            var vars = utils.copy({ layout: "global.html",
                         pagetitle: "Edit Your Account",
                         bodyClass: "siteeditor" }, acct);
        
            res.render("profile/accteditor.html", vars );
        }
    }	
    
	profile
	  .acctFromID( uid, showEditor )
	  .handleErrors( req, res )
	  .perform();
}

function saveAcctEditor(req,res) {

    var uid = loginstate.getID(req);
    
    if( !uid ) {
	    errout( req, res, exp( 400, "Only somebody signed in can save acct info." ) );
        return(false);
    }
    
    var args = utils.copy( {acct: uid, autologin: '0'}, req.body )
        setSessionUser = function(code,acct) { if( code==CODES.OK ) loginstate.enable(req,acct); },
        renderArgs = { layout:"global.html", pageTitle:"Edit Account", bodyClass: "profile" },
        displaySuccess = function(code) { if( code==CODES.OK ) res.render('./success.html',renderArgs); };

    args.autologin = args.autologin.replace(/on/,'1') >>> 0;

    profile
       .updateAccount( args, displaySuccess )
       .handleErrors(  req, res )
       .chain( profile.acctFromID( uid, setSessionUser )  )
       .perform();
}
