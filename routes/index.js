
var profile = require("./profile-routes.js");
var reg = require("./reg-routes.js");

// helpful for debugging
var nopRoute = function(req, res) {
    res.write("<!DOCTYPE html PUBLIC \"-//W3C//DTD HTML 4.01//EN\"><html><head><title>NOP</title></head><body>NOP</body></html>");
    res.end();
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
	app.get("/nop", nopRoute);

	// Account creation
	trivialRoute("/reg","acct","reg","Try It"); 
	app.post("/reg",reg.saveAcct);
	app.get("^/reg/:regid([0-9]+)$",function(req, res){
		res.render("reg/fromemail.html",{"layout":"global.html","pageTitle":"Verify","bodyClass":"regid",regid:req.params.regid});
	});
	app.post("^/reg/:regid([0-9]+)$",reg.saveConfig);

	// Scaffolding for setting up a fresh install.
	// This should get moved to a full featured /admin module for us to administer the site and the dev process.
	app.post("/scaffolding",function(req,res){
		var models = require("../models");
		models.recreateTables();
		res.write("<!DOCTYPE html PUBLIC \"-//W3C//DTD HTML 4.01//EN\"><html><head><title>waz?</title></head><body>huh!?</body></html>");
	    res.end();
	})

	// Login, password recovery, acct management
	trivialRoute("/login","login","profile","Log In");
	app.post("/login",profile.saveLogin);
	trivialRoute("/lostpassword","lostpassword","profile","Lost Password");
	app.post("/lostpassword",profile.recoverPassword);
	app.get("/lostpassword/:resetSecret([0-9a-z]{10})$",profile.verifySecret);
	app.post("/lostpassword/:resetSecret([0-9a-z]{10})$",profile.postNewPassword);
	
	// Components for aggrieved rights holders
	trivialRoute("/box/:id","top","box","Submit Request");

	// Dealing with takedown requests for logged in customers
	trivialRoute("/dash","home","dash","Todo");
	trivialRoute("/dash/list","list","dash","List");
	trivialRoute("/dash/stats","stats","dash","Stats");
}