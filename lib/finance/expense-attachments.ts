export const EXPENSE_ATTACHMENT_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const EXPENSE_ATTACHMENT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const EXPENSE_ATTACHMENT_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".pdf",
  ".doc",
  ".docx",
]);

export const MAX_EXPENSE_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_EXPENSE_ATTACHMENTS = 10;

export function isAllowedExpenseAttachment(file: File): boolean {
  const mime = file.type?.trim().toLowerCase();
  if (mime && EXPENSE_ATTACHMENT_MIME_TYPES.has(mime)) return true;

  const name = file.name?.trim().toLowerCase() ?? "";
  const dot = name.lastIndexOf(".");
  if (dot < 0) return false;
  return EXPENSE_ATTACHMENT_EXTENSIONS.has(name.slice(dot));
}

export function validateExpenseAttachmentFiles(files: File[]): string | null {
  if (files.length > MAX_EXPENSE_ATTACHMENTS) {
    return "tooMany";
  }

  for (const file of files) {
    if (!isAllowedExpenseAttachment(file)) {
      return "invalidType";
    }
    if (file.size > MAX_EXPENSE_ATTACHMENT_BYTES) {
      return "tooLarge";
    }
  }

  return null;
}

export function formatExpenseAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isExpenseImageFile(file: File): boolean {
  const mime = file.type?.trim().toLowerCase();
  if (mime.startsWith("image/")) return true;
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);
}

export type ExpenseFileKind = "image" | "pdf" | "doc";

export function getExpenseFileKind(file: File): ExpenseFileKind {
  const mime = file.type?.trim().toLowerCase();
  const name = file.name?.trim().toLowerCase() ?? "";
  if (isExpenseImageFile(file)) return "image";
  if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  return "doc";
}
