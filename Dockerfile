# Use the official Nginx image as the base image
FROM nginx:alpine

# Install envsubst and other utilities
RUN apk add --no-cache gettext

# Remove default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy the Nginx configuration template
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# Copy the static files
COPY dist /usr/share/nginx/html

# Copy the entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 8000
EXPOSE 8000

# Set default value for LB_GATEWAY_API_HOST
ENV LB_GATEWAY_API_HOST=http://localhost:8080

# Use the entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
