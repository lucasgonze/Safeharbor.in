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
	
	if( window.location.pathname !== "/demo" && window.location.search !== "?tour" )
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
		goTo: null
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
		goTo: "/box/3416a75f4cea9109507cacd8e2f2aefc?tour",
	}
	, {
		html: "Human-friendly navigation",
		expose: true,
		element: "div#splash",
		position: "n"
	}
	, {
		html: "Education",
		expose: true,
		element: "a#learnmorebutton",
		position: "n",
		goTo: "/box/help/learn/3416a75f4cea9109507cacd8e2f2aefc?tour"
	}
	, {	
		overlayOpacity: false,
		element: "li#Q7 h4",
		position: "e",
		expose: true,
		html: "Prevent complaints that aren't about copyright."
	}
	, {		
		element: "li#Q5 h4",
		overlayOpacity: false,
		html: "Pre-written answers to standard questions",
		expose: true,
		position: "e",
		goTo: "/box/3416a75f4cea9109507cacd8e2f2aefc?tour"
	}, {
		element: "img.sitelogo",
		expose: true,
		position: "e",
		html: "Easy customization: just set logo."
	}, {
		element: "#haslowerborder a",
		expose: true,
		position: "s",
		html: "Prevent frivolous complaints by setting serious tone."
	}, {
		"html": "And all this is BEFORE the main act",
		element: "a#submitbutton",
		position: "n",
		goTo: "/box/role/3416a75f4cea9109507cacd8e2f2aefc?tour"
	}, {
		html: "Focus newbies attention when necessary",
		live: 100000,
		element: "#Q4",
		goTo: "/box/form/3416a75f4cea9109507cacd8e2f2aefc?tour&person-type=co"
	}, {
		expose: true,
		html: "Usability instead of legalese"
	}
		
	
	];
	var myTour = jTour(tourdata,{
			showControls: true,
			showProgress: true,
			autostart: true
		});
	myTour.start();
}

$(document).ready(function() {
        initValidation();       
        initInbox();
        initAjaxForms();
        initTour();
});



