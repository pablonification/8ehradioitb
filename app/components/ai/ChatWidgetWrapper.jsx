"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import ChatWidget to avoid SSR issues
const ChatWidget = dynamic(() => import("./ChatWidget"), {
  ssr: false,
  loading: () => null,
});

export default function ChatWidgetWrapper() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render until client-side hydration is complete
  if (!isMounted) return null;

  return <ChatWidget />;
}
