
var models = require('./index.js');
var ModelPerformer = models.ModelPerformer;

// re-export for convinience
exports.CODES = models.CODES;

/*****************************
 * Account management
 *****************************/

exports.checkAcct = function(obj,callback){
    var sql = "select id from acct where email = $1 and password = $2";
    
    return new ModelPerformer( {parseObj: obj, names: ['email','password'], callback: callback, performer: function() {
        this.table.findSingleRecord( sql );
    }}); 
}

exports.initPasswordReset = function(email,callback) {
    var sql = "update acct set resetSecret = substring(md5(random()::text) from 2 for 10), resetDate = now() where email = $1 returning resetSecret";

    return new ModelPerformer( { values: [email], callback: callback, performer: function() {
        this.table.UpdateSingleRecord( sql );
    }});
}

exports.HANDSHAKE_EXPIRED = 'hsexpired';

exports.saveNewPassword = function(obj,callback) {

    //  Update the record with user supplied password

    var sql = "UPDATE acct SET password = $1 WHERE resetSecret = $2 RETURNING email";
    
    var savePass = new ModelPerformer( { parseObject: obj, names: ['newPassword', 'resetSecret'], 
        callback: callback, performer: function() {
            this.table.UpdateSingleRecord( sql );
        }});

    // ...but first... make sure the handshake hasn't expired

	sql = 'SELECT IF( creation > (current_time - interval "1 hour"), 1, 0 ) AS expired FROM emailHandshake RETURNING expired';
	
	var expireCheck = new ModelPerformer( {callback: callback, performer: function() {
                var m = this;
                this.table.findSingleRecord( sql, null, function(c,expired) {
                    if( c == model.CODES.OK && expired )
                    {
                        m.callback( exports.HANDSHAKE_EXPIRED );
                        m.stopChain();
                    }
                });
            }});
    
    // Chain the two together...
    
    return expireCheck.chain( savePass );
}


/* For a user who hasn't lost their password. */

exports.resetPasswordForLoggedInUser = function( obj, callback ) {
    var sql = "update acct set password = $1 where id = $2 and password = $3 returning id";
    
    return new ModelPerformer({ praseObj: obj, names: ['newpassword','userid','current'], callback: callback, 
        performer: function() {
            this.table.UpdateSingleRecord( sql );
        }});    
}

exports.deleteAccount = function(userid,callback){
	
	function helper(sql) {
        return new ModelPerformer( { values: [userid], 
                                     callback: callback, 
                                     performer: function() { this.table.DeleteSingleRecord(sql); }
                                    } 
                                );
    }

	// PT 1: delete any sites owned by this user
	// (in the future when there are multiple accounts per site this will become more complex)
	var pt1 = helper("delete from site where ownerid = $1");
	
	// PT 2: delete the user
	var pt2 = helper("delete from acct where id = $1 returning id");

    return pt1.chain(pt2);
}

exports.getSiteForUser = function(ownerid,callback){
    var sql = "select *, oid from site where ownerid = $1";
    
    return new ModelPerformer( {values:[ownerid], callback: callback, performer:function() { this.table.findSingleRecord(sql); }} );
}

exports.updateSiteForUser = function( obj, callback ) {
    var sql = 'update site set sitename = $2, domain = $3, agentaddress = $4, agentemail = $5 where ownerid = $1';
    var args = ['owernerid','sitename','domain','agentaddress','agentemail'];

    return new ModelPerformer( {parseObj: obj, names: args, callback: callback, performer: function(){ this.table.UpdateSingleRecord(sql); }} );
}
