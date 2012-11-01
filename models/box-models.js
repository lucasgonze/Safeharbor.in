
var models = require('./index.js');
var ModelPerformer = models.ModelPerformer;

// re-export
var CODES = exports.CODES = models.CODES;

exports.getOwn = function(acctid,callback) {
    var sql = "select *, md5(''||siteid) as idhash " + 
              "  from site, acct " + 
              "  where acct = acctid and acctid = $1"
			  " limit 1"; // MULTIPLE SITES NOT SUPPORTED YET
              
    return new ModelPerformer( 
                { 
                    values: [ acctid ], 
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

exports.get = function(siteid,callback) {
    var sql = "select *, md5(''||siteid) as idhash " + 
              "  from site, acct " + 
              "  where acct = acctid AND (siteid = $1 OR md5(''||siteid) = $2)";
              
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

