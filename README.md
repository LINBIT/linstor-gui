# Linstor GUI

## Development process env

```
LISNTOR_API_HOST: http://10.10.10.10:43375
GATEWAY_API_HOST: http://10.10.10.10:48080
HOST: localhost
PORT: 8000
NODE_ENV: development
```

## Development scripts

```sh
# Install development/build dependencies
npm install

# Start the development server
npm run start:dev

# Run a production build (outputs to "dist" dir)
npm run build

# Run the test suite
npm run test

# Run the test suite with coverage
npm run test:coverage

# Run the linter
npm run lint

# Run the code formatter
npm run format

# Launch a tool to inspect the bundle size
npm run bundle-profile:analyze

# Start the express server (run a production build first)
npm run start

# Start storybook component explorer
npm run storybook

# Build storybook component explorer as standalone app (outputs to "storybook-static" dir)
npm run build:storybook
```
