import { Legislation } from "@prisma/client";

export interface HouseFloorBill extends Legislation {
  faux: boolean
}
