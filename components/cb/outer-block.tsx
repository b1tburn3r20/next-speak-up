import { OuterBlock as Block } from "@/components/blocks";

/** Older pages use this. New pages should import from components/blocks directly. */
const OuterBlock = (props: React.ComponentProps<"div">) => <Block {...props} />;

export default OuterBlock;
