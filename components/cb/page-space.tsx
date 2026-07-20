const PageSpacer = ({
  className,
  children,
  ...rest
}: React.ComponentProps<"div">) => {
  return (
    <div
      className={`px-4 my-2 lg:container mx-auto py-2 lg:py-8 ${className ?? ""}`}
      {...rest}
    >
      {children}
    </div>
  );
};

export default PageSpacer;
