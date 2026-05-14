export type ApiErrorCode = "invalid_request" | "not_found" | "internal_error";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(status: number, code: ApiErrorCode, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export function invalidRequest(message: string) {
  return new ApiError(400, "invalid_request", message);
}

export function notFound(message = "resource not found") {
  return new ApiError(404, "not_found", message);
}
