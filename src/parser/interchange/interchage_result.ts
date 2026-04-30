import InterchangeNotFoundError from '../../errors/InterchangeNotFoundError.js';
import CollectionResult from '../collection_results/collection_result.js';

import type Interchange from './interchange.js';

export default class InterchangeResult extends CollectionResult<Interchange> {
  #errors: Error[];

  constructor(values: Interchange[], errors: Error[]) {
    super(values);
    this.#errors = errors;
  }

  // eslint-disable-next-line class-methods-use-this
  protected notFoundError(index: number): Error {
    return new InterchangeNotFoundError(index);
  }

  public errors(): Error[] {
    return [...this.#errors];
  }

  public hasErrors(): boolean {
    return this.#errors.length > 0;
  }

  public override isValid(): boolean {
    return super.isValid() && this.#errors.length === 0;
  }
}
