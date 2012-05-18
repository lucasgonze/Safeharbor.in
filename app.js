//******************************
// Housekeeping
//******************************

var express = require('express')
var routes = require('./routes');
var models = require("./models");

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

		// 404s in particular
		app.use(function(req, res, next){ 
		    res.status(404);
			throw new Error("Not found!?");
		});

		// misc exceptions
		app.use(function(err, req, res, next) {
			if( err.statusCode !== undefined )
				res.statusCode = err.statusCode; 
			res.render("error/error.html",{layout:"global.html",pageTitle:"Error","bodyClass":"error",message:err.message});
		});

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
app.post("/reg",routes.regStep1Post);
app.get("^/reg/:regid([0-9]+)$",function(req, res){
	console.log(req.params.regid);
	res.render("reg/clickthrough-from-email.html",{"layout":"global.html","pageTitle":"Verify","bodyClass":"regid",regid:req.params.regid});
});
/* Causing a crash. Temporarily commented out until I can get to the root cause.
app.post("^/reg/:regid([0-9]+)$",routes.regSaveConfig(req,res));
*/

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

//******************************
// Server loop
//******************************

// heroku needs us to accept a dynamically assigned port
var port = process.env.PORT || 3000; 
app.listen(port,
	function() {
	    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
	});
