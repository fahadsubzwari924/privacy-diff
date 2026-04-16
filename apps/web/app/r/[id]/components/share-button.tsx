"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { SHARE_BUTTON } from "../constants/report-page.constants";

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const url = window.location.href;

    if (!navigator.clipboard) {
      toast.error(SHARE_BUTTON.TOAST_NO_SUPPORT);
      return;
    }

    navigator.clipboard.writeText(url).then(
      () => {
        setCopied(true);
        toast.success(SHARE_BUTTON.TOAST_SUCCESS);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        toast.error(SHARE_BUTTON.TOAST_ERROR);
      },
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      {copied ? SHARE_BUTTON.LABEL_COPIED : SHARE_BUTTON.LABEL}
    </Button>
  );
}
