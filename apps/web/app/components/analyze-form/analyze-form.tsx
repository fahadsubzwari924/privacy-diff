"use client";

import { useReducer, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EXAMPLE_SITES } from "@/src/constants/index";
import type { FormAction, FormState } from "./analyze-form.types";

const HTTPS_PREFIX = "https://";

function prepareUrl(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `${HTTPS_PREFIX}${trimmed}`;
}

function validateUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "Only http and https URLs are supported.";
    }
    return null;
  } catch {
    return "Please enter a valid URL (e.g. https://example.com).";
  }
}

function formReducer(_state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SUBMIT":
      return { status: "submitting" };
    case "VALIDATION_ERROR":
      return { status: "validation_error", message: action.message };
    case "RATE_LIMITED":
      return { status: "rate_limited" };
    case "SERVER_ERROR":
      return { status: "server_error" };
    case "RESET":
      return { status: "idle" };
  }
}

export function AnalyzeForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, dispatch] = useReducer(formReducer, { status: "idle" });

  const isSubmitting = state.status === "submitting";

  async function handleSubmit(rawUrl: string) {
    const url = prepareUrl(rawUrl);
    const validationError = validateUrl(url);

    if (validationError) {
      dispatch({ type: "VALIDATION_ERROR", message: validationError });
      return;
    }

    dispatch({ type: "SUBMIT" });

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (res.status === 429) {
        dispatch({ type: "RATE_LIMITED" });
        toast.error("Slow down — try again in an hour.");
        return;
      }

      if (!res.ok) {
        dispatch({ type: "SERVER_ERROR" });
        toast.error("Something went wrong. Try again.");
        return;
      }

      const data = (await res.json()) as { reportId: string };
      router.push(`/r/${data.reportId}`);
    } catch {
      dispatch({ type: "SERVER_ERROR" });
      toast.error("Something went wrong. Try again.");
    }
  }

  function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = inputRef.current?.value ?? "";
    void handleSubmit(value);
  }

  function onChipClick(site: string) {
    void handleSubmit(site);
  }

  function onInputChange() {
    if (state.status === "validation_error") {
      dispatch({ type: "RESET" });
    }
  }

  return (
    <div className="w-full space-y-4">
      <form onSubmit={onFormSubmit} noValidate>
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="url"
            placeholder="https://example.com"
            disabled={isSubmitting}
            aria-invalid={state.status === "validation_error"}
            aria-describedby={
              state.status === "validation_error" ? "url-error" : undefined
            }
            onChange={onInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSubmit(inputRef.current?.value ?? "");
              }
            }}
            className="h-12 flex-1 rounded-xl px-4 text-base"
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 min-w-[80px] rounded-xl bg-brand text-brand-foreground hover:bg-brand/90 px-6 text-base font-semibold"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Analyze"
            )}
          </Button>
        </div>

        {state.status === "validation_error" && (
          <p id="url-error" className="mt-2 text-sm text-destructive">
            {state.message}
          </p>
        )}
      </form>

      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground">Try:</span>
        {EXAMPLE_SITES.map((site) => (
          <button
            key={site}
            type="button"
            disabled={isSubmitting}
            onClick={() => onChipClick(site)}
            className="rounded-full border border-border bg-muted px-3 py-0.5 text-sm text-muted-foreground transition-colors hover:border-brand/50 hover:bg-brand/10 hover:text-brand disabled:pointer-events-none disabled:opacity-50"
          >
            {site}
          </button>
        ))}
      </div>
    </div>
  );
}
