
/*****************************
 * Initial submission of a takedown request and other features in support of rights holders.
 *****************************/

"use strict";

var safeharbor = require('../lib/safeharbor.js');
var debug      = safeharbor.debug;
var utils      = safeharbor.utils;
var errlib     = safeharbor.errors;
var page       = safeharbor.page;
var Performer  = safeharbor.Performer;

var util = require('util');

exports.install = function( app )
{
	app.get ('/demo$', getSplash);
}

// convenience function for reuse only in this file
function getSplash(req,res){
      res.render( 'demo/demo_splash.html', 
		{ layout:'demo/demo_main.html', pageTitle:  "Demo" }
	);
}

