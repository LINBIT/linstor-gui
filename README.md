
## Stack

- vue
- [vue-admin](https://panjiachen.github.io/vue-element-admin-site/zh/)

## Dev

```bash

# Install dependencies
npm install

npm install 

# Start Dev Server
npm run dev
```

Visit http://localhost:9527

## Deploy

Change `VUE_APP_BASE_API` of `.env.production` to ''(port `80` of the same host) or API service address

```bash

# Build for production
npm run build:prod

# dist
```

Copy or move `dist` to Web Server (Nginx, Apache) `root` 

More Info on [Doc](https://panjiachen.github.io/vue-element-admin-site/)
