"use client";

import { useEffect, useRef } from "react";

export default function AiListener() {
  const animationRef = useRef(null);

  useEffect(() => {
    // Prevent SSR issues
    if (typeof window !== "undefined") {
      import("lottie-web").then((lottie) => {
        const anim = lottie.loadAnimation({
          container: animationRef.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          path: "/images/aiBackground4.json", // JSON file in public/images
        });

        return () => anim.destroy();
      });
    }
  }, []);

  return (
    <div
      ref={animationRef}
      style={{
        width: 200,
        height: 200,
        margin: "0 auto",
      }}
    />
  );
}
