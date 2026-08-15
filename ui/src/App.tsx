// SPDX-FileCopyrightText: Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Main App component for the Shopping Assistant
 */

import React, { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./components/Navbar";
import Apparel from "./components/Apparel";
import Chatbox from "./components/chatbox/chatbox";
import Tutorials from "./components/tutorials/Tutorials";
import Catalog from "./components/catalog/Catalog";
import ChatWidget from "./components/catalog/ChatWidget";

const App: React.FC = () => {
  const [newRenderImage, setNewRenderImage] = useState<string>("");

  // The `future` flags opt in early to the two v7 behaviours react-router warns
  // about on boot, so the console stays quiet and the eventual upgrade is a
  // version bump rather than a behaviour change.
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <div className="bg-[#FFFFFF] flex flex-col h-screen w-screen">
        {/* The page footer (Contact us / Guidelines / Privacy policy) was removed
            so the full height below the navbar belongs to the content. */}
        <Navbar />

        <Routes>
          {/* Browsing is the front door. The 2,880 scraped products were
              previously reachable only by knowing what to ask the assistant
              for; the catalogue takes the full width and the assistant becomes
              a launcher in the corner. */}
          <Route
            path="/"
            element={
              <>
                <Catalog />
                <ChatWidget setNewRenderImage={setNewRenderImage} />
              </>
            }
          />
          <Route
            path="/catalog/:category"
            element={
              <>
                <Catalog />
                <ChatWidget setNewRenderImage={setNewRenderImage} />
              </>
            }
          />

          {/* Tutorials takes the full width: a filter rail plus a three-up grid
              does not fit the 40vw pane, and browsing is the job on that screen. */}
          <Route path="/tutorials" element={<Tutorials />} />

          {/* The original chat-led screen, unchanged: the full-height panel
              beside the splash image that image upload renders into. */}
          <Route
            path="/assistant"
            element={
              <>
                <Apparel newRenderImage={newRenderImage} />
                <Chatbox setNewRenderImage={setNewRenderImage} />
              </>
            }
          />
        </Routes>

        <ToastContainer position="top-right" />
      </div>
    </BrowserRouter>
  );
};

export default App;
