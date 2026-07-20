import { twMerge } from "tailwind-merge";
import clsx from "clsx";
const SideBlock = ({ className, children, ...rest }: React.ComponentProps<"div">) => {
  return (
    <div className={twMerge(clsx("flex items-center gap-2", className))} {...rest}>
      {children}
    </div>
  );
};

export default SideBlock;
