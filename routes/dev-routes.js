
var model          = require('../models/dev-models.js');
var models         = require('../models/index.js');
var ModelPerformer = models.ModelPerformer;

var debug    = require('../lib/debug.js');
var htmlDump = debug.render;
var errlib   = require('../lib/error.js');
var exp      = errlib.err;
var errCheck = errlib.errout( [model.CODES.SQL_ERROR] );
var errout   = errlib.errout();
var checkForSQLErr = errCheck;

exports.install = function( app )
{
    // helpful for debugging
    
	app.get('/nop', function(req, res) {
        console.log('req.session: ')
        console.log(req.session);
        require('../lib/loginstate.js').logstate(req);
        res.write('<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN"><html><head><title>NOP</title></head><body>NOP</body></html>');
        res.end();
    });
    
	// Scaffolding for setting up a fresh install.
	// This should get moved to a full featured /admin module for us to administer the site and the dev process.
	app.get('/scaffolding', recreateTables );

	app.get('/underbelly', dumpTables );
	app.get('/overthecounter', cleanTables );
	app.get('/debugout/:volume([0-9])', flipDebug );
	
	app.get('/testboxpost', testboxpost );
	app.get('/testdash', testdash );
	
}

function testdash( req, res )
{
    var models = require('../models/dash-models');
    var uid = 1;
    var log = models.getAuditLog(uid,function(code,rows) 
                    {
                        checkForSQLErr( req, res, code, rows );
                        if( code == models.CODES.SUCCESS )
                        {
                            res.render( '../views/disputes/all.html',
                                        {
                                           layout: 'signedin.html',
                                           pageTitle: 'Safe Harbor - Disputes',
                                           bodyClass: 'disputes',
                                           auditItems: rows
                                        } );
                        }
                    });
    
    log.perform();
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

function dbg(volume)
{
    debug.setVolume(volume);
}

function flipDebug(req,res)
{
    debug.setVolume( req.params.volume );
    debug.out('DEBUG IS SOMETHING');
    htmlDump(res,'debug is something');
}

function dumpTables( req, res )
{
    var data = [];
    
    var coreDumper = model.dumpAll( function(code,rows,result) {
        if( code == model.CODES.OK )
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
        //console.log( this.name, c, err );                                        
        errCheck( req, res, c, err );
        
        if( c != model.CODES.OK )
            return;
        
        html = '<!DOCTYPE html PUBLIC \'-//W3C//DTD HTML 4.01//EN\'><html><head><title>dumper</title></head>' +
               '<body>'; 
            
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
        
        html += '</body></html>';
        res.write(html);
        res.end();
    }});

    coreDumper.last().chain(printer);
    coreDumper.perform();
}

function recreateTables(req,res)
{
    try {
        model.recreateTables(function(err) {
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
    model.cleanTables(function(sql, err, a, b) {
        //console.log( 'RESULT FOR: ', sql );
        //console.log( 'Cleaning with : ', err, a ? a : '', b ? b : '' );
        if( err )
            errout(req,res,err); 
        });
    dumpTables(req,res);
}