import { TextAnimate } from "@/components/magicui/text-animate";

const NoBillData = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <TextAnimate className="font-bold text-4xl">
        Looks like we dont have this bill just yet... Come back later and check
        again! Sorry for the inconvenience.
      </TextAnimate>
    </div>
  );
};

export default NoBillData;
