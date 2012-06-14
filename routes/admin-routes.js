

exports.install = function( app )
{
	// Scaffolding for setting up a fresh install.
	// This should get moved to a full featured /admin module for us to administer the site and the dev process.
	app.get('/scaffolding', recreateTables );
}


function recreateTables(req,res)
{
    var models = require('../models/admin-models.js');
    models.recreateTables(res,res);
    res.write('<!DOCTYPE html PUBLIC \'-//W3C//DTD HTML 4.01//EN\'><html><head><title>waz?</title></head><body>huh!?</body></html>');
    res.end();
}