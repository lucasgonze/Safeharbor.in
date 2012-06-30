/**
*
    Rendering Pages
    ================
    
    SIMPLE TEXT
    --------------
    To put simple text or HTML to a screen:
    
        res.render( { body_text: 'Hello <b>world</b>' } );
        
        
    TEMPLATE
    ---------
    To put a specific template (like a form) with variables:
    
        res.render( 'box/form.html', { username: name, phone: phone } );
        
    STATUS MESSAGES
    -----------------
    To ouput specific status messages:
    
        var page = safeharbor.page;
        
        res.outputMessage( page.MESSAGE_LEVELS.warning,
                           'Warning Title',
                           'Some warning text goes here' );
                           
     You can have multiple of these output message on the same page. Later,
     you can then call res.render() as above. This allows for the following
     scenario:
     
            if( onSubmit && (some_error == true) ) 
            {
                // on submit there was some error
                res.outputMessage( page.MESSAGE_LEVELS.error,
                                   'Try again',
                                   'Some error text goes here' );
            }
            
            // on first time render OR error re-submit:
            
            res.render( 'box/form.html', postargs );


    STATUS (ONLY) PAGES
    ---------------------
    If all you want to output is the message (no template):
      
            res.outputMessage( page.MESSAGE_LEVELS.success,
                               'Wonderful',
                               'Some happy text goes here' );
                               
            res.render( page.MESSAGE_VIEW, { pageTitle: 'Happy Joy' } );

        
    AJAX-STYLE HTML SNIPPETS
    --------------------------
    To return a snippet of HTML (either as 'body_text', message or template) use 
    the same techniques as above but the layout option:
    
            res.render( { layout: page.SNIPPET, 
                          body_text: 'This text is for embedding' } );
        
    Also works for templates:
        
            res.render( 'profile/acct_email.html', // <-- template for embedded editing
                         { layout: page.SNIPPET } )
        
    
      
**/
var loginstate = require('./loginstate.js'),
    ROLES      = require('./roles.js'),
    utils      = require('./utils.js');

exports.MESSAGE_VIEW      = // alias for...
exports.BODY_TEXT_VIEW    = 'shared/body_text.html';
exports.DEFAULT_LAYOUT    = 'shared/main.html';
exports.SNIPPET           = 'shared/ajax_html.html';
    
var MESSAGE_LEVELS = exports.MESSAGE_LEVELS = {
    info:     'info',
    success:  'success',
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
   //   new cmd('user', '/passwordreset',  'Password reset', 'Change your password');
        new cmd('user', '/accteditor',     'Account settings', 'Change your email and other settings');
        new cmd('user', '/accountdeleter', 'Delete your account', 'hrumph');
        new cmd('user', '/logout',         'Log out', 'bye for now' );
        
        new cmd('site', '/siteeditor','Edit your site properties');

        new cmd('tablinks', '/disputes', 'Past Disputes', 'Your dispute history' );
        new cmd('tablinks', '/form', 'Future Disputes', 'Your dispute future' );
        
        var r = user.role>>>0;
        if( r <= ROLES.admin )
        {
            new cmd('admin', '/admin', 'Admin stuff', '' );
            
            if( r == ROLES.developer )
            {
                new cmd('developer', '/dev', 'Developer stuff', '' );
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

exports.Message = function( msgLevel, msgTitle, text, opts )
{
    utils.copy( this, opts || {});
    
    this.level = msgLevel;
    this.title = msgTitle;
    this.text  = text;
    if( !this.status )
    {
        switch( this.level )
        {
            case MESSAGE_LEVELS.info:
            case MESSAGE_LEVELS.success:
                this.status = 'ok';
                break;
                
            case MESSAGE_LEVELS.warning:
            case MESSAGE_LEVELS.danger:
            case MESSAGE_LEVELS.error:
                 this.status = '??'; // TODO fill these info
                 break;        
        }
    }
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
        user:       function( req, res ) { var  u = loginstate.getUser(req); 
                                           if( u && u.password ) u.password = '****';
                                           return u; },
        isLoggedIn: function( req, res ) { return !!loginstate.getUser(req); },
        isAdmin:    function( req, res ) { var u = loginstate.getUser(req); 
                                            return u && (u.role>>>0 <= ROLES.admin>>>0); },
        menu:       buildMenu, // we should consider not outputting this on Ajax
        messages:   function( req, res ) { return res.sh_output_messages || [ ] }

        } );

    app.use( function setupPage(req,res,next)
        {
            var oldRender = res.render;
            res.render = function(view, opts, fn, parent, sub )
            {
                if( typeof view != 'string' )
                {
                    opts = view;
                    view = exports.BODY_TEXT_VIEW;
                }
                
                if( view == exports.BODY_TEXT_VIEW )
                {
                    if( !opts.body_text )
                        opts.body_text = '';
                }
                
                if( !opts.layout )
                {
                    opts.layout = exports.DEFAULT_LAYOUT; 
                }

                if( !opts.bodyClass )
                {
                    try { opts.bodyClass = view.match(/([a-z0-9]+)\/[^\/]+$/)[1]; } catch( e ) { }
                }
                
                res.render = oldRender;
                return res.render(view, opts, fn, parent, sub );
            }

            if( !res.outputMessage )
            {
                res.outputMessage = function( msgLevel, msgTitle, text, opts ) {
                    if( !res.sh_output_messages )
                        res.sh_output_messages = [ ];
                    res.sh_output_messages.push( new exports.Message(msgLevel,msgTitle,text,opts) );
                    return res;
                }
            }
            next();
        });    
}