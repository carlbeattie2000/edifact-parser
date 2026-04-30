import Message from './index.js';
import EdifactEnvelopeError from '../../errors/EdifactEnvelopeError.js';
import EdifactValidationError from '../../errors/EdifactValidationError.js';

import type InterchangeParser from '../interchange/interchange_parser.js';
import type Segment from '../segment.js';

export default class MessageParser {
  #currentMessage: Message | null = null;

  #strict = false;

  #interchangeParser: InterchangeParser;

  constructor(strict: boolean, interchangeParser: InterchangeParser) {
    this.#strict = strict;
    this.#interchangeParser = interchangeParser;
  }

  public static isMessageHeader(segment: Segment): boolean {
    return segment.tag === 'UNH';
  }

  public static isMessageTrailer(segment: Segment): boolean {
    return segment.tag === 'UNT';
  }

  public strictModeMessagesCheck(segments: Segment[]): void {
    if (!this.#strict) {
      return;
    }
    let start = -1;
    let end = -1;
    let index = 0;

    segments.forEach((segment) => {
      if (MessageParser.isMessageHeader(segment)) {
        if (start > end) {
          throw new EdifactEnvelopeError();
        }
        start = index;
      }

      if (MessageParser.isMessageTrailer(segment)) {
        if (start < end) {
          throw new EdifactEnvelopeError();
        }
        end = index;
      }

      index += 1;
    });

    if (start > end) {
      throw new EdifactEnvelopeError();
    }
  }

  static #parseMessageHeader(segment: Segment): Message {
    const message = new Message();
    message.messageReferenceNumber = segment.getDataElement(0)?.Value ?? '';
    const messageIdentifier = segment.getDataElement(1);
    message.messageType = messageIdentifier?.getComponent(0)?.value ?? '';
    message.messageVersion = messageIdentifier?.getComponent(1)?.value ?? '';
    message.messageRelease = messageIdentifier?.getComponent(2)?.value ?? '';
    message.controllingAgency = messageIdentifier?.getComponent(3)?.value ?? '';
    message.associationCode = messageIdentifier?.getComponent(4)?.value ?? '';
    return message;
  }

  private parseMessageTrailer(segment: Segment, message: Message): void {
    const declaredSegmentCount = Number(segment.getDataElement(0)?.Value ?? 0);
    const controlReference = segment.getDataElement(1)?.Value ?? '';

    if (this.#strict && controlReference !== message.messageReferenceNumber) {
      throw new EdifactValidationError();
    }

    message.declaredSegmentCount = declaredSegmentCount;
  }

  public handleOpenMessage(segment?: Segment): void {
    if (this.#currentMessage) {
      if (this.#interchangeParser.CurrentInterchange) {
        this.#interchangeParser.CurrentInterchange.messages.push(
          this.#currentMessage,
        );
      }
      this.#currentMessage = null;
    }

    if (segment) {
      this.#currentMessage = MessageParser.#parseMessageHeader(segment);
    } else {
      this.#currentMessage = new Message();
    }
  }

  public handleCloseMessage(segment?: Segment): void {
    if (this.#currentMessage) {
      if (segment) {
        this.parseMessageTrailer(segment, this.#currentMessage);
        if (this.#interchangeParser.CurrentInterchange) {
          this.#interchangeParser.CurrentInterchange.messages.push(
            this.#currentMessage,
          );
        }
      }
      this.#currentMessage = null;
    }
  }

  public prepareForSegments(): void {
    if (!this.#currentMessage) {
      this.#currentMessage = new Message();
    }
  }

  public receiveSegment(segment: Segment): void {
    if (this.#currentMessage) {
      this.#currentMessage.segments.push(segment);
    }
  }

  public terminate(): void {
    if (this.#interchangeParser.CurrentInterchange) {
      if (this.#currentMessage) {
        this.#interchangeParser.CurrentInterchange.messages.push(this.#currentMessage);
      }
    }

    if (this.#currentMessage) {
      this.#currentMessage = null;
    }
  }
}
