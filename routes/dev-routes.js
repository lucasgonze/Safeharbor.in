

exports.install = function( app )
{
    // helpful for debugging
    
	app.get('/nop', function(req, res) {
        console.log('req.session: ')
        console.log(req.session);
        require('../lib/loginstate.js').logstate(req);
        res.write('<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN"><html><head><title>NOP</title></head><body>NOP</body></html>');
        res.end();
    });
}