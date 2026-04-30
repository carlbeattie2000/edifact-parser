import Interchange from './interchange.js';
import EdifactEnvelopeError from '../../errors/EdifactEnvelopeError.js';
import EdifactValidationError from '../../errors/EdifactValidationError.js';
import MessageParser from '../message/message_parser.js';

import type Segment from '../segment.js';

export default class InterchangeParser {
  #interchanges: Interchange[] = [];

  #currentInterchange: Interchange | null = null;

  #strict = false;

  public messageParser: MessageParser;

  constructor(strict: boolean) {
    this.#strict = strict;
    this.messageParser = new MessageParser(strict, this);
  }

  public get CurrentInterchange(): Interchange | null {
    return this.#currentInterchange;
  }

  static isInterchangeHeader(segment: Segment): boolean {
    return segment.tag === 'UNB';
  }

  static isInterchangeTrailer(segment: Segment): boolean {
    return segment.tag === 'UNZ';
  }

  public strictModeInterchangeCheck(segments: Segment[]): void {
    if (!this.#strict) {
      return;
    }

    const head = segments[0];
    const tail = segments[segments.length - 1];

    if (!head || !InterchangeParser.isInterchangeHeader(head)) {
      throw new EdifactEnvelopeError();
    }

    if (!tail || !InterchangeParser.isInterchangeTrailer(tail)) {
      throw new EdifactEnvelopeError();
    }

    let headerCount = 0;
    let trailerCount = 0;

    segments.forEach((segment) => {
      if (InterchangeParser.isInterchangeHeader(segment)) {
        headerCount += 1;
      }

      if (InterchangeParser.isInterchangeTrailer(segment)) {
        trailerCount += 1;
      }
    });

    if (headerCount > 1 || trailerCount > 1) {
      throw new EdifactEnvelopeError();
    }
  }

  static #parseInterchangeHeader(segment: Segment): Interchange {
    const interchange = new Interchange();
    interchange.syntaxIdentifier = segment.getDataElement(0)?.getComponent(0)?.value ?? '';
    interchange.syntaxVersion = segment.getDataElement(0)?.getComponent(1)?.value ?? '';
    interchange.senderId = segment.getDataElement(1)?.Value ?? '';
    interchange.recipientId = segment.getDataElement(2)?.Value ?? '';
    interchange.date = segment.getDataElement(3)?.getComponent(0)?.value ?? '';
    interchange.time = segment.getDataElement(3)?.getComponent(1)?.value ?? '';
    interchange.controlReference = segment.getDataElement(4)?.Value ?? '';
    return interchange;
  }

  private parseInterchangeTrailer(segment: Segment, interchange: Interchange) {
    interchange.declaredMessageCount = Number(
      segment.getDataElement(0)?.Value ?? 0,
    );
    const controlReference = segment.getDataElement(1)?.Value ?? '';

    if (this.#strict && controlReference !== interchange.controlReference) {
      throw new EdifactValidationError();
    }
  }

  public handleInterchangeOpen(segment?: Segment): void {
    if (this.#currentInterchange) {
      this.messageParser.handleOpenMessage();
      this.#interchanges.push(this.#currentInterchange);
    }

    if (segment) {
      this.#currentInterchange = InterchangeParser.#parseInterchangeHeader(segment);
    } else {
      this.#currentInterchange = new Interchange();
    }
  }

  public handleInterchangeClose(segment?: Segment): void {
    if (this.#currentInterchange) {
      if (segment) {
        this.parseInterchangeTrailer(segment, this.#currentInterchange);
      }
      this.messageParser.handleOpenMessage();
      this.#interchanges.push(this.#currentInterchange);
    }
    this.#currentInterchange = null;
  }

  public prepareForMessages(): void {
    if (!this.#currentInterchange) {
      this.#currentInterchange = new Interchange();
    }
  }

  private postValidate(interchanges: Interchange[]) {
    if (!this.#strict) return;

    interchanges.forEach((interchange) => {
      if (interchange.declaredMessageCount !== interchange.messages.length) {
        throw new EdifactValidationError();
      }

      interchange.messages.forEach((message) => {
        if (message.declaredSegmentCount !== message.segments.length + 2) {
          throw new EdifactValidationError();
        }
      });
    });
  }

  public terminate(): Interchange[] {
    this.messageParser.terminate();

    if (this.#currentInterchange) {
      this.#interchanges.push(this.#currentInterchange);
      this.#currentInterchange = null;
    }

    this.postValidate(this.#interchanges);

    return this.#interchanges;
  }
}
