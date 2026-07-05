"use client";

import { createContext, useContext, type RefObject } from "react";

export const BottomActionSlotRefContext =
  createContext<RefObject<HTMLDivElement | null> | null>(null);

export function useBottomActionSlotRef() {
  const slotRef = useContext(BottomActionSlotRefContext);

  if (!slotRef) {
    throw new Error("useBottomActionSlotRef must be used within AppShellClient");
  }

  return slotRef;
}
