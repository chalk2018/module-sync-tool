#!/bin/sh
# source /etc/profile
target_workspace=$1
cd $1
pwd
git pull
git add .
git commit . -m "'$3'"
git push
