// SPDX-FileCopyrightText: Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Type definitions for the Shopping Assistant UI
 */

export interface MessageData {
  role: MessageRole;
  content: string | ImageContent | ImageRowContent | RobotRowContent;
  productName: string;
}

export type MessageRole =
  | 'user'
  | 'assistant'
  | 'system'
  | 'image'
  | 'image_row'
  | 'product_row'
  | 'user_image';

/** A seller offering a robot, for price comparison across vendors. */
export interface RobotSeller {
  name: string;
  price: number;
  verified: boolean;
}

/**
 * A robot as shown on a result card. Mirrors the `products` payload from the
 * chain server; see mock-server/robots.json for the full catalogue record.
 */
export interface RobotCard {
  id: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  price: number;
  priceLabel: string;
  offerCount: number;
  verified: boolean;
  ageMin?: number;
  ageMax?: number;
  skill: string;
  platforms: string[];
  languages: string[];
  os: string[];
  ros: string | null;
  dof?: number;
  tutorials: number;
  sellers: RobotSeller[];
}

export interface RobotRowContent extends Array<RobotCard> {}

export interface ImageContent {
  productUrl: string;
  productName: string;
}

export interface ImageRowContent extends Array<ImageContent> {}

export interface ChatboxProps {
  setNewRenderImage: (value: string) => void;
}

export interface ApparelProps {
  newRenderImage: string;
}

export interface SafeHTMLProps {
  html: string;
}

export interface ChatMessageProps {
  role: MessageRole;
  content: string | ImageContent | ImageRowContent | RobotRowContent;
  productName: string;
}

export interface ApiRequest {
  user_id: number;
  query: string;
  guardrails: boolean;
  image: string;
  image_bool: boolean;
  context?: string;
  cart?: CartData;
  retrieved?: Record<string, string>;
}

export interface ApiResponse {
  response: string;
  images: Record<string, string>;
  timings: Record<string, number>;
}

export interface CartData {
  contents: CartItem[];
}

export interface CartItem {
  item: string;
  amount: number;
}

export interface StreamingChunk {
  type: 'content' | 'images' | 'error';
  payload: string | Record<string, string>;
  timestamp: number;
}

export interface UserSession {
  userId: number;
  isActive: boolean;
  createdAt: Date;
}

export interface FileUploadResult {
  file: File;
  base64: string;
  previewUrl: string;
}

export interface ErrorState {
  hasError: boolean;
  message: string;
  code?: string;
} 