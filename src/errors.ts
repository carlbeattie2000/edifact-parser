export class EdifactSyntaxError extends Error {}
export class EdifactEnvelopeError extends Error {}
export class EdifactValidationError extends Error {}
export class InterchangeNotFoundError extends Error {
  constructor(index: number) {
    super(`not found at index ${index} of items`);
  }
}
