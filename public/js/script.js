/* Author:
Lucas Gonze <lucas@gonze.com>
*/

$(document).ready(function() {

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
	
});


