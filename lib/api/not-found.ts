/** Thrown by API clients on 404 so pages can render a not-found state instead of an error. */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
