import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Product photos are plain <img> tags pointing at whichever supplier host
  // the scraper found them on, so there is no allowlist to maintain and
  // nothing for the image optimiser to do.
  images: { unoptimized: true },

  // Next 16 writes an AGENTS.md and CLAUDE.md into this folder on first boot.
  // The repository root already has the real CLAUDE.md; a second one here
  // would be picked up as project instructions and would say nothing true
  // about the scraper or the mock server.
  agentRules: false,
};

export default nextConfig;
