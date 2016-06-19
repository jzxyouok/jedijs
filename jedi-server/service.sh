#/bin/sh

forever="/user/local/bin/forever";
index="/index.js";

cmd="";

case "$1" in
	start )
		cmd="start";;
	stop )
		cmd="stop";;
	restart )
		cmd="restart";;
esac

if [ "${cmd}" = "" ]; then
	echo "Please input cmd.";
	exit 1;
fi

fullCmd=${forever}" "${cmd}" "${index};

$fullCmd;
