
// These are arranged as supersets. If role A < role B, it has the same permissions as well as additional ones.

// note that there's needless complexity here. We just need admin and logged in, I think.

exports.developer =     1; // all access
exports.admin =         2; // employees of safe harbor 
                          // edit/delete user accounts; etc.                      

exports.logged_in =     21; // this url ok for anybody logged in
                           // like 'reset password'
    
exports.not_logged_in = 22; // this url meant only for people not logged in
                           // like 'lost password'

exports.owner =         23; // this url only ok for owner of specific acct
                           // implies "logged_in"


exports.no_user =        1000;

