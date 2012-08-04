$(window).load(function() {
	setTimeout(function(){					
var loc = window.location;
	if(loc != window.top.location) return false;
	
	window.document.write('<html lang="en-us"><head><meta charset="utf-8"><script src="//ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script></head><body><iframe id="iframe" src="'+loc+'" width="100%" height="600px" frameborder="0">asd</iframe></body></html>');
	window.stop();
	//alert(typeof jQuery);
		console.log($('#iframe'));
		//console.log($('#iframe').contents());
	},5000);
});