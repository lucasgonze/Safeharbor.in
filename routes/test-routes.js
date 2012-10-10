
// This file is for TDD paths

function nop(req,res){
	res.send(204);
}

exports.install = function( app ){	
	
	app.get ('/test/nop', nop);	
	app.get ('/test/admin', app.checkRole(app.ROLES.admin));	
	app.get ('/test/logged_in', app.checkRole(app.ROLES.logged_in), nop);	
	
}


