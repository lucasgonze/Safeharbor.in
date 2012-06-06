
var m = require('../models/reg-models.js');

m.checkForAccount( 'victord.stone@gmail.com', function( e, m ) { 
    console.log('e:');
    console.log( e );
    console.log( 'm:');
    console.log( m );
    });