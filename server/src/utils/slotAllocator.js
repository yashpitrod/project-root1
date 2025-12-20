import Request from "../models/Request.js";

/**
 * Allocate next available time slot
 * Assumption:
 * - Each consultation = 10 minutes
 * - Dispensary starts immediately (for prototype)
 */
export const allocateSlot = async () => {
  const SLOT_DURATION_MINUTES = 10;

  // 1. Get latest scheduled request
  const lastRequest = await Request.findOne({ status: "scheduled" })
    .sort({ slotTime: -1 });

  let nextSlot;

  if (!lastRequest || !lastRequest.slotTime) {
    // First request → now
    nextSlot = new Date();
  } else {
    // Add 15 minutes to last slot
    nextSlot = new Date(lastRequest.slotTime);
    nextSlot.setMinutes(nextSlot.getMinutes() + SLOT_DURATION_MINUTES);
  }

  return nextSlot;
};
