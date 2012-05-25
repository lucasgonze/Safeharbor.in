
var models = require("../models/profile-models.js");

try {
	
	var client = require('../models').getClient();
    client.query("delete from acct where email = 'testval@example.com'");

	var query = client.query("insert into acct (email,password) values('testval@example.com','1234') returning id");
	query.on('error',function(err){
		console.log('this is my error handler');
		console.log(err);
		throw({foo:'bar','err':err});
	})

    query.on('row',
    function(row) {
        console.log("BP %");
        console.log(row);
        deleteAccount(row.id,
        function(err, result) {
            console.log("BP $");
            assert(!err);
            console.log(err);
            console.log(result);
            assert.equal(err, false, "Deletion failed")
        })

    });

} catch(e) {
	console.log("in exception handler");
	console.log(e);
	}
 finally {
    console.log('I am alerted regardless of the outcome above')
}

