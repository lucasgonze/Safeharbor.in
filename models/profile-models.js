
var models = require('./index.js');
var ModelPerformer = models.ModelPerformer;

// re-export for convinience
exports.CODES = models.CODES;

exports.CODES.HANDSHAKE_EXPIRED = 'hs_expired';

/*****************************
 * Account management
 *****************************/

exports.checkAcct = function(obj,callback){
    var sql = "select acctid from acct where email = $1 and password = $2";
    
    return new ModelPerformer( {parseObj: obj, names: ['email','password'], callback: callback, performer: function() {
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

	function performer() {
//    	var sql = "select (current_timestamp - creation) > interval '1 hour' as expired from emailHandshake";
    	var sql = "select (current_timestamp - resetdate) > interval '1 hour' as expired from acct;";
        var m = this;
        function performerCallback( c, row )  {
            if( c == models.CODES.OK )
            {
                if( row.expired  )
                {
                    m.callback( models.CODES.HANDSHAKE_EXPIRED );
                    m.stopChain();
                }
                c = 'hunky';
            }
            
            m.callback( c, row );
        }
        
        this.table.findSingleRecord( sql, null, performerCallback );
    }
        
	var expireCheck = new ModelPerformer( { callback: callback, performer: performer } );
    
    //  Update the record with user supplied password

    var sql = "UPDATE acct SET password = $1 WHERE resetSecret = $2 RETURNING email";
    
    var savePass = new ModelPerformer( { parseObj: values, 
                                         names: ['password', 'resetsecret'], 
                                         callback: callback, 
                                         performer: function() { this.table.updateSingleRecord( sql ); }});

    // Chain the two together...
    
    return expireCheck.chain( savePass );
}


/* For a user who hasn't lost their password. */

exports.resetPasswordForLoggedInUser = function( obj, callback ) {
    var sql = "update acct set password = $1 where acctid = $2 and password = $3 returning acctid";
    
    return new ModelPerformer({ praseObj: obj, 
                                names: ['newpassword','userid','current'], 
                                callback: callback, 
                                performer: function() {this.table.updateSingleRecord( sql ); }
                              });    
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
	var pt1 = helper("delete from site where ownerid = $1");
	
	// PT 2: delete the user
	var pt2 = helper("delete from acct where acctid = $1 returning acctid");

    return pt1.chain(pt2);
}

exports.getSiteForUser = function(ownerid,callback){
    var sql = "select * from site where ownerid = $1";
    
    return new ModelPerformer( { values:[ownerid], 
                                 callback: callback, 
                                 performer:function() { this.table.findSingleRecord(sql); }} );
}

exports.updateSiteForUser = function( obj, callback ) {
    var sql = 'update site set sitename = $2, domain = $3, agentaddress = $4, agentemail = $5 where ownerid = $1';
    return new ModelPerformer( { parseObj: obj, 
                                 names: ['ownerid','sitename','domain','agentaddress','agentemail'], 
                                 callback: callback, 
                                 performer: function(){ this.table.updateSingleRecord(sql); }} );
}
