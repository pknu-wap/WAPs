import React, { useState } from "react";
import "whatwg-fetch";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

export default function ProjectRouter({ children }) {
  const [router] = useState(() =>
    createMemoryRouter([{ path: "*", element: children }]),
  );
  return <RouterProvider router={router} />;
}
