class HttpError extends Error {
  status;
  body;
  constructor(message: string, status: number, body: unknown = null) {
    super(message);
    this.status = status;
    this.body = body;
    Object.setPrototypeOf(this, HttpError.prototype);
    this.name = this.constructor.name;
    if (typeof (Error as any).captureStackTrace === "function") {
      (Error as any).captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
    this.stack = new Error().stack;
  }
}

export default HttpError;
