"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

export interface MarqueeProps {
  children: React.ReactNode;
  speed?: number; // seconds per cycle
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  className?: string;
  gap?: string;
}

export function Marquee({
  children,
  speed = 28,
  direction = "left",
  pauseOnHover = true,
  className = "",
  gap = "gap-12",
}: MarqueeProps) {
  const [isPaused, setIsPaused] = useState(false);

  const initialX = direction === "left" ? "0%" : "-50%";
  const animateX = direction === "left" ? "-50%" : "0%";

  return (
    <div
      className={`relative w-full overflow-hidden flex ${className}`}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <motion.div
        className={`flex shrink-0 items-center ${gap}`}
        animate={{
          x: [initialX, animateX],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: speed,
            ease: "linear",
          },
        }}
        style={{
          animationPlayState: isPaused ? "paused" : "running",
        }}
      >
        {children}
        {children}
      </motion.div>

      {/* Duplicate track to guarantee seamless infinite loop */}
      <motion.div
        className={`flex shrink-0 items-center ${gap}`}
        aria-hidden="true"
        animate={{
          x: [initialX, animateX],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: speed,
            ease: "linear",
          },
        }}
        style={{
          animationPlayState: isPaused ? "paused" : "running",
        }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}
