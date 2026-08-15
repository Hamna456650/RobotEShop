// SPDX-FileCopyrightText: Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Main App component for the Shopping Assistant
 */

import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./components/Navbar";
import Apparel from "./components/Apparel";
import Chatbox from "./components/chatbox/chatbox";

const App: React.FC = () => {
  const [newRenderImage, setNewRenderImage] = useState<string>("");

  return (
    <div className="bg-[#FFFFFF] flex flex-col h-screen w-screen">
      {/* The page footer (Contact us / Guidelines / Privacy policy) was removed
          so the full height below the navbar belongs to the chat. */}
      <Navbar />
      <Apparel newRenderImage={newRenderImage} />
      <Chatbox setNewRenderImage={setNewRenderImage} />
      <ToastContainer position="top-right" />
    </div>
  );
};

export default App;
