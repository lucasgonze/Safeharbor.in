/**
 * Module dependencies.
 */

var express = require('express')
,
routes = require('./routes');

var app = module.exports = express.createServer();

// Configuration
app.configure(function() {
	    app.set('views', __dirname + '/views');
	    app.register('.html', require('handlebars'));
	    app.set('view engine', 'handlebars');
	    app.use(express.bodyParser());
	    app.use(express.methodOverride());
	    app.use(app.router);
	    app.use(express.static(__dirname + '/public'));
	});

app.configure('development',
	function() {
	    app.use(express.errorHandler({
	        dumpExceptions: true,
	        showStack: true
	    }));
	});

app.configure('production',
	function() {
	    app.use(express.errorHandler());
	});

//******************************
// Routes
//******************************

console.log("returning"); return;

var pg = require('pg');

pg.connect(process.env.DATABASE_URL, function(err, client) {
  var query = client.query('CREATE TABLE  `mytakedownrequests`.`acct` ( `uid` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY , `emailConfirmed` BOOL NOT NULL , `password` CHAR( 32 ) NOT NULL , `email` CHAR( 32 ) NOT NULL , `sitename` VARCHAR( 64 ) NOT NULL , `sitelink` VARCHAR( 128 ) NOT NULL ,`agent-snail` VARCHAR( 256 ) NOT NULL ,`agent-email` VARCHAR( 32 ) NOT NULL)'');

  query.on('row', function(row) {
    console.log(JSON.stringify(row));
  });
});


return;

//*****


trivialRoute = function(name,partial,pathOffsetFromViews,pageTitle){
	app.get(name,function(req, res) {
	    res.render(
			pathOffsetFromViews+"/"+partial+".html",			
			{"layout":"global.html","pageTitle":pageTitle,"bodyClass":pathOffsetFromViews}
		);
	});
}

trivialRoute("/","home","firstrun");
trivialRoute("/fixme","fixme","error","Error");
trivialRoute("/box/:id","top","box","Submit Request");
app.get("/nop", routes.nop);

// Account creation, login, password recovery
trivialRoute("/reg","step1","reg","Try It");
app.post("/reg/step1",routes.regStep1Post);
trivialRoute("/reg/step2","step2","reg","Try It");
trivialRoute("/reg/step3","step3","reg","Try It");
trivialRoute("/reg/step4","step4","reg","Try It");
app.post("/reg/step4",routes.regStep4Post);
trivialRoute("/reg/step5","step5","reg","Try It");	
trivialRoute("/login","home","login","Log In");
app.post("/login", routes.loginPost);

// Dashboard for logged in customers
trivialRoute("/dash","home","dash","Todo");
trivialRoute("/dash/list","list","dash","List");
trivialRoute("/dash/stats","stats","dash","Stats");

// heroku needs us to accept a dynamically assigned port
var port = process.env.PORT || 3000; 
app.listen(port,
	function() {
	    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
	});
