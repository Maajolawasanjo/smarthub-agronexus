"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

export interface MotionButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  hoverScale?: number;
  tapScale?: number;
  hoverY?: number;
  glow?: boolean;
  glowColor?: string;
  className?: string;
}

export function MotionButton({
  children,
  hoverScale = 1.03,
  tapScale = 0.97,
  hoverY = -2,
  glow = false,
  glowColor = "rgba(76, 175, 80, 0.4)",
  className = "",
  ...rest
}: MotionButtonProps) {
  return (
    <motion.button
      whileHover={{
        scale: hoverScale,
        y: hoverY,
        boxShadow: glow ? `0 15px 30px -5px ${glowColor}` : undefined,
      }}
      whileTap={{
        scale: tapScale,
        y: 0,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
