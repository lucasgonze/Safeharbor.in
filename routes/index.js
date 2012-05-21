
var reg = require("./reg-routes.js");

// helpful for debugging
var nop = function(req, res) {
    res.write("<!DOCTYPE html PUBLIC \"-//W3C//DTD HTML 4.01//EN\"><html><head><title>NOP</title></head><body>NOP</body></html>");
    res.end();
};

var loginPost = function(req, res) {
	// this method is a stub for now. in the future we'll validate the user info and open up a session for their specific account.
	res.redirect("/dash");
//    res.render('firstrun/login.html',{layout:"firstrun/layout.html",loginStatus:"success"});
};

exports.setup = function(app){

	var trivialRoute = function(name,partial,pathOffsetFromViews,pageTitle){
		app.get(name,function(req, res) {
		    res.render(
				pathOffsetFromViews+"/"+partial+".html",			
				{"layout":"global.html","pageTitle":pageTitle,"bodyClass":pathOffsetFromViews}
			);
		});
	}

	trivialRoute("/","home","firstrun");
	app.get("/nop", nop);

	// Account creation
	trivialRoute("/reg","acct","reg","Try It"); 
	app.post("/reg",reg.saveAcct);
	app.get("^/reg/:regid([0-9]+)$",function(req, res){
		res.render("reg/fromemail.html",{"layout":"global.html","pageTitle":"Verify","bodyClass":"regid",regid:req.params.regid});
	});
	app.post("^/reg/:regid([0-9]+)$",reg.saveConfig);

	// Scaffolding for setting up a fresh install
	app.post("/scaffolding",function(req,res){
		var models = require("../models");
		models.recreateTables();
		res.write("<!DOCTYPE html PUBLIC \"-//W3C//DTD HTML 4.01//EN\"><html><head><title>what?</title></head><body>huh?</body></html>");
	    res.end();
	})

	// Login and password recovery
	trivialRoute("/login","home","login","Log In");
	app.post("/login", loginPost);
	
	// Components for aggrieved rights holders
	trivialRoute("/box/:id","top","box","Submit Request");

	// Dashboard for logged in customers
	trivialRoute("/dash","home","dash","Todo");
	trivialRoute("/dash/list","list","dash","List");
	trivialRoute("/dash/stats","stats","dash","Stats");
}