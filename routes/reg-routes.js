
/*****************************
 * Account Creation
 *****************************/

var reg        = require("../models/reg-models.js");
var profile    = require("../models/profile-models.js");
var loginstate = require('../lib/loginstate.js');
var errlib     = require('../lib/error.js');
var utils      = require('../lib/utils.js');
var Performer  = require('../lib/performer.js').Performer;
var debug      = require('../lib/debug.js');

var CODES          = reg.CODES;
var exp            = errlib.err;
var errout         = errlib.errout();

exports.install = function( app )
{
	app.trivialRoute('/reg','acct','reg','Try It'); 
	app.post('/reg', startEmailHandshake );	
	app.get('^/reg/:regid([0-9]+)$', registerGet );
	app.post('^/reg/:regid([0-9]+)$', registerPost);
}

function registerGet( req, res ) {
    var regid = req.params.regid;
    var checker = reg.checkForHandshake( regid, function(code,err) {
        if( code == CODES.SUCCESS )
        {
            res.render('reg/fromemail.html',
                { layout: 'global.html', pageTitle:'Verify', bodyClass:'regid', regid: regid });
        }
        else 
        {
            errout( req, res, exp( 400, 'Invalid handshake token' ) );
        }
    });
    
    checker.handleError(req,res).perform();
}

function registerPost(req,res){

    var regid = req.params.regid;
    
    var createAcct = reg.createAcct( regid, function( code, acctid ) { 
            if( code == CODES.INSERT_SINGLE )
            {
                loginstate.enable(req,acctid);
                // setup for chaining this to next step
                this.acctid = acctid;
            }
        });
    var createSite = reg.createSite( req.body , function( code, siteid ) {
            if( code == CODES.INSERT_SINGLE )
                res.render( "reg/done.html",
                               { layout:"global.html",
                                 pageTitle:"Setup Done",
                                 bodyClass:"regfinal",
                                 siteid:siteid
                                 } );    
       });
    
    createAcct
      .handleError(req,res)
      .chain( createSite )
      .perform();
}

function emailHandshake(req, res, host) {	
    return new Performer( 
            { 
                // N.B. these params are flipped coming from sendgrid
                callback: function(success,message) {
                    if( success ) {
                        res.render("reg/checkyouremail.html",
                              {layout:"global.html",
                               pageTitle:"Check Your Email",
                               bodyClass:"gocheckemail"} );
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
                res.render("profile/login.html",
                    {
                        layout:"global.html",
                        pageTitle:"Account exists",
                        bodyClass: "login",
                        'alert-from-create': '<div class="alert alert-info">You already have an account</div>'
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
        .handleError( req, res )
        .chain( initEmail )
        .chain( handshake )
        .perform();
};

