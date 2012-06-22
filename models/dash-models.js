var model      = require( './index.js' );
var debug      = require( '../lib/debug.js' );

var ModelPerformer = model.ModelPerformer;
exports.CODES = model.CODES;

/********************
 * public           *
 ********************/

exports.appendAuditLog = function( obj, callback )
{
    var sql ='INSERT INTO audit (site, opname, attachment) VALUES ($1,$2,$3) RETURNING auditid';
    return new ModelPerformer( { 
                             parseObj:obj, 
                             names:['siteid','opname','attachment'], 
                             performer: function(){ 
                                this.table.insertSingleRecord(sql); 
                                },
                             callback: function( code, auditid ) {
                                if( code != model.CODES.SUCCESS )
                                    callback( code, auditid );
                                else
                                    this.auditid = auditid;
                             }
                            });
}

exports.logTakeDownRequest = function( siteid, contactInfo, mediaInfo, callback )
{
    function extractValues(body,names)
    {
        var ret = [];
        for( var n in names )
            ret.push(body[names[n]]);
        return ret;
    }
    
    /*
        Log the contact info to get that ID first
    */
    var contactFieldNames = [ "owners_full_name",
                            "full_name",
                            "job_title",
                            "email",
                            "phone",
                            "fax",
                            "postal" ];

    var contactSQL = "insert into contact ( " + contactFieldNames.join(', ') + ") values ($1,$2,$3,$4,$5,$6,$7) returning contactid";
    var contactValues = extractValues(contactInfo,contactFieldNames);
    
    var contact = new ModelPerformer( {  callback:  function(code,contactId) {
                                                if( code == model.CODES.INSERT_SINGLE ) 
                                                    this.contactId = contactId;
                                                else
                                                    callback.apply( this, [code, contactId] );
                                            },
                                         performer: function() { 
                                                this.table.insertSingleRecord(contactSQL,contactValues);} 
                                            } );

    /*
        Log the audit trail info next to get that ID
    */
    var auditSQL = 'insert into audit (opname,site,contact) values ($1,$2,$3) returning auditid';
    var auditValues = [ 'takedownRequest', siteid ];
                        
    var audit = new ModelPerformer( {  callback:  function(code,auditId) {
                                                if( code == model.CODES.INSERT_SINGLE ) 
                                                    this.auditId = auditId;
                                                else
                                                    callback.apply( this, [code, auditId] );
                                            },
                                         performer: function() { 
                                                var contact = this.findValue('contactId');
                                                auditValues.push(contact);
                                                this.table.insertSingleRecord(auditSQL,auditValues);} 
                                            } 
                                    );

    contact.chain( audit );
    
    /*
        Log each media infringement
    */
    var mediaSQL   = 'insert into media (page,anchor,description,media_url,audit) values ($1,$2,$3,$4,$5)';
    var mediaNames = ['page','anchor','description','media_url'];
    
    for( var i = 0; i < mediaInfo.length; i++ )
    {
        var mediaValues = extractValues( mediaInfo[i], mediaNames );
        
        function getPerformer( values ) {
            return function() {
                var auditId = this.findValue('auditId');
                values.push(auditId);
                debug.out('VALUES--------',values);
                this.table.insertSingleRecord(mediaSQL,values);
            }
        }
        
        var media = new ModelPerformer( { callback: callback,
                                      performer: getPerformer(mediaValues) } );
        
        // this will chain it to the end (append)
        contact.chain( media );
    }
    
    return contact;
}

function getTakedownRequests( callback )
{
    var sql2 = 'SELECT * FROM media WHERE audit = $1';                             
    return new ModelPerformer( { 
                callback: callback,
                performer: function() 
                {
                    var rows = this.findValue('allRows'),
                        me = this, 
                        len = rows.length;
 
                    function indexCallback(index,row) {
                        return function(code, trRows) {
                                if( code == model.CODES.SUCCESS )
                                {
                                    code = model.CODES.QUERY_ROW;
                                    row.takedownRequests = trRows;
                                }
                                me.callback(code,trRows,row);
                                // TODO: this should be a counter up to 'len'
                                if( index == len - 1 )
                                    me.callback(model.CODES.SUCCESS,rows);
                            }  
                    }
            
                    for( var i = 0; i < len; i++ )
                    {
                        this.table.findAllRows(sql2, [rows[i].auditid], indexCallback(i,rows[i]) );
                    }
                    
                }
            });
}

