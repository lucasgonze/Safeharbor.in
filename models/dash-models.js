var ac     = require( './actions.js');
var model  = require( './index.js' );
var ModelPerformer = model.ModelPerformer;



/********************
/* public           *
 ********************/


exports.appendAuditLog = function( obj, callback )
{
    var sql ='INSERT INTO audit (siteid, opname, attachment) VALUES ($1,$2,$3) RETURNING id';
    return ModelPerformer( {parseObj:obj, names:['siteid','opname','attachment'], callback:callback, performer:
            function(){ this.table.insertSingleRecord(sql); } });
}

