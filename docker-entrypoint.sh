#!/bin/sh
set -e

# Replace placeholders in the Nginx config template
envsubst "$(env | sed -e 's/=.*//' -e 's/^/$/g')" < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf.tmp

# Use awk to replace the placeholder values
awk '{
    gsub(/LB_LINSTOR_API_HOST/, ENVIRON["LB_LINSTOR_API_HOST"]);
    gsub(/LB_GATEWAY_API_HOST/, ENVIRON["LB_GATEWAY_API_HOST"]);
    print
}' /etc/nginx/nginx.conf.tmp > /etc/nginx/nginx.conf

# Remove the temporary file
rm /etc/nginx/nginx.conf.tmp

# Start Nginx
exec nginx -g 'daemon off;'
