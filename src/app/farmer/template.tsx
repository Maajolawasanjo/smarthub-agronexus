"use client";

import { motion } from "framer-motion";

export default function FarmerTemplate({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={{ 
                ease: [0.22, 1, 0.36, 1], // Custom premium easeOut cubic-bezier curve
                duration: 0.5 
            }}
            className="w-full h-full"
        >
            {children}
        </motion.div>
    );
}
