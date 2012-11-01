
var safeharbor     = require('../lib/safeharbor.js');
var utils          = safeharbor.utils;
var debug          = safeharbor.debug;
var errlib         = safeharbor.errors;
var routes         = safeharbor.routes;
var models         = safeharbor.models;
var ModelPerformer = models.ModelPerformer;

var dev       = require('../models/dev-models.js');
var CODES     = dev.CODES;

var util     = require('util');
var htmlDump = debug.render;
var exp      = errlib.err;
var errout   = errlib.errout();

var menu = [

	[ 'UPDATE: perform system upgrade', '/update', update ],
	[ 'test page context', '/dev/page', page],
	[ 'test logged in state', '/dev/nop', nop],
	[ 'dump of tables', '/dev/underbelly', dumpTables ],
	[ 'permanent Google+ Hangout', '/hangout', hangout],
	[ 'turn on console debugging', '/dev/debugout/:volume([0-9])', flipDebug, '/dev/debugout/1' ],
	[ 'turn off console debugging', null, flipDebug, '/dev/debugout/0' ],
	[ 'hard-wired /box form', '/dev/testboxpost', testboxpost ],
	[ 'test dashboard for account (1)', '/dev/testdash', testdash ],
    [ 'some fun docs', '/dev/docs', docs ]
];
/* Disabled for security. A deploy script is now doing this. See Github issue #160 https://github.com/lucasgonze/Safeharbor.in/issues/160
,
[ 'rebuild tables/factory install (<b style="color:red">DESTRUCTIVE</b> - NO UNDO)', '/dev/scaffolding', recreateTables ]
*/

function hangout(req,res){
	res.redirect('https://plus.google.com/hangouts/_/e8402e9cd589061e6bad0ffe62e501b91e86dd3c?authuser=0&hl=en');	
}
exports.install = function( app )
{
    var check = app.checkRole(app.ROLES.developer);
    
    app.get('/dev', check, devMenu );	

    for( var i = 0; i < menu.length; i++ )    
    {
        var M = menu[i];
        if( M[1] )
            app.get( M[1], check, M[2] );
    }
}

//
//  00        <-- major VERSION
//    .00     <-- minor VERSION, still upgrade worthy
//       .00  <-- minor revision, does not deserve upgrade event
//
var VERSION = exports.APP_VERSION = '00.01.00';

function update(req,res)
{
    var  fs = require('fs'),
         fname = process.cwd() + '/version.info';
        
    var versionOnDisk;
    
    try {
        var text = fs.readFileSync( fname, 'utf8' );
        versionOnDisk = JSON.parse(text);
    }
    catch(e) {
        versionOnDisk = { version: '00.00.00' }
    }
    
    var app_version  = VERSION.split('.'),
        disk_version = versionOnDisk.version.split('.');
        
    var out = '';
    
    if( (app_version[0] != disk_version[0]) || 
        (app_version[1] != disk_version[1]) )
    {
        process.emit( safeharbor.UPDATE_EVENT_NAME, app_version );
        versionOnDisk.version = VERSION;
        fs.writeFileSync( fname, JSON.stringify(versionOnDisk), 'utf8' );
        out = 'Update performed (!) now at: ' + VERSION;    
    }
    else
    {
        out = 'System was already up to date';
    }

    res.render( { body_text: '<h3>'+out+'</h3>',  pageTitle: 'Upgrade result' } );
}

function devMenu(req,res)
{
    var html = '<ul>';
    for( var i = 0; i < menu.length; i++ )    
    {
        var M = menu[i];
        html += '<li><a href="'+(M[3] || M[1])+ '">'+ M[0] + '</a> ' + (M[3] || M[1]) + '</li>';
    }
    html += '</ul>';
    res.render( { body_text: html, pageTitle: 'Developer Stuff' } );
}

function docs( req, res )
{
    var text = '<p>How Performer class works:</p>' + 
               '<img src="/img/dev/performer.jpg" />';
               
    res.render( { body_text: text, pageTitle: 'Developer Docs' } );
}

function nop(req, res) {
    require('../lib/loginstate.js').logstate(req);
    res.render( { body_text: '<pre>'+util.inspect(req.session)+'</pre>', pageTitle: 'Session' } );
}

function testdash( req, res )
{
    var dashR = require('./dash-routes.js');
    dashR.renderDashForAccount( req, res, 1 );
}

function page(req,res) 
{
    var msg = require('../lib/page.js').MESSAGE_LEVELS;
    res.outputMessage( msg.info, "Hey just fyi" ).
        outputMessage( msg.warning, "No, really, be careful out there" ).
        outputMessage( msg.error, "That's what I'm talking about" );
        
    res.render( 'dev/pageargs.html', { } ); // see contextDumper in page.js for what happens next
}

function testboxpost(req,res)
{
    res.render( 'dev/fakeAttach2.html',
                {
                   pageTitle: 'Test Box Post'
                } );
}

function flipDebug(req,res)
{
    debug.setVolume( req.params.volume );
    debug.out('DEBUG IS SOMETHING');
    res.render( { body_text: 'debug is ' + ( req.params.volume ? 'something' : 'meh'), pageTitle: 'Debug is Something' } );
}

function dumpTables( req, res )
{
    var data = [];
    
    var coreDumper = dev.dumpAll( function(code,rows,result) {
        if( code == CODES.OK )
        {
            if( rows.length > 0 )
            {
                var R = rows[0];
                data.push( { name: this.name, schema: Object.keys(R), rows: rows } );
            }
            else
            {
                data.push( { name: this.name, 
                             schema: ['empty'],
                             rows: [{empty:''}] 
                            } );
            }
        }
    });
    
    var printer = new ModelPerformer( { performer: function() { this.table.findSingleRecord('SELECT NOW()'); },
                                        callback: function( c, err ) {
        if( c != CODES.OK )
            return;
   
        html = ''; 
            
        for( var i = 0; i < data.length; i++ )
        {
            var D = data[i];
            html += '<p><h3>' + D.name + '</h3><table border="1"><tr>';
            
            for( var s = 0; s < D.schema.length; s++ )
            {
                html += '<th>' + D.schema[s] + '</th>';
            }
            
            html += '</tr>';
            
            for( var n = 0; n < D.rows.length; n++ )
            {
                html += '<tr>';
                var R = D.rows[n];
                for( var s = 0; s < D.schema.length; s++ )
                {
                
                    html += '<td>' + R[D.schema[s]] + '</td>';
                }
                html += '</tr>';
            }
            html += '</table></p>';
        }
        
        res.render( { body_text: html, pageTitle: 'db dump' } );
    }});

    coreDumper
       .handleErrors( req, res )
       .chain(printer)
       .perform();
}

function recreateTables(req,res)
{
    try {
        dev.recreateTables(function(err) {
            if( err )
                throw err;
            });
        // htmlDump(res,'Booyah(?)');
        cleanTables( req, res );
        }
    catch( err ) {
        errout(req,res,err); 
    }
}

function cleanTables(req,res)
{
    dev.cleanTables(function(sql, err, a, b) {
        if( err )
            errout(req,res,err); 
        });
    dumpTables(req,res);
}