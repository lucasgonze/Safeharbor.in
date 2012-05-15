var D = new Date();
console.log("bp 1");
console.log(D.getHours());
console.log(D.getMinutes());

var pg = require('pg'); //native libpq bindings = `var pg = require('pg').native`
var conString = process.env.DATABASE_URL;

var client = new pg.Client(conString);
client.connect();

//queries are queued and executed one after another once the connection becomes available
client.query("CREATE TEMP TABLE foo (bar text)",
	function (err,result){
		console.log("got error on create table");
		console.log(err);
		console.log("===>")
		console.log(result);
		console.log("<===")
	}		
	);

/*
client.query("INSERT INTO user(email, password) values($1, $2)", ['test1@example.com', "password 1"]);
client.query("INSERT INTO user(email, password) values($1, $2)", ['test2@example.com', "password 2"]);


var query = client.query("SELECT * FROM user");

//can stream row results back 1 at a time
query.on('row', function(row) {
	console.log("got row");
  	console.log(row.email);
  	console.log(row.password);
});

//fired after last row is emitted
query.on('end', function() { 
  client.end();
});
*/

// Below is to supress bogus errors in Heroku logs

var sys = require('util');
var http = require('http');

var server = http.createServer(function(req, res) {
  var start = new Date();
  if(req.url != "/") {
    res.writeHead(404);
    return res.end("404'd")
  }
  var after = function(callback) {
    return function(err, queryResult) {
      if(err) {
        res.writeHead(500, {"Content-Type" : "text/plain"});
        return res.end("Error! " + sys.inspect(err))
      }
      callback(queryResult)
    }
  }

});

server.listen(process.env.PORT || 3000)
