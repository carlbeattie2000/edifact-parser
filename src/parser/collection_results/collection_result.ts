export default abstract class CollectionResult<T> {
  #items: T[];

  constructor(items: T[]) {
    this.#items = items;
  }

  protected abstract notFoundError(index?: number): Error;

  public first(): T | undefined {
    return this.#items[0];
  }

  public firstOrFail(): T {
    const item = this.#items[0];

    if (!item) {
      throw this.notFoundError();
    }

    return item;
  }

  public at(index: number): T | undefined {
    return this.#items[index];
  }

  public atOrFail(index: number): T | undefined {
    const item = this.#items[index];

    if (!item) {
      throw this.notFoundError();
    }

    return item;
  }

  public length(): number {
    return this.#items.length;
  }

  public all(): T[] {
    return [...this.#items];
  }

  public isValid(): boolean {
    return this.#items.length > 0;
  }
}
