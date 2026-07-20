"use client";
import { motion, HTMLMotionProps } from "framer-motion";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
interface AnimateBlockProps extends HTMLMotionProps<"div"> { }

const AnimateBlock = ({ className, children, ...rest }: AnimateBlockProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 1,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={twMerge(clsx("", className))}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export default AnimateBlock;
