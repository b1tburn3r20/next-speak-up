

"use client";
import { motion, HTMLMotionProps } from "framer-motion";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
interface OuterBlockProps extends HTMLMotionProps<"div"> { }

const OuterBlock = ({ className, children, ...rest }: OuterBlockProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 1,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={twMerge(
        clsx("bg-background shadow-md rounded-lg p-2", className),
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export default OuterBlock;
