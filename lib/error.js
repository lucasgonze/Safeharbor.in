
/* Utilities related to error handling */

exports.render = function(res,msg,code,debugInfo){
	console.log("Error handler in lib/error/render invoked.");
	if( typeof debugInfo !== "undefined" ){
		console.log("debugInfo:");		
		console.log(debugInfo);	
		console.trace("*** Stack trace to help locate the error. ***")	
	}
	console.log(msg);
	
	res.render('error/error.html',{layout:'global.html',pageTitle:'Error','bodyClass':'error',message:msg,code:code});
	
	return false;
};


