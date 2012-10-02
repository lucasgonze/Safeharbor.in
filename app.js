
/*
    N.B. this stuff is very
    order dependend. Every call to app.use
    is establishing the order in which 
    requests are processed.
*/
var express = require('express');
var app = express.createServer();

app.get('/', function(req, res){
	
	var pg = require('pg'); //native libpq bindings = `var pg = require('pg').native`
	
	var conString = process.env.DATABASE_URL || // old heroku generic shared db
		process.env.HEROKU_POSTGRESQL_BLUE_URL|| // new heroku postgres
		"tcp://postgres:EMbr4EDS@localhost/safeharborin"; // on my local machine
		
	console.log("conString",conString);

	var client = new pg.Client(conString);
	if( !client ){
		console.log("BP M.5")	
		throw new InvalidConnect(conString);
	}
	console.log("BP M.6")	
	    client.connect();
	
	console.log("BP Y.1",client);
	sql = "create temp table if not exists foo (bar text)";
	sq = "select 'foo'";
	    var query = client.query( sql,function(err, result){
		console.log("BP Y.3",err,result);
		} );

	res.send("BP Y.4");
    
});

// 
// var safeharbor = require('./lib/safeharbor.js');
// 
// safeharbor.session.setup(app);
// safeharbor.page.setup(app);
// 
// app.use(express.bodyParser());
// app.use(express.methodOverride());
// 
// app.use(app.router);
// app.use(express.static(__dirname + '/public'));
// 
// safeharbor.routes.setup(app);
// safeharbor.errors.setup(app);

//******************************
// Server loop
//******************************

// heroku needs us to accept a dynamically assigned port
var port = process.env.PORT || 3000; 
app.listen(port,
	function() {
	    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
	});