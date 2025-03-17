import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from '../routes/routes';
import vsanRoutes from '../routes/vsan';
import NotFound from '@app/pages/NotFound/NotFound';
import App from '@app/App'; // Your main app component

// Convert our route configuration to React Router v7 structure
const convertRoutesToV7 = (routesConfig, isNested = false) => {
  const result = [];

  routesConfig.forEach(route => {
    if (route.routes) {
      // Handle route groups
      route.routes.forEach(childRoute => {
        result.push({
          path: childRoute.path,
          element: <childRoute.component />,
        });
      });
    } else {
      // Handle individual routes
      result.push({
        path: route.path,
        element: <route.component />
      });
    }
  });

  return result;
};

// Create router with all routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
    children: [
      ...convertRoutesToV7(routes),
      // Add vsan routes conditionally in your app's logic
    ]
  }
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
