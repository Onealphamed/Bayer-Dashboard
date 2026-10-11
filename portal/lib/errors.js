/* Typed HTTP error, kept in its own module so every layer can import it without cycles. */
export class HttpError extends Error {
  constructor(status, message, extra, headers) {
    super(message);
    this.status = status;
    this.extra = extra || null;
    this.headers = headers || null;
  }
}
