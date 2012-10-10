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
	set +xv
	
	if [ $? == 0 ]
	then
		echo PASS
	else
		echo FAIL $1
		EXITSTATUS=`echo $(($EXITSTATUS + 1))`
		exit $EXITSTATUS
	fi
	echo "******************************************************"
}

runtest test/nop 204
runtest test/notloggedin 204
runtest test/loggedin 302 
runtest login 200
runtest login 403 'email=wrong&password=wrong'
runtest login 303 'email=lucas@gonze.com&password=abcd' 
runtest test/loggedin 204 

runtest login 303 'email=adminuser@safeharbor.in&password=abcd'; runtest test/admin 204
runtest login 303 'email=loggedinuser@safeharbor.in&passwordabcd'; runtest test/admin 403

echo
echo "======================================================"
echo "Failed test count: $EXITSTATUS"
exit $EXITSTATUS

