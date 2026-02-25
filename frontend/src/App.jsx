import React from "react";
import {
  createBrowserRouter,
  RouterProvider
} from "react-router";

import Blogs from "./Components/Blogs";
import Auth from "./Components/Auth";
import Dashborad from "../src/Admin/Dashboard";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Blogs />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
       path:"/dashboard",
       element:<Dashborad />
  }
     
]);

const App = () => {
  return (
    <RouterProvider router={router} />
  );
};

export default App;