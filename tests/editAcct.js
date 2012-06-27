var path = require('path');

(function() {

    var cmdLineArgs = process.argv;
    
    if( cmdLineArgs.length < 4 )
    {
        console.log( 'Usage: node ' + path.basename(cmdLineArgs[1]) + ' [options]' );
        console.log( '        options -v View only' );
        console.log( '                -u Update' );
        console.log( '                -e acct.email' );
        console.log( '                -i acct.acctid' );
        console.log( '                -f field for new value' );
        console.log( '                -d new value for field in "-f" ' );
        process.exit();
    }
    
    var options = { };
    
    for( var i = 2; i < cmdLineArgs.length; i++ )
    {
        var arg = cmdLineArgs[i];
        
        if( arg[0] == '-' )
        {
            switch( arg[1] )
            {
                default:
                    options[arg[1]] = cmdLineArgs[++i];
                    break;
                    
                case 'v':
                case 'u':
                    options[arg[1]] = true;     
                    break;
            }
        }
    }
    
    if( !options.v && !options.u )
    {
        console.log( 'ERROR: you must have either -v or -u');
        process.exit();
    }

    if( !options.e && !options.i )
    {
        console.log( 'ERROR: you must have either -e or -i');
        process.exit();
    }
    
    if( options.f && !options.d )
    {
        console.log( 'ERROR: if have either f or d you must have both');
        process.exit();
    }
    
    if( options.f && options.v )
    {
        console.log( 'ERROR: you can\'t have both f and v' );
        process.exit();
    }
    
    var models = require('../models');
    var ModelPerformer = models.ModelPerformer;
    var CODES = models.CODES;
    
    var sql, where, args = [], performer, table = options.t || 'acct';

    if( options.i )
    {
        where = 'WHERE acctid = ' + options.i;
    }
    else
    {
        where = "WHERE email = '" + options.e + "'";
    }
    
    if( options.v )
    {
        sql = 'SELECT * FROM acct ' + where;
        performer = function() { this.table.findSingleRecord(sql); } 
    }
    else
    {
        sql = 'UPDATE acct SET ' + options.f + ' = ' + options.d + ' ' + where;
        performer = function() { this.table.updateSingleRecord(sql); } 
    }

    function callback( a, b, c ) { console.log( a, b ? b : '', c ? c : '' ); }
    
    new ModelPerformer( { callback: callback, performer: performer } ).perform();
    
})();