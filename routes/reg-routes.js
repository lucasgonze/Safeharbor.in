
/*****************************
 * Account Creation
 *****************************/

var models     = require("../models/reg-models.js");
var loginstate = require('../lib/loginstate.js');
var errlib     = require('../lib/error.js');
var utils      = require('../lib/utils.js');
var Performer  = require('../lib/performer.js').Performer;

var errout         = errlib.errout();
var checkForSQLErr = errlib.errout( [ models.CODES.SQL_ERROR ] );

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

    var regid = req.params['regid'];    
    
    var createAcct = models.createAcct( regid, function( code, acctid ) { 
            checkForSQLErr( req, res, code, acctid );
            if( code == models.CODES.INSERT_SINGLE )
            {
                loginstate.enable(req,acctid);
                // setup for chaining this to next step
                this.acctid = acctid;
            }
        });
    var createSite = models.createSite( req.body , function( code, siteid ) {
        checkForSQLErr( req, res, code, siteid );
        if( code == models.CODES.INSERT_SINGLE )
            res.render( "reg/done.html",
                           { layout:"global.html",
                             pageTitle:"Setup Done",
                             bodyClass:"regfinal",
                             siteid:siteid
                             } );    
       });
    
    createAcct.chain( createSite ).perform();
}

function emailHandshake(req, res, host) {	
    return new Performer( 
            { 
                req: req,
                
                res: res,
            
                // N.B. these params are flipped coming from sendgrid
                callback: function(success,message) {
                    if( success ) {
                        res.render("reg/checkyouremail.html",
                              {layout:"global.html",pageTitle:"Check Your Email",bodyClass:"gocheckemail"} );
                    }   
                    else {
                        errout( req, res, err( 400, 'Email handshake failed: ' + message)  );
                        this.stopChain();
                    }
                },
                
                performer: function() {            
                    var to    = req.body.email;
                    var regid = this.prev.regid;
                    var subj  = "New account at Safeharbor.in";
                    var text  = 'Please confirm your Safeharbor.in account by going to http://safeharbor.in/reg/'+regid;
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
        errout( req, res, err( 400, 'password mismatch' ) );
        return;        
    }
    
    var checkAcct = models.checkForAccount( req.body.email, function(code, err) { 
            checkForSQLErr( req, res, code, err );
            if( code == models.CODES.RECORD_FOUND )
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
        
    var initEmail = models.initEmailConfirmation( req.body, function( code, regid ) {
            checkForSQLErr( req, res, code, regid );
            if( code == models.CODES.INSERT_SINGLE )
                this.regid = regid;
        });

    var handshake = emailHandshake(req, res, req.headers.host);
    
    if( initEmail.validargs )
        checkAcct.chain( initEmail.chain(handshake) ).perform();
};

