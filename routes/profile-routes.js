
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
    var not_logged_in = app.checkRole(app.ROLES.not_logged_in),
        logged_in = app.checkRole(app.ROLES.logged_in);
    
	app.trivialRoute('/login','login','profile','Log In',not_logged_in);
	app.post('/login', not_logged_in, saveLogin);
	
	app.trivialRoute('/lostpassword','lostpassword','profile','Lost Password',not_logged_in);
	app.post('/lostpassword', not_logged_in, lostPasswordStart);
	
	app.get('/lostpassword/:resetSecret([0-9a-z]{10})$', not_logged_in, lostPasswordGet );
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
                        res.render("profile/success.html",
                            {layout:"shared/main.html", pageTitle:"Password Reset", bodyClass: "profile"});			
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
	var vars = { layout:      "shared/main.html",
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
            res.render("success.html",{layout:"shared/main.html",pageTitle:"Success"});    
    }
    
    profile
      .saveNewPassword( args, cb )
      .handleErrors( req, res )
      .perform();
}

/* Different than lostPasswordPost in that it's used by a logged-in 
   user rather than one who has lost their password. */
function savePasswordReset(req,res) {

	if( req.body.newpassword !== req.body.confirm ) {
    	    errout( req, res, exp( 400, "Mismatch password." ) );
	    }
    else {
        var args = utils.copy( { userid: loginstate.getID(req) }, req.body );
        
        var resetPW = profile.resetPasswordForLoggedInUser( args, function(code,err) {   
                if( code == CODES.SUCCESS )
                {
                    res.render("profile/successNoEmail.html",{layout:"shared/main.html",pageTitle:"Success"});	
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

	profile.deleteAccount(req.session.userid,function(code,err){
		loginstate.disable(req);
		res.render("success.html",{layout:"shared/main.html",pageTitle:"Success"});	
	}).handleErrors(req,res).perform();
}

function emitSiteEditor(req,res){	
	
	var uid = loginstate.getID(req);

    function success(code, site) {
        if( code == CODES.OK )
        {
            res.render("profile/siteeditor.html", utils.copy({
                                                    layout: "shared/main.html",
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
            res.render("./success.html",
                {layout:"shared/main.html", pageTitle:"Edit Site", bodyClass: "profile"});			
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
            var vars = utils.copy({ layout: "shared/main.html",
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

    var uid = loginstate.getID(req);
    
    var args = utils.copy( {acct: uid, autologin: '0'}, req.body )
        renderArgs = { layout:"shared/main.html", pageTitle:"Edit Account", bodyClass: "profile" },
        setSessionUser = function(code,acct) { if( code==CODES.OK ) {
                                                    loginstate.enable(req,acct); 
                                                    res.render('./success.html',renderArgs);
                                                    }
                                                };

    args.autologin = args.autologin.replace(/on/,'1') >>> 0;

    profile
       .updateAccount( args, function(){} )
       .handleErrors(  req, res )
       .chain( profile.acctFromID( uid, setSessionUser )  )
       .perform();
}
