
var dev            = require('../models/dev-models.js');
var routes         = require('../routes/index.js');
var models         = require('../models/index.js');
var ModelPerformer = models.ModelPerformer;

var CODES     = dev.CODES;

var util     = require('util');
var utils    = require('../lib/utils.js');
var debug    = require('../lib/debug.js');
var htmlDump = debug.render;
var errlib   = require('../lib/error.js');
var exp      = errlib.err;
var errout   = errlib.errout();

var menu = [

	[ 'test logged in state', '/dev/nop', nop],
	[ 'dump of tables', '/dev/underbelly', dumpTables ],
	[ 'turn on console debugging', '/dev/debugout/:volume([0-9])', flipDebug, '/dev/debugout/1' ],
	[ 'turn off console debugging', null, flipDebug, '/dev/debugout/0' ],
	[ 'hard-wired /box form', '/dev/testboxpost', testboxpost ],
	[ 'test dashboard for account (1)', '/dev/testdash', testdash ],
    [ 'some fun docs', '/dev/docs', docs ],
	[ 'rebuild tables (<b>DESTRUCTIVE</b> - NO UNDO)', '/dev/scaffolding', recreateTables ],
	[ 'clean and factory install tables (<b>DESTRUCTIVE</b> - NO UNDO)', '/dev/overthecounter', cleanTables ]
];


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

function devMenu(req,res)
{
    var html = '<ul>';
    for( var i = 0; i < menu.length; i++ )    
    {
        var M = menu[i];
        html += '<li><a href="'+(M[3] || M[1])+ '">'+ M[0] + '</a> ' + (M[3] || M[1]) + '</li>';
    }
    html += '</ul>';
    utils.page( res, html, 'Developer Stuff' );
}

function docs( req, res )
{
    var text = '<p>How Performer class works:</p>' + 
               '<img src="/img/dev/performer.jpg" />';
               
    utils.page( res, text, 'Developer Docs' );
}

function nop(req, res) {
    require('../lib/loginstate.js').logstate(req);
    utils.page( res, '<pre>'+util.inspect(req.session)+'</pre>', 'Session');
}

function testdash( req, res )
{
    var dashR = require('./dash-routes.js');
    dashR.renderDashForAccount( req, res, 1 );
}

function testboxpost(req,res)
{
    res.render( '../views/dev/fakeAttach2.html',
                {
                   layout: 'global.html',
                   pageTitle: 'Test Box Post',
                   bodyClass: 'dash'
                } );
}

function flipDebug(req,res)
{
    debug.setVolume( req.params.volume );
    debug.out('DEBUG IS SOMETHING');
    utils.page(res,'debug is ' + ( req.params.volume ? 'something' : 'meh'),'Debug is Something');
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
        
        utils.page(res,html,'db dump');
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
        htmlDump(res,'Booyah(?)');
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