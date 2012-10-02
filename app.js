
/*
    N.B. this stuff is very
    order dependend. Every call to app.use
    is establishing the order in which 
    requests are processed.
*/
var express = require('express');
var app = express.createServer();

var safeharbor = require('./lib/safeharbor.js');

safeharbor.session.setup(app);
safeharbor.page.setup(app);

app.use(express.bodyParser());
app.use(express.methodOverride());

app.use(app.router);
app.use(express.static(__dirname + '/public'));

safeharbor.routes.setup(app);
safeharbor.errors.setup(app);

//******************************
// Server loop
//******************************

// heroku needs us to accept a dynamically assigned port
var port = process.env.PORT || 5000; 
app.listen(port,
	function() {
	    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
	});