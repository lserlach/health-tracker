"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useBottomActionSlotRef } from "@/components/layout/bottom-action-context";

interface FixedBottomActionProps {
  children: ReactNode;
}

export function FixedBottomAction({ children }: FixedBottomActionProps) {
  const slotRef = useBottomActionSlotRef();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !slotRef.current) {
    return null;
  }

  return createPortal(<div className="w-full">{children}</div>, slotRef.current);
}
