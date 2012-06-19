
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

exports.checkForHandshake = function(regid,callback){
    var sql = "select * from emailHandshake where regid = $1";
    return new ModelPerformer( { values: [regid],
                                 callback: callback,
                                 performer: function() { this.table.findSingleRecord(sql); } } );
}

exports.checkForAccount = function(email,callback){
    var sql = "select acctid from acct where email = $1";
    return new ModelPerformer( { values: [email], 
                                 callback: callback, 
                                 performer: function() { this.table.findSingleRecord(sql); } } );
}

exports.initEmailConfirmation = function(obj,callback){
    var sql = 'INSERT INTO emailHandshake(email,password,regid) VALUES($1,$2,$3) returning regid';
    obj.regid = getSecureUniquePublicID();
    return new ModelPerformer( { parseObj: obj, 
                                 names: ['email','password','regid'], 
                                 callback: callback, 
                                 performer: function() { this.table.insertSingleRecord(sql); } } );
}

exports.handshakeEmailConfirmation = function(regid,callback){
    var sql  = 'select email,password from emailHandshake where regid = $1';
    var find = new ModelPerformer( { values: [regid], 
                                     callback: callback, 
                                     performer: function() { this.table.findSingleRecord(sql); } });
    var sql2 = 'delete from emailHandshake where regid = $1'
    var nuke = new ModelPerformer( { values: [regid], 
                                     callback: callback, 
                                     performer: function() { this.table.deleteSingleRecord(sql2); } } );

    return find.chain( nuke );
}

exports.createAcct = function(regid,callback){
    var sql1   = 'insert into acct (email,password) select email, password from emailHandshake where regid = $1 returning acctid';
    var insert = new ModelPerformer( { values: [regid], 
                                       callback: callback, 
                                       performer: function() { this.table.insertSingleRecord(sql1); } } );
    var sql2   = 'delete from emailHandshake where regid = $1';
    var delhs  = new ModelPerformer( { values: [regid], 
                                       callback: callback, 
                                       performer: function() { this.table.deleteSingleRecord(sql2); } } );
    
    return insert.chain( delhs );
}

exports.createSite = function(obj,callback){
    var sql = 'insert into site (ownerid,sitename,domain,agentaddress,agentemail) values($1,$2,$3,$4,$5) returning siteid';
    var args = ['acctid', 'sitename','domain','agentaddress','agentemail'];
    return new ModelPerformer( 
        { 
            callback: callback, 
            performer: function() {
                if( !obj.acctid )
                    obj.acctid = this.findValue('acctid');
                var vals = this._parseValues(obj,args);
                console.log('VALS', vals);
                this.table.insertSingleRecord(sql,vals);
            }
    });
}

