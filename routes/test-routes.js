
// This file is for TDD paths

function nop(req,res){
	res.send(204);
}

function status500(req,res){	
	var err = require('../lib/error.js')
	err.page(500,res,"this is the debug info");
}

function status404(req,res){	
	var err = require('../lib/error.js')
	err.page(404,res,"this is the debug info");
}

function runtimeException(req,res){	
	throw new NoFunctionWithThisNameExistsUnlessIStupidlyCreateIt	();
}

function loggedout(req,res){
	var loginstate = require('../lib/loginstate.js');
	if( loginstate.isLoggedIn() )
		err.page(400,res,"The session is logged in.");
	else
		nop(req,res);
}

exports.install = function( app ){		
	app.get('/test/nop', nop);	
	app.get('/test/admin', app.checkRole(app.ROLES.admin), nop);	
	app.get('/test/loggedout', loggedout);	
	app.get('/test/loggedin', app.checkRole(app.ROLES.logged_in), nop);	
	app.get('/test/500',status500);	
	app.get('/test/404',status404);	
	app.get('/test/runtimeException',runtimeException);	
}


