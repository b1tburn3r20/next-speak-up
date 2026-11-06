import { twMerge } from "tailwind-merge";
import clsx from "clsx";
type StackBlockProps = React.ComponentProps<"div">;
const StackBlock = ({ className, children, ...rest }: StackBlockProps) => {
  return (
    <div className={twMerge(clsx("flex flex-col gap-2", className))} {...rest}>
      {children}
    </div>
  );
};

export default StackBlock;
