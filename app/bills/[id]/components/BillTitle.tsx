interface BillTitleProps {
  billTitle: string;
  isDyslexicFriendly: boolean;
}
const BillTitle = ({ billTitle, isDyslexicFriendly }: BillTitleProps) => {
  return (
    <h1
      className={`text-center text-lg   ${
        isDyslexicFriendly && "font-dyslexic"
      }`}
    >
      {billTitle}
    </h1>
  );
};

export default BillTitle;
