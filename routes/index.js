/* This file is intended just for the router for the home page. 
 * However I can't get any other router working in its own file. 
 * For the sake of moving on I'm just putting all the routers 
 * in this file for now.
 */

// helpful for debugging
exports.nop = function(req, res) {
    res.write("<!DOCTYPE html PUBLIC \"-//W3C//DTD HTML 4.01//EN\"><html><head><title>NOP</title></head><body>NOP</body></html>");
    res.end();
};

exports.loginPost = function(req, res) {
	// this method is a stub for now. in the future we'll validate the user info and open up a session for their specific account.
	res.redirect("/dash");
//    res.render('firstrun/login.html',{layout:"firstrun/layout.html",loginStatus:"success"});
};

exports.regStep1Post = function(req, res) {
	// this method is a stub for now. in the future we'll validate the form input.
	res.redirect("/reg/step2");
};

exports.regStep4Post = function(req, res) {
	// this method is a stub for now. in the future we'll validate the form input.
	res.redirect("/reg/step5");
};



