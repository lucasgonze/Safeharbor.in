var debug = require('../lib/debug.js');
var models = require('./index.js');
var ROLES = require('../lib/roles.js').ROLES;
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
    var sql1   = 'insert into acct (email,password,role) ' +
                     ' select email, password,  ' + ROLES.logged_in +
                     ' from emailHandshake where regid = $1 returning acctid';
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
    debug.setVolume(1);   
    var sql = "insert into site (acct,sitename,domain,agentaddress,agentemail) values($1,$2,$3,$4,$5) returning md5(concat('',siteid)) as regid";
    var args = ['acctid', 'sitename','domain','agentaddress','agentemail'];
    return new ModelPerformer( 
        { 
            callback: callback, 
            performer: function() {
                if( !obj.acctid )
                    obj.acctid = this.findValue('acctid');
                var vals = this._parseValues(obj,args);
                this.table.insertSingleRecord(sql,vals);
            }
    });
}

