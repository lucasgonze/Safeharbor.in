
/*
    N.B. this stuff is very
    order dependend. Every call to app.use
    is establishing the order in which 
    requests are processed.
*/
var express = require('express');
var app = express.createServer();

var globalClient = null;
var getClient = function() 
{
    if( !globalClient ){
console.log("BP X.1")	
        var pg = require('pg'); //native libpq bindings = `var pg = require('pg').native`
console.log("BP X.2")	
        var conString = process.env.DATABASE_URL; // on heroku and on my local dev box
console.log("BP X.3")	
        var client = new pg.Client(conString);
console.log("BP X.4")	
        if( !client ){
			console.log("BP X.5")	
		    throw new InvalidConnect(conString);
		}
console.log("BP X.6")	
        client.connect();
        globalClient = client;
    }
console.log("BP X.7")	
	return(globalClient);
}


app.get('/', function(req, res){
	
	sql = "create temp table if not exists foo (bar text)";
    var query = getClient().query( sql ); // do NOT pass a callback here
    
    if( !query ){
		console.log("no query");
		res.send("no query");
		return;
    }

    query.on('row', function(data) { 
		console.log("row: ",data);
		res.send('Hello World 1');
	});
    
    query.on('end', function(data) { 
		console.log("end: ",data);
		res.send('Hello World 2');
	});
    
    query.on('error', function(data) { 
		console.log("error: ",data);	
		res.send('Hello World 3');
	});
    
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