
var model          = require('../models/dev-models.js');
var models         = require('../models/index.js');
var ModelPerformer = models.ModelPerformer;

var errlib = require('../lib/error.js');
var exp      = errlib.err;
var errCheck = errlib.errout( [model.CODES.SQL_ERROR] );
var errout   = errlib.errout();

function htmlDump(res,obj)
{
    html = '<!DOCTYPE html PUBLIC \'-//W3C//DTD HTML 4.01//EN\'><html><head><title>dumper</title></head>' +
           '<body><pre> ' + require('util').inspect(obj,true,null) + '</pre></body></html>';
    res.write(html);
    res.end();
}

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
	
	app.get('/test', test );
    
}

function test(req,res)
{
    var models     = require('../models/dash-models.js');
    var profile    = require('../models/profile-models.js');
    var loginstate = require('../lib/loginstate.js');
    var errlib     = require("../lib/error.js");
    
    var exp            = errlib.err;
    var errout         = errlib.errout();
    var checkForSQLErr = errlib.errout( [ models.CODES.SQL_ERROR ] );
    
    var uid = 1; // loginstate.getID(req);

    function callback( code, rows ) 
    {
//        console.log( 'getLog CB', code, rows );
        checkForSQLErr( req, res, code, rows );
        if( code == models.CODES.SUCCESS )
        {
            htmlDump(res, rows);
            /*
            res.render( '../views/dash/home.html',
                        {
                           layout: 'global.html',
                           pageTitle: 'Safe Harbor Dashboard',
                           bodyClass: 'dash',
                           auditItems: rows
                        } );
            */
        }
    }
 
    dbg(100);
    
    var sql = 'SELECT *, ' +
              "to_char(creation, 'FMMonth FMDD, YYYY' ) as formatted_date " +
              'FROM audit, site, acct ' +
              'WHERE audit.siteid = site.siteid ' +
              '  AND site.ownerid = acct.acctid ' +
              '  AND acct.acctid = $1 ' +
              'ORDER BY creation DESC ';
              
    var AllRows = new ModelPerformer( { values: [uid],
                             performer: function() { this.table.findAllRows(sql); },
                             callback: function( code, rows ) 
                                 {
                                    if( code == models.CODES.SUCCESS )
                                        this.allRows = rows;
                                    else
                                        this.callback(code,rows);
                                 },
                             });

    var sql2 = 'SELECT * FROM requests WHERE trackingid = $1';                             
    var subSqlPerformer = new ModelPerformer( { 
                                    performer: function() 
                                    {
                                        var rows = this.findValue('allRows');
                                        var me = this, len = rows.length;
                                        
                                        function indexCallback(index,row) {
                                            return function(code, trRows) {
                                                    if( code == models.CODES.SUCCESS )
                                                    {
                                                        code = models.CODES.QUERY_ROW;
                                                        row.takedownRequests = trRows;
                                                    }
                                                    me.callback(code,trRows,row);
                                                    if( index == len - 1 )
                                                        me.callback(models.CODES.SUCCESS,rows);
                                                }  
                                        }
                                
                                        for( var i = 0; i < len; i++ )
                                        {
                                            this.table.findAllRows(sql2, [rows[i].auditid], indexCallback(i,rows[i]) );
                                        }
                                        
                                    },
                                    callback: callback
                                    });
                                    
    AllRows.chain( subSqlPerformer ).perform();

}

function dbg(volume)
{
    var debug = require('../lib/debug.js');
    debug.setVolume(volume);
}

function flipDebug(req,res)
{
    var debug = require('../lib/debug.js');
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
                data.push( { name: this.name, schema: R.keys(), rows: rows } );
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