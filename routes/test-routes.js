
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

exports.install = function( app ){		
	app.get('/test/nop', nop);	
	app.get('/test/admin', app.checkRole(app.ROLES.admin));	
	app.get('/test/logged_in', app.checkRole(app.ROLES.logged_in), nop);	
	app.get('/test/500',status500);	
	app.get('/test/404',status404);	
}


