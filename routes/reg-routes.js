
/*****************************
 * Account Creation
 *****************************/

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
var reg     = require("../models/reg-models.js");
var CODES   = reg.CODES;
var exp     = errlib.err;

exports.install = function( app )
{
    var not_logged_in = app.checkRole(app.ROLES.not_logged_in);
    
	app.trivialRoute('/reg','acct','reg','Try It',not_logged_in); 
	app.post('/reg', not_logged_in, startEmailHandshake );	
	app.get('^/reg/:regid([0-9]+)$', not_logged_in, registerGet );
	app.post('^/reg/:regid([0-9]+)$', not_logged_in, registerPost);
}

function registerGet( req, res ) {
    var regid = req.params.regid;
    var checker = reg.checkForHandshake( regid, function(code,err) {
        if( code == CODES.SUCCESS )
        {
            res.render('reg/fromemail.html',
                { pageTitle:'Verify', bodyClass:'regid', regid: regid });
        }
        else 
        {
            errout( req, res, exp( 400, 'Invalid handshake token' ) );
        }
    });
    
    checker.handleErrors(req,res).perform();
}

function registerPost(req,res){

    var regid = req.params.regid;
    
    var createAcct = reg.createAcct( regid, function( code, acctid ) { 
            if( code == CODES.INSERT_SINGLE )
            {
                // setup for chaining this to next step
                this.acctid = acctid;
            }
        });
    var createSite = reg.createSite( req.body , function( code, siteid ) {
            if( code == CODES.INSERT_SINGLE )
            {            
                res.render( "reg/done.html",
                               { pageTitle:"Setup Done",
                                 bodyClass:"regfinal",
                                 siteid:siteid
                                 } );    
            }
       });
    var logEmIn = profile.acctFromID( null, function( code, acct ) {
            if( code == CODES.SUCCESS )
            {
                loginstate.enable(req,acct);
            }
        });
    
    createAcct
      .handleErrors(req,res)
      .chain( logEmIn )
      .chain( createSite )
      .perform();
}

function emailHandshake(req, res, host) {	
    return new Performer( 
            { 
                // N.B. these params are flipped coming from sendgrid
                callback: function(success,message) {
                    if( success ) {
                        res.outputMessage(
                                page.MESSAGE_LEVELS.success,
                                "Registration",
                                "Go to your email and open the message from Safeharbor.in.",
                                { class: 'bigass', status: 'envelope' }
                            );
                                
                        res.render( { pageTitle:"Check Your Email",
                                      bodyClass:"gocheckemail" } );
                    }   
                    else {
                        errout( req, res, exp( 400, 'Email handshake failed: ' + message)  );
                        this.stopChain();
                    }
                },
                
                performer: function() {            
                    var to    = req.body.email;
                    var regid = this.findValue('regid');
                    var subj  = "New account at Safeharbor.in";
                    var text  = 'Please confirm your Safeharbor.in account by going to http://'+req.headers.host+'/reg/'+regid;
                    var path  = "/../views/reg/handshake.html";
                    var vars  = {'regid': regid,'host':host};
                    require('../lib/mail.js').emailFromTemplate(to,subj,text,path,vars,this.bound_callback());
                }                
            });            
}

function startEmailHandshake(req, res) {

	// validate form input for corruption but not for user-friendliness. 
	// User-friendliness is handled in the browser before submitting the form.
    if( req.body.confirm != req.body.password )	    
    {
        errout( req, res, exp( 400, 'password mismatch' ) );
        return;        
    }
    
    var checkAcct = profile.acctIdFromEmail( req.body.email, function(code, err) { 
            if( code == CODES.RECORD_FOUND )
            {
                res.outputMessage( page.MESSAGE_LEVELS.warning,
                                    "Account Exists",
                                    "You already have an account" );
                                    
                res.render("profile/login.html",
                    {
                        layout:"shared/main.html",
                        pageTitle:"Account exists",
                        bodyClass: "login",
                    });
                this.stopChain();
            }
        });
        
    var initEmail = reg.initEmailConfirmation( req.body, function( code, regid ) {
            if( code == CODES.INSERT_SINGLE )
                this.regid = regid;
        });

    var handshake = emailHandshake(req, res, req.headers.host);
    
    checkAcct
        .handleErrors( req, res )
        .chain( initEmail )
        .chain( handshake )
        .perform();
};

