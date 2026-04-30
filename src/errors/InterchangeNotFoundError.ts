export default class InterchangeNotFoundError extends Error {
  constructor(index: number) {
    super(`not found at index ${index} of items`);
  }
}
