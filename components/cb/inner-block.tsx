import { InnerBlock as Block } from "@/components/blocks";

/** Older pages use this. New pages should import from components/blocks directly. */
const InnerBlock = (props: React.ComponentProps<"div">) => <Block {...props} />;

export default InnerBlock;
