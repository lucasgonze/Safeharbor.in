
/* Utilities related to error handling */

exports.render = function(res,msg,code){
	res.render('error/error.html',{layout:'global.html',pageTitle:'Error','bodyClass':'error',message:msg,code:code});
};


