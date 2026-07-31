"use server"

import { db } from "../_lib/prisma"

export const getBlockedDates = async () => {
  return db.blockedDate.findMany()
}
