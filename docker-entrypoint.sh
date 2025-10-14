#!/bin/sh
set -e

# Use correct Nginx config http or https
if [ -e /opt/ssl/linstor-gui.crt ]; then
    NGINX_TEMPLATE_FILE=/etc/nginx/nginx.conf.ssl.template
else
    NGINX_TEMPLATE_FILE=/etc/nginx/nginx.conf.template
fi

# Replace placeholders in the Nginx config template
envsubst "$(env | sed -e 's/=.*//' -e 's/^/$/g')" < ${NGINX_TEMPLATE_FILE} > /etc/nginx/nginx.conf.tmp

# Use awk to replace the placeholder values
awk '{
    gsub(/__LB_LINSTOR_API_HOST__/, ENVIRON["LB_LINSTOR_API_HOST"]);
    gsub(/__LB_GATEWAY_API_HOST__/, ENVIRON["LB_GATEWAY_API_HOST"]);
    gsub(/__EXTERNAL_HTTPS_PORT__/, ENVIRON["EXTERNAL_HTTPS_PORT"]);
    print
}' /etc/nginx/nginx.conf.tmp > /etc/nginx/nginx.conf

# Remove the temporary file
rm /etc/nginx/nginx.conf.tmp

# Start Nginx
exec nginx -g 'daemon off;'
