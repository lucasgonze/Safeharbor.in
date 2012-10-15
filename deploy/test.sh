#!/bin/bash

if [ "$1" == "" ]
then
	echo "Missing HOST:PORT argument"
	exit 1
fi

HOST=$1
EXITSTATUS=0

COOKIEFILE=/tmp/cookie.test
COOKIES="--cookie-jar $COOKIEFILE --cookie $COOKIEFILE"
if [ -f $COOKIEFILE ]
	then
	rm $COOKIEFILE
fi

function runtest {
	URL=$1
	EXPECTSTATUS=$2

	if [ "$3" != "" ]
		then
		POSTDATA="--data $3"
	else
		POSTDATA=
	fi

	set -xv
	curl -v --include $COOKIES $POSTDATA "http://$HOST/$URL" | tee | head -1 | grep $EXPECTSTATUS
	STATUS=$?
	set +xv
		
	if [ $STATUS == 0 ]
	then
		echo PASS
	else
		echo FAIL $1
		EXITSTATUS=`echo $(($EXITSTATUS + 1))`
		exit $EXITSTATUS
	fi
	echo "******************************************************"
}

# baseline
runtest test/nop 204

# GET should just return the page
runtest login 200
# POST with wrong password should throw Forbidden
runtest login 403 'email=wrong&password=wrong'
# POST with right password redirects to your personalized home page
runtest login 303 'email=lucas@gonze.com&password=abcd' 
# verify that you stayed logged-in across requests
runtest test/loggedin 204 

# logging out should redirect you to /login on success
runtest logout 303 'method=post'
# check it in two different ways
runtest test/loggedout 204
runtest test/loggedin 302 

# check role "admin"
runtest login 303 'email=adminuser@safeharbor.in&password=abcd'; runtest test/admin 204
runtest login 303 'email=loggedinuser@safeharbor.in&password=abcd'; runtest test/admin 403

# check error handlers
runtest test/500 500
runtest test/404 404
runtest test/runtimeException 500

# GET on creating a new site should not cooperate
runtest newsite 404

echo
echo "======================================================"
echo "Failed test count: $EXITSTATUS"
exit $EXITSTATUS

