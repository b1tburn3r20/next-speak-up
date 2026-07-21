"use client";
import { motion, HTMLMotionProps } from "framer-motion";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
interface InnerBlockProps extends HTMLMotionProps<"div"> { }

const InnerBlock = ({ className, children, ...rest }: InnerBlockProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 1,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={twMerge(
        clsx("bg-background-light shadow-md rounded-lg p-4", className),
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export default InnerBlock;
