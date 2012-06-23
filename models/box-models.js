
var models = require('./index.js');
var ModelPerformer = models.ModelPerformer;

// re-export
var CODES = exports.CODES = models.CODES;

exports.get = function(siteid,callback) {
    var sql = "select *, md5(concat('',siteid)) as idhash " + 
              "  from site, acct " + 
              "  where acct = acctid AND (siteid = $1 OR md5(concat('',siteid)) = $2)";
              
    return new ModelPerformer( 
                { 
                    values: [ parseInt(siteid) || 0, siteid ], 
                    callback: function( code, site ) {
                            if( code == CODES.SUCCESS )
                                this.siteId = site.siteid;
                            callback.apply( this, [code,site] );
                        },
                    performer: function() {
                          this.table.findSingleRecord(sql);
                        }
                });
}

