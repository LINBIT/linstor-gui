# Use the official Nginx image as the base image
FROM nginx:alpine

# Install curl, jq, and tar for fetching, parsing, and extracting
RUN apk add --no-cache git curl tar gettext

# Remove default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy the Nginx configuration template
COPY nginx.conf.template /etc/nginx/nginx.conf.template

COPY . .

# Copy the entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Set default value for LB_GATEWAY_API_HOST
ENV LB_GATEWAY_API_HOST=http://localhost:8080

# Download the corresponding tarball
RUN LATEST_TAG=$(git describe --tags --abbrev=0 | sed 's/^v//') && \
    echo "Latest Tag: $LATEST_TAG" && \
    curl -L -o linstor-gui-$LATEST_TAG.tar.gz  https://pkg.linbit.com/downloads/linstor/linstor-gui-$LATEST_TAG.tar.gz && \
    mkdir -p /usr/share/nginx/html && \
    tar -xzf linstor-gui-$LATEST_TAG.tar.gz -C /usr/share/nginx/html --strip-components=2 && \
    rm linstor-gui-$LATEST_TAG.tar.gz

# Expose port 3373
EXPOSE 3373

# Use the entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
