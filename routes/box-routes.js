
/*****************************
 * Initial submission of a takedown request and other features in support of rights holders.
 *****************************/

"use strict";

var models = require('../models/box-models.js');
var helpers = require('./router-helpers.js');

var utils      = require('../lib/utils.js');
var errlib     = require('../lib/error.js');
var Performer  = require('../lib/performer.js').Performer;

var errout           = errlib.errout();
var checkForFoundErr = errlib.errout( [models.CODES.NO_RECORDS_FOUND, models.CODES.SQL_ERROR] );

exports.install = function( app )
{
	app.get('/box/:siteid([0-9]+)$',  getBox);
	app.post('/box/:siteid([0-9]+)',  postBox);
//	app.post('/box/:siteid([0-9]+)$', postBox);
}

function getBox(req,res){
	// look up metadata for the box number
	var p = models.get( parseInt(req.params.siteid), function (code, site) {
        checkForFoundErr( req, res, code, site );
        if( code == models.CODES.SUCCESS ) 
        {
            res.render( 'box/top.html', utils.copy( {
                        layout:       'global.html',
                        pageTitle:    'Copyright Inbox',
                        bodyClass:    'box' }, site ));			
        }
    } );

    p.perform();
};

function notifyEmailer(req, res) {	
    return new Performer( 
            { 
                req: req,
                
                res: res,
            
                // N.B. these params are flipped coming from sendgrid
                callback: function(success,message) {
                    // Sendgrid's error flag doesn't use the Node.js convention of having non-null mean success			
                    if( success ) {
                        res.render("box/success.html",{layout:"global.html",pageTitle:"Success",bodyClass:"box"});
                    }   
                    else {
                        errout( req, res, err( 400, 'Email notify failed: ' + message)  );
                        this.stopChain();
                    }                    
                },
                
                performer: function() {            
                    var site = this.prev.site;
                    var subject = "IMPORTANT: DMCA takedown request received";
                    var path = "../views/box/notificationemail.html";
                    var vars = utils.copy( {}, req.body, site );
                    var mailer = require("../lib/mail.js");
                    mailer.emailFromTemplate( acct.agentemail,
                                          subject,
                                          'text goes here', // TODO: um, did 'text' ever work here??
                                          path,
                                          vars,
                                          this.bound_callback());
                }                
            });            
}

function postBox(req,res){

    var values = checkStringParams( req, 
                                    res, 
                                    utils.copy( {}, req.body, req.params ), 
                                    [ 'siteid','page','description','email','phone','postal'] );

    if( !values )
        return;
        
    if( req.body.belief !== "on" || req.body.authorized !== "on") {
        errout( req, res, err( 400, 'invalid options to postBox') );
        return;
	}
	
    // look up metadata for the box number
    var verify = models.get( values.siteid, function(code,site) {
        checkForFoundErr( req, res, code, site );
        if( code == models.CODE.SUCCESS )
            this.site = site;        
    });

    var notifier = notifyEmailer( req, res );
    
    verify.chain( notifier ).perform();

};
