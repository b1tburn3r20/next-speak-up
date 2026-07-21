"use client";

import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TextAnimate } from "@/components/magicui/text-animate";
import { SimpleLandingPageLegislatorData } from "@/lib/types/legislator-types";
import SideBlock from "@/components/cb/side-block";
import Link from "next/link";
import InnerBlock from "@/components/cb/inner-block";

interface AllActiveLegislatorsProps {
  legislators: SimpleLandingPageLegislatorData[];
  userId: string | null;
}

interface VirtualResultsProps {
  legislators: SimpleLandingPageLegislatorData[];
}

const VirtualResults = ({ legislators }: VirtualResultsProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: legislators?.length,
    getScrollElement: () => parentRef?.current,
    estimateSize: () => 50,
    overscan: 5,
  })
  return (
    <div ref={parentRef} style={{ height: "40vh", overflow: "auto" }}>
      <div style={{
        height: virtualizer?.getTotalSize(),
        position: "relative",
        width: "100%",
      }}>
        {virtualizer?.getVirtualItems().map((virtualItem) => {
          const lineItem = legislators[virtualItem.index]
          return (
            <div
              key={virtualItem.key}
              ref={virtualizer?.measureElement}
              data-index={virtualItem?.index}
              className="py-2"
              style={{
                position: "absolute",
                top: virtualItem.start,
                width: "100%",
              }}
            >
              <Link href={`/legislators/federal/${lineItem?.bioguideId}`}>

                <SideBlock className={`p-2 rounded-lg ${virtualItem?.index % 2 === 0 ? "bg-secondary/30" : ""} hover:bg-secondary/70 `} >
                  <img
                    alt={`A depiction of the congress member ${lineItem?.name}`}
                    src={lineItem?.depiction?.imageUrl ?? ""}
                    className="rounded-lg h-12 w-12"
                  />
                  <div className="flex flex-col gap-1">

                    <span className="text-xs">
                      {lineItem?.firstName} {lineItem?.lastName}
                    </span>
                    <div className="text-xs">
                      <span>
                        {lineItem?.state} {lineItem?.role}
                      </span>
                      {lineItem?.district ? (
                        <span className="ml-2">
                          &bull;
                          <span className="ml-2">
                            District {lineItem?.district}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </SideBlock>
              </Link>
            </div>
          )
        })}
      </div>

    </div>
  )


};

const AllActiveLegislators = ({
  legislators,
}: AllActiveLegislatorsProps) => {
  const [filteredResults, setFilteredState] =
    useState<SimpleLandingPageLegislatorData[]>(legislators);
  // keeping this because of how stupid it is I love it.
  const sortLegislators = (legislators: SimpleLandingPageLegislatorData[]) => {
    const alphaSort = legislators?.sort(function(a, b) {
      if (a.state < b.state) {
        return -1
      }
      if (a.state > b.state) return 1
      return 0
    })

    let stateArrays = []
    let previousCheck: SimpleLandingPageLegislatorData = null
    let previousArr: SimpleLandingPageLegislatorData[] = []
    let states = 0
    alphaSort?.forEach((leg, index) => {
      // should happen if theres arr data and the last state !== curr state so ship off the done state
      const atEnd = index + 1 >= alphaSort?.length
      if (atEnd) {
        // we've reached the end of the list, so push curr to the previous array,
        // then submit the previous array to the state arrays, return
        previousArr.push(leg)
        stateArrays?.push(previousArr)
        states += 1
        return
      }

      if (previousCheck?.state === leg.state) {
        // if the last state is the same as the current state
        // push the last array to the states array, then set last iteration to curr
        previousCheck = leg
        previousArr.push(leg)
        return
      }
      if ((previousCheck && previousCheck?.state) !== leg.state) {
        // if the last state is not the same state push the last array to
        // states array, set current to prev, return
        stateArrays.push(previousArr)
        previousArr = []
        previousArr.push(leg)
        previousCheck = leg
        states += 1
        return
      }
    })
    const filteredStates: SimpleLandingPageLegislatorData[][] = stateArrays.filter((filter) => filter.length)
    let finalArray = []
    filteredStates.forEach((res) => {
      const filteredState = res.sort((a, b) => Number(a.district) - Number(b.district))
      finalArray = [...finalArray, ...filteredState]
    })
    return finalArray
  }
  useEffect(() => {
    const sorted = sortLegislators(legislators)
    setFilteredState(sorted)
  }, [legislators])
  return (
    <div className="rounded-3xl bg-background p-2 py-4 shadow-md md:p-8">
      <TextAnimate className="mb-4 text-2xl font-bold sm:mb-6 sm:text-3xl lg:text-4xl [&>span:first-child]:text-primary">
        All Active Legislators
      </TextAnimate>
      <InnerBlock>
        <VirtualResults legislators={filteredResults} />
      </InnerBlock>
    </div>
  );
};

export default AllActiveLegislators;
