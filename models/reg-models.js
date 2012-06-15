
var models = require('./index.js');
var ModelPerformer = models.ModelPerformer;
var CODES = exports.CODES = models.CODES;

/*****************************
 * Account Creation
 *****************************/

function getSecureUniquePublicID(){
	var id = Math.floor((Math.random()*10000000)+1);
	return(""+id);
}

exports.checkForAccount = function(email,callback){
    var sql = "select acctid from acct where email = $1";
    return new ModelPerformer( { values: [email], callback: callback, performer: function() { this.table.findSingleRecord(sql); } } );
}

exports.initEmailConfirmation = function(obj,callback){
    var sql = 'INSERT INTO emailHandshake(email,password) VALUES($1,$2) returning regid';
    return new ModelPerformer( { parseObj: obj, names: ['email','password'], callback: callback, performer: function() { this.table.insertSingleRecord(sql); } } );
}

exports.handshakeEmailConfirmation = function(regid,callback){
    var sql  = 'select email,password from emailHandshake where regid = $1';
    var find = new ModelPerformer( { values: [regid], callback: callback, performer: function() { this.table.findSingleRecord(sql); } });
    var sql2 = 'delete from emailHandshake where regid = $1'
    var nuke = new ModelPerformer( { values: [regid], callback: callback, performer: function() { this.table.deleteSingleRecord(sql2); } } );

    return find.chain( nuke );
}

exports.createAcct = function(regid,callback){
    var sql1   = 'insert into acct (email,password) select email, password from emailHandshake where regid = $1 returning acctid';
    var insert = new ModelPerformer( { values: regid, callback: callback, performer: function() { this.table.insertSingleRecord(sql1); } } );
    var sql2   = 'delete from emailHandshake where regid = $1';
    var delhs  = new ModelPerformer( { values: [regid], callback: callback, performer: function() { this.this.deleteSingleRecord(sql2); } } );
    
    return insert.chain( delhs );
}

exports.createSite = function(obj,callback){
    var sql = 'insert into site (ownerid,sitename,domain,agentaddress,agentemail) values($1,$2,$3,$4,$5) returning siteid';
    var args = ['sitename','domain','agentaddress','agentemail'];
    // the acctId might have been passed in inline
    if( obj.hasOwnProperty( 'acctid' ) )
        args.unshift['acctid'];
    return new ModelPerformer( 
        { 
            parseObj: obj,
            names:    args,
            callback: callback, 
            performer: function() {
                var args = this.values;
                // the acctid might have come from a previous performer in the chain
                if( this.prev && this.prev.acctid )
                    args.unshift(this.prev.acctid);
                this.table.insertSingleRecord(sql,args);
            }
    });
}

