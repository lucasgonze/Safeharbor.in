
var dm = require('../models/dash-models.js');
var ac = require('../models/actions.js');

function getDash( req, res )
{
    var rows = [];
    res.render( '../views/dash/home.html',
                {
                   layout: 'global.html',
                   pageTitle: 'Safe Harbor Dashboard',
                   bodyClass: 'dash',
                   auditItems: rows
                } );
}

exports.install = function(app) 
{
    app.get( '/dash', getDash );
    /*
	// Dealing with takedown requests for logged in customers
	trivialRoute('/dash','home','dash','Todo');
	trivialRoute('/dash/list','list','dash','List');
	trivialRoute('/dash/stats','stats','dash','Stats');
	*/
    
}