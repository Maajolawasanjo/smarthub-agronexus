"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

export type FadeDirection = "up" | "down" | "left" | "right" | "none";

export interface MotionFadeProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  direction?: FadeDirection;
  delay?: number;
  duration?: number;
  distance?: number;
  threshold?: number;
  className?: string;
  once?: boolean;
}

const LUXURY_EASE = [0.22, 1, 0.36, 1] as const;

export function MotionFade({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  distance = 32,
  threshold = 0.15,
  className = "",
  once = true,
  ...rest
}: MotionFadeProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { y: distance, x: 0 };
      case "down":
        return { y: -distance, x: 0 };
      case "left":
        return { x: distance, y: 0 };
      case "right":
        return { x: -distance, y: 0 };
      case "none":
      default:
        return { x: 0, y: 0 };
    }
  };

  const initialOffset = getInitialPosition();

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...initialOffset,
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      viewport={{
        once,
        amount: threshold,
      }}
      transition={{
        duration,
        delay,
        ease: LUXURY_EASE,
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
