import Interchange from './interchange.js';
import { EdifactEnvelopeError, EdifactValidationError } from '../../errors.js';
import MessageParser from '../message/message_parser.js';

import type Segment from '../segment.js';

export default class InterchangeParser {
  private interchanges: Interchange[] = [];

  private currentInterchange: Interchange | null = null;

  private strict = false;

  public messageParser: MessageParser;

  constructor(strict: boolean) {
    this.strict = strict;
    this.messageParser = new MessageParser(strict, this);
  }

  public get CurrentInterchange() {
    return this.currentInterchange;
  }

  public isInterchangeHeader(segment: Segment): boolean {
    return segment.tag === 'UNB';
  }

  public isInterchangeTrailer(segment: Segment): boolean {
    return segment.tag === 'UNZ';
  }

  public strictModeInterchangeCheck(segments: Segment[]) {
    if (!this.strict) {
      return;
    }

    const head = segments[0];
    const tail = segments[segments.length - 1];

    if (!head || !this.isInterchangeHeader(head)) {
      throw new EdifactEnvelopeError();
    }

    if (!tail || !this.isInterchangeTrailer(tail)) {
      throw new EdifactEnvelopeError();
    }

    let headerCount = 0;
    let trailerCount = 0;

    for (const segment of segments) {
      if (this.isInterchangeHeader(segment)) {
        headerCount++;
      }

      if (this.isInterchangeTrailer(segment)) {
        trailerCount++;
      }
    }

    if (headerCount > 1 || trailerCount > 1) {
      throw new EdifactEnvelopeError();
    }
  }

  private parseInterchangeHeader(segment: Segment): Interchange {
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

    if (this.strict && controlReference !== interchange.controlReference) {
      throw new EdifactValidationError();
    }
  }

  public handleInterchangeOpen(segment?: Segment) {
    if (this.currentInterchange) {
      this.messageParser.handleOpenMessage();
      this.interchanges.push(this.currentInterchange);
    }

    if (segment) {
      this.currentInterchange = this.parseInterchangeHeader(segment);
    } else {
      this.currentInterchange = new Interchange();
    }
  }

  public handleInterchangeClose(segment?: Segment) {
    if (this.currentInterchange) {
      if (segment) {
        this.parseInterchangeTrailer(segment, this.currentInterchange);
      }
      this.messageParser.handleOpenMessage();
      this.interchanges.push(this.currentInterchange);
    }
    this.currentInterchange = null;
  }

  public prepareForMessages() {
    if (!this.currentInterchange) {
      this.currentInterchange = new Interchange();
    }
  }

  private postValidate(interchanges: Interchange[]) {
    if (!this.strict) return;

    for (const interchange of interchanges) {
      if (interchange.declaredMessageCount !== interchange.messages.length) {
        throw new EdifactValidationError();
      }

      for (const message of interchange.messages) {
        if (message.declaredSegmentCount !== message.segments.length + 2) {
          throw new EdifactValidationError();
        }
      }
    }
  }

  public terminate(): Interchange[] {
    this.messageParser.terminate();

    if (this.currentInterchange) {
      this.interchanges.push(this.currentInterchange);
      this.currentInterchange = null;
    }

    this.postValidate(this.interchanges);

    return this.interchanges;
  }
}
