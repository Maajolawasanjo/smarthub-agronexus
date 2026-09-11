"use client";

import React from "react";
import { motion, type HTMLMotionProps, type Variants } from "framer-motion";

const LUXURY_EASE = [0.22, 1, 0.36, 1] as const;

export interface MotionStaggerProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  staggerDelay?: number;
  delayChildren?: number;
  threshold?: number;
  once?: boolean;
  className?: string;
}

export function MotionStagger({
  children,
  staggerDelay = 0.1,
  delayChildren = 0,
  threshold = 0.15,
  once = true,
  className = "",
  ...rest
}: MotionStaggerProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: threshold }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export interface MotionStaggerItemProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  distance?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
}

export function MotionStaggerItem({
  children,
  distance = 24,
  duration = 0.5,
  direction = "up",
  className = "",
  ...rest
}: MotionStaggerItemProps) {
  const getOffset = () => {
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

  const offset = getOffset();

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      ...offset,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        ease: LUXURY_EASE,
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className} {...rest}>
      {children}
    </motion.div>
  );
}
