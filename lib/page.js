
var loginstate = require('./loginstate.js'),
    ROLES = require('./roles.js');
    
var MESSAGE_LEVELS = exports.MESSAGE_LEVELS = {
    info:     'info',
    warning:  'warning',
    danger:   'danger',    // app error
    error:    'error'      // sys error
};

function buildMenu( req, res ) {
    
    var cmds = {};
    
    function cmd( group, url, link, help )
    {
        this.url = url;
        this.link = link;
        this.help = help;
        if(!cmds[group]) { cmds[group] = {}; cmds[group].items = [ ] };
        cmds[group].items.push(this);
    }
    
    var user = loginstate.getUser(req);
    
    new cmd('safeharbor', '/about',   'About', 'Learn about Safe Harbor');
    new cmd('safeharbor', '/learn',   'Learn', 'Learn about your rights and the DMCA');
    new cmd('safeharbor', '/support', 'Support', 'Ask us stuff');
    
    if( user ) 
    {
        new cmd('user', '/dash',           'Dashboard', 'Manage your disputes' );
        new cmd('user', '/passwordreset',  'Password reset', 'Change your password');
        new cmd('user', '/accteditor',     'Account settings', 'Change your email and other settings');
        new cmd('user', '/accountdeleter', 'Delete your account', 'hrumph');
        new cmd('user', '/logout',         'Log out', 'bye for now' );
        
        new cmd('site', '/siteeditor','Edit your site properties');
        
        if( user.role >= ROLES.admin )
        {
            new cmd('admin', '/admin', 'Admin stuff', '' );
            
            if( user.role == ROLES.developer )
            {
                new cmd('developer', 'dev', 'Developer stuff', '' );
            }
        }
    }
    else
    {
        new cmd( 'user', '/login', 'Login', 'For existing accounts' );
        new cmd( 'user', '/reg',  'Register', 'For creating new accounts' );
        new cmd( 'user', '/lostpassword', 'Lost password', 'For existing, if forgetful accounts');
    }    
    
    return cmds;
}

exports.setup = function(app) {

    var Handlebars = require('handlebars');

    Handlebars.registerHelper('loggedInStatusClass', function() {
        var isLoggedIn = loginstate.isLoggedIn();
        if( isLoggedIn )
            return('loggedin'); // that's a CSS selector name
        else
            return('loggedout');
    });
    
    Handlebars.registerHelper('contextDumper', function(a) {
        // I haven't figured out if this context blob
        // is a copy or an actual instance of something
        // important and shared, so we remove the 'app'
        // thingy so the dump is managable...
        var app = a.app;
        a.app = null;
        var text = require('util').inspect(a,true,null);
        
        // ...and then restore it just in case someone
        // else was using it
        a.app = app;
        return text;
    });

    app.register('.html', Handlebars);
    app.set('view engine', 'handlebars');
    
    
    app.dynamicHelpers( {
        // these will all be passed to every page...
        user:       function( req, res ) { return loginstate.getUser(req); },
        isLoggedIn: function( req, res ) { return !!loginstate.getUser(req); },
        isAdmin:    function( req, res ) { var u = loginstate.getUser(req);
                                      return u && (u.role <= ROLES.admin); },                                              
        menu:       buildMenu, // we should consider not outputting this on Ajax
        messages:   function( req, res ) { return res.sh_output_messages || [ ] }

        } );

    app.use( function setupPage(req,res,next)
        {
            // express is pretty cool because so far
            // there hasn't been a need to actually
            // hook the render call, everything is
            // being done via standard express
            // extensibility. If the need does arise
            // here's how to do that:
            /*                
            var oldRender = res.render;
            res.render = function(view, opts,fn,parent,sub)
            {
                // do some hooky-dooky stuff here
                res.render = oldRender;
                return res.render(view, opts, fn, parent, sub );
            }
            */
            if( !res.outputMessage )
            {
                res.outputMessage = function( msgLevel, text ) {
                    if( !res.sh_output_messages )
                        res.sh_output_messages = [ ];
                    res.sh_output_messages.push( { level: msgLevel, text: text } );
                    return res;
                }
            }
            next();
        });    
}