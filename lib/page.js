
var loginstate = require('./loginstate.js');
    
exports.setup = function(app) {

    app.set('views', '');

    var Handlebars = require('handlebars');
    Handlebars.registerHelper('loggedInStatusClass', function() {
        var isLoggedIn = loginstate.isLoggedIn();
        if( isLoggedIn )
            return('loggedin'); // that's a CSS selector name
        else
            return('loggedout');
    });
    app.register('.html', Handlebars);
    app.set('view engine', 'handlebars');


    app.use( function setupPage(req,res,next)
        {
            var oldRender = res.render;
            res.render = function(view, opts,fn,parent,sub)
            {
                opts.user = loginstate.getUser(req);
                //console.log( 'Page:', view, '//fuckin-a bro//', opts )        
                res.render = oldRender;
                return res.render(view, opts, fn, parent, sub );
            }
            next();
        });    
}