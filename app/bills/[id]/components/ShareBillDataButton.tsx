"use client";

import PageShareButton from "@/app/GeneralComponents/Onboarding/components/componentsA/PageShareButton";

interface ShareBillDataButtonProps {
  billId: string;
  billTitle: string;
}

const ShareBillDataButton = ({
  billId,
  billTitle,
}: ShareBillDataButtonProps) => {
  const shareData = {
    title: "Together - Learn and Make Change",
    text: `Read about bill ${billTitle}`,
    url: `${billId}`,
  };

  return (
    <div>
      <PageShareButton shareData={shareData} />
    </div>
  );
};

export default ShareBillDataButton;
