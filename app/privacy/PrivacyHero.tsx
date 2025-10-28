import { TextAnimate } from "@/components/magicui/text-animate"
import { Highlighter } from "@/components/ui/highlighter"

const PrivacyHero = () => {
  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center px-4 py-8 lg:py-16">
        <div className="space-y-6 lg:space-y-8 text-center lg:text-left">
          <TextAnimate
            animation="blurInUp"
            by="word"
            className="font-bold text-4xl sm:text-5xl lg:text-6xl leading-tight [&>span:last-child]:text-primary"
            as="h1"
          >
            Let&apos;s talk Privacy
          </TextAnimate>
          <p className="text-muted-foreground text-base sm:text-lg max-w-prose mx-auto lg:mx-0">
            All personal identifiable information is kept private and

            <Highlighter action="underline" color="#FF9800">
              <span className="font-semibold">
                will not be sold to 3rd party vendors

              </span>
            </Highlighter>
            , you can rest assured your data is yours and yours alone.
          </p>{" "}
        </div>
        <div className="w-full flex justify-center lg:justify-end">
          <div className="relative w-full max-w-md lg:max-w-none aspect-video">
          </div>
        </div>
      </div>

    </div>
  )
}

export default PrivacyHero
