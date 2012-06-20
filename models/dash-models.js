var model    = require( './index.js' );
var profile  = require( './profile-models.js' );

var ModelPerformer = model.ModelPerformer;
exports.CODES = model.CODES;


/********************
/* public           *
 ********************/


var appendAuditLog = exports.appendAuditLog = function( obj, callback )
{
    var sql ='INSERT INTO audit (siteid, opname, attachment) VALUES ($1,$2,$3) RETURNING auditid';
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

exports.logTakeDownRequest = function( obj, callback )
{
    var sql = 'INSERT INTO requests ' +
                '(trackingid, page, anchor, description, email, phone, postal) ' +
                'VALUES( $1, $2, $3, $4, $5, $6, $7 )';

    var names = ['trackingid', 'page', 'anchor', 'description', 'email', 'phone', 'postal'];
                
    var requestInfo = new ModelPerformer( {  callback: callback,
                                         performer: function() { 
                                                obj.trackingid = this.findValue('auditid');
                                                var args = this._parseValues(obj,names);
                                                this.table.insertSingleRecord(sql,args);} 
                                            } );

    var appender = appendAuditLog( obj, callback );
    
    return appender.chain( requestInfo );
}

exports.getAuditLog = function( uid, callback )
{
    // TODO: add paging
    
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
                                                    // TODO: this should be a counter up to 'len'
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
                                    
    return AllRows.chain( subSqlPerformer );

}
