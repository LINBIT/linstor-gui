yarn build:prod
ssh -p 54322 ubuntu@118.24.22.63 "rm -rf /home/ubuntu/codes/minstor/minstor-web/dist/*"
scp -P 54322 -r dist/* ubuntu@118.24.22.63:/home/ubuntu/codes/minstor/minstor-web/dist/
