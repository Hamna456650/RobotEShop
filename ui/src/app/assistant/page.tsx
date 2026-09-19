import Apparel from "../../components/Apparel";
import Chatbox from "../../components/chatbox/chatbox";

/**
 * `/assistant` — the original chat-led screen, unchanged: the full-height
 * panel beside the splash image that image upload renders into.
 */
export default function AssistantPage() {
  return (
    <>
      <Apparel />
      <Chatbox />
    </>
  );
}
