import { data } from "react-router";

/**
 * Helper for error responses with consistent format
 */
export function errorResponse(message: string, status = 400) {
  return data({ error: message }, { status });
}

/**
 * Helper for success responses
 */
export function successResponse<T extends Record<string, unknown>>(payload: T) {
  return data(payload);
}

