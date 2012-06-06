
exports.setup = function(app){

	app.trivialRoute = function(name,partial,pathOffsetFromViews,pageTitle){
		app.get(name,function(req, res) {
		    res.render(
				pathOffsetFromViews+'/'+partial+'.html',			
				{ layout:'global.html', pageTitle:pageTitle, bodyClass: pathOffsetFromViews }
			);
		});
	}

	app.trivialRoute('/','home','firstrun');

    require('./profile-routes.js').install(app);
    require('./reg-routes.js').install(app);
    require('./box-routes.js').install(app);
    require('./dash-routes.js').install(app);

    require('./admin-routes.js').install(app);
    require('./dev-routes.js').install(app);

}