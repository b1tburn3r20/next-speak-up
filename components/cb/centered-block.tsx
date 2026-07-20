import { twMerge } from "tailwind-merge";
import clsx from "clsx";
interface CenteredBlockProps extends React.ComponentProps<"div"> { }
const CenteredBlock = ({
  className,
  children,
  ...rest
}: CenteredBlockProps) => {
  return (
    <div
      className={twMerge(
        clsx("flex w-full justify-center items-center h-full", className),
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export default CenteredBlock;
