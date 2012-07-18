
var models = require('./index.js');
var ModelPerformer = models.ModelPerformer;

// re-export for convinience
var CODES = exports.CODES = models.CODES;

CODES.HANDSHAKE_EXPIRED = 'hs_expired';
CODES.HANDSHAKE_VALID   = 'hs_valid';
CODES.FOUND_SITE_ID     = 'siteidok';

/*****************************
 * Account management
 *****************************/

exports.acctIdFromEmailPassword = function(obj,callback) {
    var sql = "select acctid from acct where email = $1 and password = $2";
    
    return new ModelPerformer( { parseObj: obj, 
                                 names: ['email','password'], 
                                 callback: callback, 
                                 performer: function() {
                                    this.table.findSingleValue( sql );
                                }}); 
}

exports.acctFromEmailPassword = function(obj,callback) {
    var sql = "select * from acct where email = $1 and password = $2";
    
    return new ModelPerformer( { parseObj: obj, 
                                 names: ['email','password'], 
                                 callback: callback, 
                                 performer: function() {
                                    this.table.findSingleRecord( sql );
                                }}); 
}

exports.acctIdFromEmail = function(email,callback){
    var sql = "select acctid from acct where email = $1";
    return new ModelPerformer( { values: [email], 
                                 callback: callback, 
                                 performer: function() { 
                                    this.table.findSingleRecord(sql); 
                                 }});
}

exports.acctFromID = function(id,callback){
    var sql = "select * from acct where acctid = $1";
    return new ModelPerformer( { callback: callback, 
                                 performer: function() { 
                                    var args = [ id || this.findValue('acctid') ];
                                    this.table.findSingleRecord(sql,args); 
                                  }});
}


exports.checkPassword = function(id,password,callback){
    var sql = "select acctid from acct where acctid = $1 and password = $2";
    
    return new ModelPerformer( { values: [id,password], callback: callback, performer: function() {
        this.table.findSingleRecord( sql );
    }}); 
}

exports.initPasswordReset = function(email,callback) {
    var sql = "update acct set resetsecret = substring(md5(random()::text) from 2 for 10), resetDate = now() where email = $1 returning resetsecret";

    return new ModelPerformer( { values: [email], callback: callback, performer: function() {
        this.table.updateSingleRecord( sql );
    }});
}


exports.saveNewPassword = function( values, callback ) {

    // first... make sure the handshake hasn't expired

    var sqlExpire = "select (current_timestamp - resetdate) > interval '1 hour' as expired " +
                    "  from acct" +
                    "  where resetSecret = $1";

	var expireCheck = new ModelPerformer( 
                            { 
                                parseObj: values, 
                                names: ['resetsecret'],                             
                                callback: function(c, expired) {
                                    if( c == CODES.OK )
                                    {
                                        if( expired )
                                        {
                                            c = CODES.HANDSHAKE_EXPIRED;
                                            this.stopChain();
                                        }
                                        else
                                        {
                                            c = CODES.HANDSHAKE_VALID;
                                        }
                                    }
                                    callback.apply( this, [c, expired] );
                                }, 
                                performer: function() {
                                    this.table.findSingleValue( sqlExpire );
                                }
                            });
    
    //  Update the record with user supplied password

    var sqlUpdate = "UPDATE acct SET password = $1 WHERE resetSecret = $2 RETURNING email";
    
    var savePass = new ModelPerformer( { parseObj: values, 
                                         names: ['password', 'resetsecret'], 
                                         callback: callback, 
                                         performer: function() { this.table.updateSingleRecord( sqlUpdate ); }});

    // Chain the two together...
    
    return expireCheck.chain( savePass );
}


/* For a user who hasn't lost their password. */

exports.resetPasswordForLoggedInUser = function( obj, callback ) {
    var sql = "update acct set password = $1 where acctid = $2 and password = $3 returning acctid";
    
    return new ModelPerformer({ parseObj: obj, 
                                names: ['newpassword','acct','current'], 
                                callback: callback, 
                                performer: function() {this.table.updateSingleRecord( sql ); }
                              });    
}

exports.updateAccount = function( obj, callback ) {
    var sql = 'update acct set email = $2, autologin = $3 where acctid = $1';
    var updateAcct = new ModelPerformer( { parseObj: obj, 
                                 names: ['acct','email','autologin'], 
                                 callback: callback, 
                                 performer: function(){ this.table.updateSingleRecord(sql); }} );
                                 
    if( obj.newpassword )
    {
        var updatePass = exports.resetPasswordForLoggedInUser(obj,callback);
        updateAcct.chain( updatePass );
    }
    
    return updateAcct;           
}


exports.deleteAccount = function(userid,callback){
	
	function helper(sql) {
        return new ModelPerformer( { values: [userid], 
                                     callback: callback, 
                                     performer: function() { this.table.deleteSingleRecord(sql); }
                                    } 
                                );
    }

	// PT 1: delete any sites owned by this user
	// (in the future when there are multiple accounts per site this will become more complex)
	var pt1 = helper("delete from site where acct = $1");
	
	// PT 2: delete the user
	var pt2 = helper("delete from acct where acctid = $1 returning acctid");

    return pt1.chain(pt2);
}

exports.getSiteForUser = function(ownerid,callback){
    var sql = "select *, md5(''||siteid) as idhash from site where acct = $1";
    
    return new ModelPerformer( { values:[ownerid], 
                                 callback: callback, 
                                 performer:function() { this.table.findSingleRecord(sql); }} );
}

exports.getFirstSiteIdForUser = function(ownerid,callback) {
    var sql = "select siteid from site where acct = $1 LIMIT 1";
    
    function callBackWrap( code, siteid )
    {
        if( code == CODES.SUCCESS )
            this.siteid = siteid;
        callback.apply(this,[code,siteid]);
    }
    
    return new ModelPerformer( { values: [ownerid], 
                                 callback: callBackWrap,
                                 performer:function() { this.table.findSingleValue(sql); }});
}

exports.updateSiteForUser = function( obj, callback ) {
	
    var sql = 'update site set sitename = $2, domain = $3, agentaddress = $4, agentemail = $5, agentname = $6, agentphone = $7 where acct = $1';
    return new ModelPerformer( { parseObj: obj, 
                                 names: ['acct','sitename','domain','agentaddress','agentemail','agentname','agentphone'], 
                                 callback: callback, 
                                 performer: function(){ this.table.updateSingleRecord(sql); }} );
}

/*
    For now this performer is only useful in a chain, it eats the SUCCESS code which
    makes it useless on it's own.
*/
exports.normalizeSiteId = function(idOrHash,callback){
    var sql = "select siteid from site where siteid = $1 OR md5(''||siteid) = $2";
    return new ModelPerformer( 
        { 
            values: [ idOrHash >>> 0, ''+idOrHash ],
            callback: function( code, siteid ) {
                if( code == CODES.SUCCESS ) {
                    this.siteId = siteid;
                    // callback.apply( CODES.FOUND_SITE_ID, [code,siteid] );
                }
                else {
                    callback.apply( this, [code,siteid] );
                }
            },
            performer: function() {
                this.table.findSingleValue(sql);
            }
    });
}

exports.siteFromSiteIdOrHash = function(idOrHash,callback) {
    var sql = "select * from site where siteid = $1 OR md5(''||siteid) = $2";
    return new ModelPerformer( 
        { 
            values: [ idOrHash >>> 0, ''+idOrHash ],
            callback: callback,
            performer: function() {
                this.table.findSingleRecord(sql);
            }
        });
}