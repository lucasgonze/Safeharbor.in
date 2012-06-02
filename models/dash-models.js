var ac     = require( __dirname + '/actions.js');
var models = require('./index.js');

function getTablesMeta()
{

    var tables = {
        attachments: {
            schema: 
                'CREATE TABLE attachments (' +
                '    action_log_entry integer, ' +
                '    name    text,' +
                '    path     text' +
                ' )' , 
            insert: 'INSERT INTO attachments (action_log_entry,name,path) values($1,$2,$3)',
            deleteSQL: 'DELETE FROM attachments WHERE name = $1',
            values: [ ]
        },

        contested_media: {
            schema: 
                'CREATE TABLE contested_media (' +
                '    id       serial, '  +
                '    site     integer, '  +
                '    name     text, '     +
                '    pageurl  text, '     +
                '    url      text'       +
                ' )' , 
            insert: 'INSERT INTO contested_media (site,name,pageurl,url) values($1,$2,$3,$4) returning id',
            deleteSQL: 'DELETE FROM contested_media WHERE id = $1',
            values: [ ]
            },
        
        action_flows: {
            schema: 
                'CREATE TABLE action_flows (' +
                '    from_action      integer, ' +
                '    to_action        integer ' +
                ' )' , 
            insert: 'INSERT INTO action_flows (from_action,to_action) values($1,$2)',
            deleteSQL: 'DELETE FROM action_flows WHERE from_action = $1 AND to_action = $2',
            values: ac.ACTION_FLOWS
            },
        action_log: {
            schema: 
                'CREATE TABLE action_log (' +
                '   id      serial, ' +
                '   media   integer, ' +
                '   filing  timestamp, ' +
                '   urgency integer, ' +
                '   action  integer ' +
                ' )' , 
            insert: 'INSERT INTO action_log (media,urgency,action) values($1,$2,$3) returning id',
            deleteSQL: 'DELETE FROM action_log WHERE id = $1',
            deleteMedia: 'DELETE FROM action_log WHERE action_log.media = $1',
            values: [ ]            
        }
    }
    
    return tables;
}

function dumpArgs(name,args)
{
   console.log( name + '( ' + Array.prototype.join.call(args,',') + ' )' );
}

function addMediaInfo( site, name, pageurl, url, callback )
{
    var tables = getTablesMeta();
    site = parseInt(site);
    models.getClient().query( tables.contested_media.insert, [site,name,pageurl,url], callback );
}

function startAuditTrail( mediaId, initialState, callback )
{
    //dumpArgs( 'startAuditTrail', arguments );
    var tables = getTablesMeta();
    var client = models.getClient();
    var urgency = 1; // er, for now
    var initialState = initialState || ac.ACTION_STATES.received_web_form;
    
    client.query( tables.action_log.insert, [ mediaId, urgency, initialState ], callback );
}

function deleteTrail( mediaId, callback )
{
    var tables = getTablesMeta();
    var client = models.getClient();
    client.query( tables.action_log.deleteMedia, [mediaId], function(err) {
        if( !!err )
        {
            callback(err);
        }
        else
        {
            client.query( tables.contested_media.deleteSQL, [mediaId], callback );
        }  
    });
}

function queryMediaTrail( mediaId, type, callback ) 
{
    var sql = '';
    var ORDER = ' ORDER BY filing DESC ';
    var LIMIT = '';
    
    switch( type )
    {
        case 'latest':
            LIMIT = ' LIMIT 1 ';

            // fall thru
            
        case 'full':
            sql = 'SELECT * FROM action_log, contested_media ' +
                   'WHERE action_log.media = contested_media.id ' +
                     'AND contested_media.id = ' + mediaId +
                     ORDER + 
                     LIMIT;
            break;      
            
        default:
            callback("Unknown type. Must be one of: 'full', 'latest'");
            return;
    }
    
    var query = models.getClient().query(sql);
    query.on( 'error', callback );
    query.on( 'row', function( result ) { callback( null, result ); } );
}

function initDatabase (client) {

    client = client || models.getClient();
    var tables = getTablesMeta();
    
    function createTables(client,tables)
    {
        for( T in tables )
        {
            var meta = tables[T];
            var drop = 'DROP TABLE IF EXISTS ' + T;
            client.query( drop );
            client.query( meta.schema );
        }
        
        installInitialValues(client,tables);
    }
    
    function installInitialValues(client,tables)
    {
        for( T in tables )
        {
            var meta = tables[T];
            if( meta.values.length )
            {
                for( var i = 0; i < meta.values.length; i++ )
                {
                    client.query(meta.insert, meta.values[i] );
                }
            }
        }
    }
    
    createTables(client,tables);
}

/********************
/* public           *
 ********************/

/*
   logContestedMedia( site,         // id from site database
                      name,         // name of contested media (e.g. "Yesterday")
                      pageurl,      // page that houses URL (e.g. http://blog.media.com?id=30334)
                      url,          // url to media (e.g. http://media.mysite.com/yesterday.mp3)
                      function( err,          // as returned from PostgreSQL
                                { id: #### } ) // use for dash-model APIs
                        { } 

*/


exports.logContestedMedia = addMediaInfo;

/*
    startAuditTrail( mediaId   // from logContestedMedia,
                     initialState, // ac = require('../models/actions.js'); ac.ACTIONS.recieved_web_form
                    function( err,          // as returned from PostgreSQL
                             { id: ##### } ) // line item in action log (relatively useless)
                      { } 
                  );
  
*/
exports.receivedTakeDownRequest = 
exports.startAuditTrail = startAuditTrail;

/*
    deleteTrail( mediaId, function( err ) {} );
*/
exports.deleteAuditTrail = deleteTrail; 


/*
    getMediaTrail(   mediaId, 
                     type,  // 'full' or 'latest'
                     function( err, result ) {} ) 
*/
exports.getAuditTrail = queryMediaTrail;

/*
    install() - one time create tables
*/
exports.install = initDatabase;

