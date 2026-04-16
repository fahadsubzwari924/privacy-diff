export type FormStatus =
  | "idle"
  | "submitting"
  | "validation_error"
  | "rate_limited"
  | "server_error";

export type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "validation_error"; message: string }
  | { status: "rate_limited" }
  | { status: "server_error" };

export type FormAction =
  | { type: "SUBMIT" }
  | { type: "VALIDATION_ERROR"; message: string }
  | { type: "RATE_LIMITED" }
  | { type: "SERVER_ERROR" }
  | { type: "RESET" };
