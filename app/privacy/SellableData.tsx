import { Highlighter } from "@/components/ui/highlighter"

const SellableData = () => {
  return (
    <div className="flex justify-end flex-col items-end">
      <h2 className="text-5xl font-semibold border-b pb-4">For the sake of <span className="text-primary">transparency.</span></h2>
      <div className="my-2 flex flex-col items-end max-w-2xl">
        <div className="text-lg font-semibold items-start w-full">Do we sell data?</div>
        <p className="text-muted-foreground">
          Yes, in order to make profits from our work we need a product, otherwise software like this
          <Highlighter action="underline" color="#FF9800">
            <span className="font-semibold">
              simply could not exist.
            </span>
          </Highlighter>
          &nbsp;
          Let&apos;s talk about what we <span className="font-bold">do </span>and <span className="font-bold">do not</span> intend to sell.
        </p>
      </div>
    </div>
  )
}

export default SellableData
