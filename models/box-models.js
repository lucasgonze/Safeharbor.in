
var models = require('./index.js');
var ModelPerformer = models.ModelPerformer;

// re-export
exports.CODES = models.CODES;

exports.get = function(siteid,callback){
    return new ModelPerformer( { values: [siteid], callback: callback, performer: function() {
        this.table.findSingleRecord('select * from site, acct where site.ownerid = acct.id AND id = $1');
    }});
}

