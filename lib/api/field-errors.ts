/** One backend validation issue, e.g. { path: "lineItems.0.quantity", message: "Number must be greater than 0" }. */
export type ApiFieldError = { path: string; message: string };

/** Error thrown for a 400 whose `details` lists Zod issues as "path: message; path: message". */
export class ApiValidationError extends Error {
  readonly fieldErrors: ApiFieldError[];
  constructor(message: string, fieldErrors: ApiFieldError[]) {
    super(message);
    this.name = "ApiValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export function parseFieldErrorDetails(details: string | null | undefined): ApiFieldError[] {
  if (!details) return [];
  return details
    .split(";")
    .map((part) => part.trim())
    .map((part) => {
      const match = /^([A-Za-z_][\w.]*):\s*(.+)$/.exec(part);
      return match ? { path: match[1], message: match[2].trim() } : null;
    })
    .filter((issue): issue is ApiFieldError => issue != null);
}

/** Pull `error.details` / `details` out of a backend error body. */
export function extractErrorDetails(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const root = body as Record<string, unknown>;
  const nested = root.error && typeof root.error === "object" ? (root.error as Record<string, unknown>) : null;
  const details = nested?.details ?? root.details;
  return typeof details === "string" ? details : null;
}

/** Messages for a path prefix ("billDate", "lineItems.2", "tds"). */
export function fieldErrorsFor(errors: ApiFieldError[], prefix: string): string[] {
  return errors
    .filter((issue) => issue.path === prefix || issue.path.startsWith(`${prefix}.`))
    .map((issue) => issue.message);
}
