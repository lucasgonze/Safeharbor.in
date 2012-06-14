
var model          = require('../models/dev-models.js');
var ModelPerformer = require('../models/index.js').ModelPerformer;

var errlib = require('../lib/error.js');
var err      = errlib.err;
var errCheck = errlib.errout( [model.CODES.SQL_ERROR] );

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
	
	app.get('/checkreg', checkRegBug );
    
}

function checkRegBug( req, res )
{
    var models     = require("../models/reg-models.js");
    var loginstate = require('../lib/loginstate.js');
    var errlib     = require('../lib/error.js');
    var utils      = require('../lib/utils.js');
    
    var errout         = errlib.errout();
    var checkForSQLErr = errlib.errout( [ models.CODES.SQL_ERROR ] );

    var checkAcct = models.checkForAccount( 'foo@barc.om', function(code, err) { 
            htmlDump( res, [code,err] );
            checkForSQLErr( req, res, code, err );
            if( code == models.CODES.RECORD_FOUND )
            {
                res.render("profile/login.html",
                    {
                        layout:"global.html",
                        pageTitle:"Account exists",
                        bodyClass: "login",
                        'alert-from-create': '<div class="alert alert-info">You already have an account</div>'
                    });
                this.stopChain();
            }
        });

    htmlDump( res, checkAcct);

    checkAcct.perform();
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
        errCheck( req, res, c, err );
        
        if( c != model.CODES.OK )
            return;
        
        html = '<!DOCTYPE html PUBLIC \'-//W3C//DTD HTML 4.01//EN\'><html><head><title>dumper</title></head>' +
               '<body>'; // <pre> ' + require('util').inspect(data,true,null) + '</pre></body></html>';
            
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
    model.recreateTables(res,res);
    res.write('<!DOCTYPE html PUBLIC \'-//W3C//DTD HTML 4.01//EN\'><html><head><title>waz?</title></head><body>huh!?</body></html>');
    res.end();
}