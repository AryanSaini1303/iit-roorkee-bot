"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import styles from "./page.module.css";
import AiListener from "@/components/AiListener";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const router = useRouter();
  const [dateTimeData, setDateTimeData] = useState();

  // Reference to the eyes container
  const eyesRef = useRef(null);

  useEffect(() => {
    const updateTime = () => {
      const dateTime = new Date();
      setDateTimeData(dateTime);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000 * 60);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!eyesRef.current) return;

      // Get bounding rect of the eyes container
      const rect = eyesRef.current.getBoundingClientRect();

      // Calculate the center of the eyes container
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate the relative mouse position from the center (range -1 to 1)
      let deltaX = (event.clientX - centerX) / (rect.width / 2);
      let deltaY = (event.clientY - centerY) / (rect.height / 2);

      // Clamp the delta between -1 and 1 for smooth max movement
      deltaX = Math.max(-1, Math.min(1, deltaX));
      deltaY = Math.max(-1, Math.min(1, deltaY));

      // Max translation in pixels for the eyes movement
      const maxTranslate = 20;

      // Calculate final translation
      const translateX = deltaX * maxTranslate;
      const translateY = deltaY * maxTranslate;

      // Apply transform to each eye div
      const eyes = eyesRef.current.querySelectorAll("div");
      eyes.forEach((eye) => {
        eye.style.transform = `translate(${translateX}px, ${translateY}px)`;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign-out error:", error.message);
    } else {
      setSession(null);
      router.push("/");
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      setSession(data?.session ?? null);
      setLoading(false);

      if (error) {
        console.error("Session fetch error:", error.message);
      }
    };
    getSession();
  }, []);

  if (!loading && !session) return "Unauthenticated";

  return (
    <div className={`${"wrapper"} ${"container"}`}>
      <ul className={styles.header}>
        <li>
          <h1>Zena</h1>
        </li>
        <li>
          <div className="dateTimeSection">
            <p>
              {dateTimeData?.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              {dateTimeData?.toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              })}
            </p>
          </div>
        </li>
        <li>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="1.8rem"
            height="1.8rem"
          >
            <g fill="none">
              <path
                fill="currentColor"
                d="M4 18a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2"
                opacity=".16"
              ></path>
              <path
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 18a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"
              ></path>
              <circle
                cx="12"
                cy="7"
                r="3"
                stroke="currentColor"
                strokeWidth="2"
              ></circle>
            </g>
          </svg>
        </li>
      </ul>
      <div className={styles.whiteSection}>
        <section className={styles.chatScreen}>chat Screen</section>
        <section className={styles.aiListener}>
          <div className={styles.eyes} ref={eyesRef}>
            <div></div>
            <div></div>
          </div>
          {/* <AiListener /> */}
          <img src="/images/aiBackground.gif" alt="" />
        </section>
      </div>
    </div>
  );
}
