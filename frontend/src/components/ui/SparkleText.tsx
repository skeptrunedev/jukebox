import React from "react";
import { motion } from "framer-motion";

// Updated sparkle colors based on the primary blue and a complementary blue
const PRIMARY = "oklch(66.9% 0.18368 248.8066)";
const LIGHTER = "oklch(80% 0.15 248.8)"; // lighter blue
const BRIGHT = "oklch(70% 0.22 248.8)"; // more saturated blue
const SECONDARY = "oklch(66.9% 0.18368 288.8066)"; // complementary (shifted hue)

/**
 * SparkleText wraps its children with animated sparkles using absolutely positioned SVGs.
 * Now with 7 twinkling sparkles using framer-motion, clustered close to the text.
 */
const SPARKLES = [
  // Top/front (closer)
  { left: "12%", top: "-9%", scale: 0.7, color: PRIMARY, z: 20, delay: 0 },
  { left: "78%", top: "4%", scale: 0.5, color: BRIGHT, z: 10, delay: 0.2 },
  // Bottom/front (closer)
  { left: "18%", top: "82%", scale: 0.6, color: LIGHTER, z: 20, delay: 0.4 },
  { left: "68%", top: "85%", scale: 0.9, color: SECONDARY, z: 10, delay: 0.6 },
  // Behind (closer)
  { left: "98%", top: "55%", scale: 0.8, color: LIGHTER, z: 0, delay: 0.3 },
];

export const SparkleText: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <span
    className="font-bold sparkle-text"
    style={{
      position: "relative",
      display: "inline-block",
    }}
  >
    {/* Sparkle SVGs, absolutely positioned, animated with framer-motion, now behind the text */}
    <span
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    >
      {SPARKLES.map((s, i) => (
        <motion.svg
          key={i}
          className="pointer-events-none absolute sparkle"
          width="21"
          height="21"
          viewBox="0 0 21 21"
          style={{
            left: s.left,
            top: s.top,
            transform: `scale(${s.scale})`,
            zIndex: s.z,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
            delay: s.delay,
          }}
        >
          <path
            d="M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 12.3916 6.39157 13.5 7.5C14.6084 8.60843 16.8077 8.59935 18.2797 9.13822L20.1561 9.82534C20.7858 10.0553 20.7858 10.9447 20.1561 11.1747L18.2797 11.8618C16.8077 12.4007 14.6084 12.3916 13.5 13.5C12.3916 14.6084 12.4006 16.8077 11.8618 18.2798L11.1746 20.1562C10.9446 20.7858 10.0553 20.7858 9.82531 20.1562L9.13819 18.2798C8.59932 16.8077 8.60843 14.6084 7.5 13.5C6.39157 12.3916 4.19225 12.4007 2.72023 11.8618L0.843814 11.1747C0.215148 10.9447 0.215148 10.0553 0.843814 9.82534L2.72023 9.13822C4.19225 8.59935 6.39157 8.60843 7.5 7.5C8.60843 6.39157 8.59932 4.19229 9.13819 2.72026L9.82531 0.843845Z"
            fill={s.color}
          />
        </motion.svg>
      ))}
    </span>
    <span className="relative inline-block" style={{ zIndex: 10 }}>
      <span
        className="text-4xl capitalize md:text-6xl lg:text-7xl"
        style={{
          position: "relative",
          zIndex: 10,
          background: `linear-gradient(90deg, ${PRIMARY} 0%, ${BRIGHT} 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {children}
      </span>
    </span>
  </span>
);

// Requires framer-motion: npm install framer-motion