/*
    here's what one record looks like:
    
{ acctid: 1,
    phone: '5107175153',
    opname: 'takedownRequest',
    agentaddress: '7 foo Ln., Bar Park, IL',
    owners_full_name: 'fullNaming',
    email: 'victor.stodne@gmail.com',
    full_name: 'Victor Stone',
    acct: 1,
    resetdate: null,
    sitename: 'Ass Over Tea Kettle',
    fax: '888393993',
    creation: Thu, 21 Jun 2012 17:34:59 GMT,
    postal: 'aefewfijw aweifjaew few ',
    takedownRequests: 
     [ { anchor: 'ch work is be',
         description: 'work is being',
         audit: 9,
         media_url: 'http://somemedia.mp3',
         page: 'http://localhost.com/box/24738',
         mediaid: 2 },
       { anchor: 'page2',
         description: 'desc2',
         audit: 9,
         media_url: 'http://someothermedia.mp3',
         page: 'http://localhost.net/box/24738',
         mediaid: 3 },
       [length]: 2 ],
    siteid: 40,
    password: 'qqqq',
    attachment: '',
    resetsecret: null,
    contact: 12,
    formatted_date: 'June 21, 2012',
    domain: 'assoverteakettle.org',
    auditid: 9,
    contactid: 12,
    site: 40,
    agentemail: 'assoverteakettle.org@gmail.com',
    job_title: 'copy thug' },
*/
exports.getAuditLog = function( uid, callback )
{
    // TODO: add paging
    
    var sql = 'SELECT *, ' +
              "to_char(creation, 'FMMonth FMDD, YYYY' ) as formatted_date " +
              'FROM audit, site, acct, contact ' +
              'WHERE site    = siteid ' +
              '  AND acct    = acctid ' +
              '  AND contact = contactid ' + 
              '  AND acctid  = $1 ' +
              'ORDER BY audit.creation DESC ';
              
    var AllRows = new ModelPerformer( { values: [uid],
                             performer: function() { this.table.findAllRows(sql); },
                             callback: function( code, rows ) 
                                 {
                                    if( code == model.CODES.SUCCESS )
                                        this.allRows = rows;
                                    else
                                        callback.apply(this,[code,rows]);
                                 },
                             });

    var subSqlPerformer = getTakedownRequests( callback );
    
    return AllRows.chain( subSqlPerformer );

}

exports.getAuditDetail = function( auditId, callback )
{
    
    if( typeof(auditId) == 'function' )
    {
        callback = auditId;
        auditId = 0;
    }
    
    var sql = 'SELECT *, ' +
              "to_char(creation, 'FMMonth FMDD, YYYY' ) as formatted_date " +
              'FROM audit, site, acct, contact ' +
              'WHERE site     = siteid ' +
              '  AND acct     = acctid ' +
              '  AND contact  = contactid ' + 
              '  AND auditid  = $1 ' 
              'ORDER BY audit.creation DESC ';
              
    var audit = new ModelPerformer( { 
                        performer: function() 
                        {
                            var id = auditId || this.findValue('auditId');
                            this.table.findSingleRecord(sql,[id]); 
                        },
                        callback: function( code, row ) 
                        {
                            if( code == model.CODES.SUCCESS )
                            {
                                this.auditDetail = row;
                                this.allRows = [ row ];
                            }
                            else
                            {
                                callback.apply( this, [code,row] );
                            }
                        },
                    });

    var subSqlPerformer = getTakedownRequests( callback );
    
    return audit.chain( subSqlPerformer );

}
