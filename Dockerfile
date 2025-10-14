# syntax=docker/dockerfile:1
# Use the official Nginx image as the base image
FROM nginx:alpine

ARG LINSTOR_GUI_VERSION=v1.8.1

# Install curl and tar for fetching and extracting
RUN apk add --no-cache curl tar gettext

# Remove default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy Nginx configuration templates
COPY nginx.conf.* /etc/nginx/

# Copy the entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Set default value
ENV LB_GATEWAY_API_HOST=http://localhost:8080 \
    EXTERNAL_HTTPS_PORT=8443

# Download the corresponding tarball from github
RUN curl -L -o linstor-gui-${LINSTOR_GUI_VERSION}.tar.gz https://github.com/LINBIT/linstor-gui/releases/download/${LINSTOR_GUI_VERSION}/linstor-gui-${LINSTOR_GUI_VERSION}.tar.gz && \
    mkdir -p /usr/share/nginx/html && \
    tar -xzf linstor-gui-${LINSTOR_GUI_VERSION}.tar.gz -C /usr/share/nginx/html && \
    rm linstor-gui-${LINSTOR_GUI_VERSION}.tar.gz

# Expose http and https port
EXPOSE 8080 8443

# Use the entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
