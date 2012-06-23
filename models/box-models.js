
var models = require('./index.js');
var ModelPerformer = models.ModelPerformer;

// re-export
exports.CODES = models.CODES;

exports.get = function(siteid,callback){
    return new ModelPerformer( { values: [ parseInt(siteid) || 0, siteid], callback: callback, performer: function() {
        this.table.findSingleRecord("select *, md5(concat('',siteid)) as idhash from site, acct where acct = acctid AND (siteid = $1 OR md5(concat('',siteid)) = $2)");
    }});
}

