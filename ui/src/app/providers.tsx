"use client";

/**
 * Everything the root layout mounts that needs to be a client component:
 * the cross-route render-image state and the toast outlet. The layout itself
 * stays a server component so the <html> shell and metadata are static.
 */

import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { RenderImageProvider } from "../context/RenderImageContext";

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RenderImageProvider>
    {children}
    <ToastContainer position="top-right" />
  </RenderImageProvider>
);

export default Providers;
