/*
 * SPDX-FileCopyrightText: Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Navigation bar component
 */

import React from "react";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, NavLink } from "react-router-dom";
import { config } from "../config/config";

/** "MOTORS & ACTUATORS" -> "motors-and-actuators", which Catalog reverses. */
export const categorySlug = (category: string): string =>
  category.toLowerCase().replace(/&/g, "and").trim().replace(/\s+/g, "-");

const Navbar: React.FC = () => {
  const { brand, categories } = config.ui;

  // The category links used to be dead `#`s. They now filter the catalogue,
  // which is what the query string in /catalog/:category carries.
  // `whitespace-nowrap` matters: the strip is a fixed 57px, so a label that
  // wraps to two lines breaks the bar rather than growing it.
  const linkClass = (isActive: boolean) =>
    "shrink-0 whitespace-nowrap text-[15px] font-medium " +
    (isActive ? "text-[#000] underline" : "text-[#666] hover:underline");

  return (
    <div>
      {/* Main navigation bar */}
      <div className="bg-[#FFFFFF] h-[48px] px-3 py-2 lg:px-5 text-white flex justify-between items-center">
        {/* Left side - Menu and Brand */}
        <div className="flex items-center shrink-0">
          <MenuIcon sx={{ color: "#5E5E5E" }} fontSize="small" />
          <Link
            to="/"
            className="text-[22px] ml-[20px] font-bold text-[#202020] no-underline"
          >
            {brand}
          </Link>
        </div>

        {/* Right side - Welcome message */}
        <div className="flex items-center gap-x-2">
          <div className="flex items-center gap-2 p-3 rounded-full">
            <p className="text-[14px] text-[#202020]">Welcome!</p>
          </div>
        </div>
      </div>

      {/* Categories bar */}
      <nav className="nav-strip bg-[#F2F2F2] mt-[1px] h-[57px] px-3 py-2 lg:px-8 flex items-center gap-5 lg:gap-8 overflow-x-auto">
        {categories.map((category) => (
          <NavLink
            key={category}
            to={`/catalog/${categorySlug(category)}`}
            className={({ isActive }) => linkClass(isActive)}
          >
            {category}
          </NavLink>
        ))}

        {/* Pushed to the far end: tutorials are a different kind of thing from
            a product category, and the gap says so. */}
        <NavLink
          to="/tutorials"
          className={({ isActive }) => "ml-auto " + linkClass(isActive)}
        >
          TUTORIALS
        </NavLink>
      </nav>
    </div>
  );
};

export default Navbar;
