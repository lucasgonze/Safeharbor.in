var model  = require( './index.js' );
var ModelPerformer = model.ModelPerformer;
exports.CODES = model.CODES;


/********************
/* public           *
 ********************/


exports.appendAuditLog = function( obj, callback )
{
    var sql ='INSERT INTO audit (siteid, opname, attachment) VALUES ($1,$2,$3) RETURNING auditid';
    return ModelPerformer( {parseObj:obj, names:['siteid','opname','attachment'], callback:callback, performer:
            function(){ this.table.insertSingleRecord(sql); } });
}

