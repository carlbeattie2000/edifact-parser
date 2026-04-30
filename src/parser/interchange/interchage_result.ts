import { InterchangeNotFoundError } from '../../errors.js';

import type Interchange from './interchange.js';

export default class InterchangeResult {
  #values: Interchange[];

  #errors: Error[];

  constructor(values: Interchange[], errors: Error[]) {
    this.#values = values;
    this.#errors = errors;
  }

  public first(): Interchange | undefined {
    return this.#values[0];
  }

  public firstOrFail(): Interchange {
    const interchange = this.#values[0];

    if (!interchange) {
      throw new InterchangeNotFoundError();
    }

    return interchange;
  }

  public at(index: number): Interchange | undefined {
    return this.#values[index];
  }

  public atOrFail(index: number): Interchange | undefined {
    const interchange = this.#values[index];

    if (!interchange) {
      throw new InterchangeNotFoundError();
    }

    return interchange;
  }

  public length(): number {
    return this.#values.length;
  }

  public all(): Interchange[] {
    return [...this.#values];
  }

  public errors(): Error[] {
    return [...this.#errors];
  }

  public hasErrors(): boolean {
    return this.#errors.length > 0;
  }

  public isValid(): boolean {
    return this.#errors.length === 0 && this.#values.length > 0;
  }
}
