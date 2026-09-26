/**
 * ChatWidget — corner launcher for the catalogue page.
 *
 * Same role as before but now opens the ModernChatbot instead of the
 * legacy Chatbox. Stays mounted once opened to preserve conversation state.
 */

"use client";

import React, { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";

import ModernChatbot from "../chatbot/ModernChatbot";
import Mark from "../Mark";
import { config } from "../../config/config";

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const open = () => {
    setIsOpen(true);
    setHasOpened(true);
  };

  return (
    <>
      {hasOpened && (
        <div className={`chat-widget${isOpen ? " chat-widget--open" : ""}`}>
          {/* The chatbox wrapper uses the widget modifier for compact sizing */}
          <ModernChatbot className="mc--widget" />
        </div>
      )}

      <button
        type="button"
        className="chat-launcher"
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close assistant" : `Ask ${config.ui.brand}`}
      >
        {isOpen ? (
          <>
            <CloseIcon fontSize="small" />
            Close
          </>
        ) : (
          <>
            <Mark width={18} />
            Ask {config.ui.brand}
          </>
        )}
      </button>
    </>
  );
};

export default ChatWidget;
