// SPDX-FileCopyrightText: Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Root layout. Replaces public/index.html and App.tsx from the Create React
 * App build: the document shell, the fonts, the navbar that every route
 * shares, and the providers.
 */

import type { Metadata, Viewport } from "next";
import React from "react";

import "../index.css";
import "../chatbox.css";

import Navbar from "../components/Navbar";
import Providers from "./providers";
import { config } from "../config/config";

export const metadata: Metadata = {
  title: config.ui.brand,
  description:
    "A unified web aggregation platform for educational and industrial robots.",
  icons: { icon: "/favicon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/*
          Lato, the typeface the catalogue's reference layout is set in. It is
          under the SIL Open Font License, so unlike NVIDIA Sans it can be used
          here. See DESIGN.md section 9.

          IBM Plex Mono is the first name in the mono stack DESIGN.md section 2
          prescribes for figures. Plex was drawn for engineering documentation,
          which is what a parts catalogue is.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <div className="bg-[#FFFFFF] flex flex-col h-screen w-screen">
            {/* The page footer (Contact us / Guidelines / Privacy policy) was
                removed so the full height below the navbar belongs to the
                content. */}
            <Navbar />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
