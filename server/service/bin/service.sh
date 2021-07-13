#!/bin/bash

###
# chkconfig: 345 20 80
# description: Vert.x application service script
# processname: java
#
# Installation (CentOS):
# copy file to /etc/init.d
# chmod +x /etc/init.d/my-vertx-application
# chkconfig --add /etc/init.d/my-vertx-application
# chkconfig my-vertx-application on
#
# Installation (Ubuntu):
# copy file to /etc/init.d
# chmod +x /etc/init.d/my-vertx-application
# update-rc.d my-vertx-application defaults
#
#
# Usage: (as root)
# service my-vertx-application start
# service my-vertx-application stop
# service my-vertx-application status
#
###

# colors


red='\e[0;31m'
green='\e[0;32m'
yellow='\e[0;33m'
reset='\e[0m'

echoRed() { echo  "${red}$1${reset}"; }
echoGreen() { echo  "${green}$1${reset}"; }
echoYellow() { echo  "${yellow}$1${reset}"; }

DEFAULT_COMMAND="facade-app.jar --spring.profiles.active=dev"
APPLICATION_DIR=$(cd `dirname $0`; pwd)
APPLICATION_NAME=${APPLICATION_DIR##*/}
OUT_FILE=/dev/null
RUNNING_PID="${APPLICATION_DIR}"/RUNNING_PID
FACADE_NAME="${DEFAULT_COMMAND}"


isRunning() {
  # Check for running app
  if [ -f "$RUNNING_PID" ]; then
    proc=$(cat ${RUNNING_PID});
    if /bin/ps --pid ${proc} 1>&2 >/dev/null; then
      return 0
    fi
  fi
  return 1
}


start() {
  if isRunning; then
    echoYellow "The $APPLICATION_NAME is already running"
    return 0
  fi 
  nohup java -jar ${FACADE_NAME}  > ${OUT_FILE} 2>&1 &
  echoGreen "command: nohup java -jar ${FACADE_NAME}  > ${OUT_FILE} 2>&1 &"
  echo $! > ${RUNNING_PID}

  if isRunning; then
    echoGreen "$APPLICATION_NAME started"
    return 0
  else
    echoRed "$APPLICATION_NAME has not started - check log"
    return 1
  fi
}

restart() {
  echo "Restarting $APPLICATION_NAME"
  stop
  start
  return 0
}

stop() {
  echoYellow "Stopping $APPLICATION_NAME"
  if isRunning; then
    kill `cat ${RUNNING_PID}`
        while kill -0 `cat ${RUNNING_PID}` 2> /dev/null;
        do
        echoYellow "wait ${APPLICATION_NAME} stop";
        sleep 1;
        done
    rm ${RUNNING_PID}
  fi
}

status() {
  if isRunning; then
    echoGreen "$APPLICATION_NAME is running"
  else
    echoRed "$APPLICATION_NAME is either stopped or inaccessible"
  fi
}


usage() {
    echo "Usage:"
    echo "  test.sh [-j] [-f FACADE_NAME] [-o OUT_FILE] {start|status|stop|restart}"
    echo "Description:"
    echo "    -j jenkins environment"
    echo "    -f jar and args [default: facade-app.jar --spring.profiles.active=dev]"
    echo "    -o out file [default:/dev/null]"
    exit -1
}



while getopts "jf:o:" opt; do
  case ${opt} in
    j)
      BUILD_ID="${APPLICATION_DIR}"
      echoGreen "Enable Jenkins BUILD_ID=${APPLICATION_DIR} "
      ;;
    f)
      FACADE_NAME=$OPTARG
      echoGreen "Enable FACADE_NAME=${FACADE_NAME} "
      ;;
    o)
      OUT_FILE=$OPTARG
      echoGreen "Enable OUT_FILE=${OUT_FILE} "
      ;;
    \?)
      echoRed "Invalid option: -$OPTARG"
      exit 1
      ;;
    :)
      usage
      exit 1
      ;;
  esac
done


shift $(($OPTIND - 1))

case $1 in
    start)
        if start; then
            exit 0
        else
            exit 3
        fi
    ;;

    status)
       status
       exit 0
    ;;

    stop)
        if isRunning; then
            stop
            exit 0
        else
            echoRed "$APPLICATION_NAME not running"
            exit 0
        fi
    ;;

    restart)
        if restart; then
            exit 0
        else
            exit 3
        fi
    ;;

    *)
        usage
        exit 1
    ;;
esac
