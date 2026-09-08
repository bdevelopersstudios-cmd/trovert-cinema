/**
 * Raised when a booking loses a race for its seats.
 *
 * The booking route checks availability before it writes, but two guests can
 * pass that check at the same moment. The repository re-checks inside the
 * write transaction and throws this instead, so the API can answer with the
 * same friendly 400 the pre-flight check would have given.
 */
export class BookingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingConflictError";
  }
}

export function isBookingConflict(error: unknown): error is BookingConflictError {
  return error instanceof BookingConflictError;
}
