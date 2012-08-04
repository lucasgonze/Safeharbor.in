/* Author:
Lucas Gonze <lucas@gonze.com>
*/

var initValidation = function(){

	/* http://docs.jquery.com/Plugins/Validation#List_of_built-in_Validation_methods */
	$("#reg1form").validate({	
		rules: {
			email: {
				required: true,	
				email: true		
			},
			password: {
				required: true,
				minlength: 4
			},
			confirm: {
				required: true,						
				equalTo: "#password"		
			}	
		}
	});
	
	$("#lostpasswordform").validate({	
		rules: {
			password: {
				required: true,
				minlength: 4
			},
			confirm: {
				required: true,						
				equalTo: "#password"		
			}		
		}	
	});	

	$("form#newsite").validate({	
		rules: {
			sitename: {
				required: true
			},
			domain: {
				required: true
			},
			mailing: {
				required: true,
				minlength: 12
			},
			agentemail: {
				required: true,
				email: true
			}
		}
	});

	$("#loginform").validate({	
		rules: {
			email: {
				required: true,	
				email: true		
			},
			password: {
				required: true,
				minlength: 4
			}	
		}
	});

	$("#passwordresetform").validate({	
		rules: {
			current: {
				required: true,
				minlength: 4
			},	
			newpassword: {
				required: true,
				minlength: 4
			},	
			confirm: {
				equalTo: "#newpassword"	
			}	
		}
	});
	
	$("form#request").validate({	
		rules: {
			page: {
				required: true,
				url: true
			},	
			where: {
				// not required
			},	
			description: {
				required: true
			},	
			email: {
				email: true
			},	
			phone: {
				required: true
			},	
			country: {
				required: true
			},	
			postal: {
				required: true
			},	
			authorized: {
				required: true
			},	
			belief: {
				required: true
			},	
		},
		
		errorElement: "span",
        errorPlacement: function(error, element) { 
			error.appendTo(element.parent());
        }

	});	
	
}

// When you go into an entry field in the takedown request form, show a fairly 
// long and detailed help message. See routes/box-routes.js.
function initContextSensitiveHelp(){
	
	$("#request input, #request textarea").focus(function(){
		$(this).closest(".control-group").addClass("show-block");
	});
	$("#request input, #request textarea").blur(function(){
		$(this).closest(".control-group").removeClass("show-block");
	});

	// the .focus and .blur events above aren't triggered on checkboxes. (except
	// maybe for keyboard nav. fixme: check keyboard nav events).
	$(':checkbox, label.checkbox').hover( 
		function handlerIn(eventObject){
			$(this).closest(".control-group").addClass("show-block");
		} , function handlerOut(eventObject){
			$(this).closest(".control-group").removeClass("show-block");			
		}
	);

	// we don't do this to set focus - the autofocus attr does that. we do this 
	// because the input with autofocus won't get a focus event otherwise, and thus
	// won't show the context sensitive help.
	$("input[autofocus]").focus();

}

// client side JS specific to the takedown request pages at /box/:id 
function initInbox(){
	initContextSensitiveHelp();
	$("button#add-another-work").click(function(){
		console.log("bp");
		var newNode = $(this).closest("fieldset").find("div.control-group").get(0).cloneNode(true);
		newNode.id = "description-"+Math.ceil(Math.random() * 100000000);
		this.parentElement.insertBefore(newNode,this);
	});
}

function initAjaxForms(){

	$('#loginform').submit(function() { 
		
		$.ajax({
			type: 'POST',
			url: '/login',
			data: $("#loginform").serialize(),
			success: function success(data){
				window.location = "/dash";
			},
			error: function err(data){
				$(".hideerroruntilfail").addClass("fail");
				var clearfail = function clearfail(){
					$(".hideerroruntilfail").removeClass("fail");
					$("#loginform input[type=text], #loginform input[type=password]").off('keypress', clearfail);
				};
				$("#loginform input[type=text], #loginform input[type=password]").on('keypress', clearfail);
			}		
		});
		
		return false; 
	}); 

}

function initTour(){
	
	if( window.location.search !== "?tour" )
		return;

/* Fixme: 

Get [showControls:true] working
Fix the bug transitioning to a new URL

*/


	var tourdata = [
	{
		html: "Please set your browser to full-screen mode.",
		expose: true,
		element: "div#demo10",
		goTo: null,
		showControls:true
	}
	, {
		html: 'Imagine a web site that hosts content uploaded by its user community. As an example we will use <a href="http://etsy.com">Etsy</a>.',
		expose: true,
		element: "div#demo20",
		goTo: null
	}
	, {
		html: "The site has posted a link for copyright complaints.",
		expose: true,
		element: "div#demo30"
	}
	, {
		html: "When the link is activated, it goes to a page of legalese.",
		expose: true,
		element: "div#demo40"
	}
	, {
		html: "Our product replaces the legalese.",
		expose: true,
		element: "div#demo50",
		position: 'n'
	}
	, {
		goTo: "http://localhost:5000/box/3416a75f4cea9109507cacd8e2f2aefc?tour",
		overlayOpacity: false,
		live: 10000
	}
	, {
		html: "Clear navigation",
		expose: true,
		goTo: "/box/3416a75f4cea9109507cacd8e2f2aefc?tour",
		element: "div#splash",
		position: "n"
	}
	, {
		html: "Education by default",
		expose: true,
		element: "#learnmorebutton"
	}
	, {
		goTo: "/box/help/learn/3416a75f4cea9109507cacd8e2f2aefc?tour",
		overlayOpacity: false
	}
	, {
		html: "Save our customers time answering bogus complaints",
		expose: true,
		element: "li#Q7"
	}
	
	
	];
	var myTour = jTour(tourdata,{
			showControls: true
		});
	myTour.start();
}

$(document).ready(function() {
        initValidation();       
        initInbox();
        initAjaxForms();
        initTour();
});



