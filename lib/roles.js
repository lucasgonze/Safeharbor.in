var ROLES = exports.ROLES = {

    developer:     1, // all access

    admin:         2, // employees of safe harbor 
                      // edit/delete user accounts, etc.
                      
    marketing:     3, // employees of safe harbor, 
                      // edit text, logos, etc.
    
    
    logged_in:     21, // this url ok for anybody logged in
                       // like 'reset password'
        
    not_logged_in: 22, // this url meant only for people not logged in
                       // like 'lost password'
    
    owner:         23, // this url only ok for owner of specific acct
                       // implies "logged_in"
    
    
    no_user:        1000
    
};
