import ComponentDataElement from './elements/component_data_element.js';
import DataElement from './elements/data_element.js';
import InterchangeResult from './interchange/interchage_result.js';
import InterchangeParser from './interchange/interchange_parser.js';
import MessageParser from './message/message_parser.js';
import Segment from './segment.js';
import EdifactSyntaxError from '../errors/EdifactSyntaxError.js';

import type Interchange from './interchange/interchange.js';

export default class Parser {
  #strict: boolean;

  #rawContent: string;

  #DEFAULTS = {
    componentSeparator: ':',
    dataElementSeparator: '+',
    decimalNotation: '.',
    releaseCharacter: '?',
    segmentTerminator: "'",
  };

  #errors: Error[];

  constructor(rawContent: string, strict?: boolean) {
    this.#rawContent = rawContent.replace(/\r?\n/g, '');
    this.#strict = strict ?? false;
    this.#errors = [];
    this.parseUNA();
  }

  private parseUNA() {
    if (this.#rawContent.trimStart().startsWith('UNA')) {
      const unaSpeicalCharacters = this.#rawContent.slice(3, 9).split('');

      this.#DEFAULTS.componentSeparator = unaSpeicalCharacters[0]
        ?? this.#DEFAULTS.componentSeparator;
      this.#DEFAULTS.dataElementSeparator = unaSpeicalCharacters[1]
        ?? this.#DEFAULTS.dataElementSeparator;
      this.#DEFAULTS.decimalNotation = unaSpeicalCharacters[2]
        ?? this.#DEFAULTS.decimalNotation;
      this.#DEFAULTS.releaseCharacter = unaSpeicalCharacters[3]
        ?? this.#DEFAULTS.releaseCharacter;
      this.#DEFAULTS.segmentTerminator = unaSpeicalCharacters[5]
        ?? this.#DEFAULTS.segmentTerminator;

      this.#rawContent = Parser.#deleteChars(this.#rawContent, 9);
    }
  }

  static #deleteChars(str: string, count: number): string {
    return str.slice(count);
  }

  public split(
    input: string,
    delimiter: string,
    stripRelease = false,
  ): string[] {
    const tokens: string[] = [];
    let current = '';

    for (let i = 0; i < input.length; i += 1) {
      if (input[i] === this.#DEFAULTS.releaseCharacter) {
        if (i + 1 > input.length) {
          current += input[i];
          continue;
        }
        i += 1;
        if (stripRelease) {
          current += input[i];
        } else {
          current += this.#DEFAULTS.releaseCharacter + input[i];
        }
        continue;
      }

      if (input[i] === delimiter) {
        tokens.push(current);
        current = '';
        continue;
      }

      current += input[i];
    }

    if (current.length > 0) {
      tokens.push(current);
    }

    return tokens;
  }

  private rawSegments(): string[] {
    return this.split(
      this.#rawContent,
      this.#DEFAULTS.segmentTerminator,
      true,
    ).filter(Boolean);
  }

  private segments(segments: string[]): Segment[] {
    const parsedSegments: Segment[] = [];

    segments.forEach((segment) => {
      const rawDataElements = this.split(
        segment,
        this.#DEFAULTS.dataElementSeparator,
        true,
      );

      const tag = rawDataElements.shift();

      if (!tag) {
        if (this.#strict) {
          throw new EdifactSyntaxError();
        }
        this.#errors.push(new EdifactSyntaxError());
        return;
      }

      const rawComponents = rawDataElements
        .map((rawDataElement) => this
          .split(rawDataElement, this.#DEFAULTS.componentSeparator, false));

      const dataElements = rawComponents.map((rawComponentCollection) => {
        const components = rawComponentCollection.map(
          (rawComponent) => new ComponentDataElement(rawComponent),
        );

        return new DataElement(components);
      });

      parsedSegments.push(new Segment(tag, dataElements));
    });

    return parsedSegments;
  }

  private preValidate(
    segments: Segment[],
    checks: ((segments: Segment[]) => void)[],
  ): void {
    if (!this.#strict) return;

    checks.forEach((check) => {
      check(segments);
    });
  }

  public interchanges(segments: Segment[]): Interchange[] {
    const interchangeParser = new InterchangeParser(this.#strict);

    this.preValidate(segments, [
      interchangeParser.strictModeInterchangeCheck.bind(interchangeParser),
      interchangeParser.messageParser.strictModeMessagesCheck.bind(interchangeParser.messageParser),
    ]);

    segments.forEach((segment) => {
      if (InterchangeParser.isInterchangeHeader(segment)) {
        interchangeParser.handleInterchangeOpen(segment);
        return;
      }

      if (InterchangeParser.isInterchangeTrailer(segment)) {
        interchangeParser.handleInterchangeClose(segment);
        return;
      }

      interchangeParser.prepareForMessages();

      if (MessageParser.isMessageHeader(segment)) {
        interchangeParser.messageParser.handleOpenMessage(segment);
        return;
      }

      if (MessageParser.isMessageTrailer(segment)) {
        interchangeParser.messageParser.handleCloseMessage(segment);
        return;
      }

      interchangeParser.messageParser.prepareForSegments();
      interchangeParser.messageParser.receiveSegment(segment);
    });

    const interchanges = interchangeParser.terminate();

    return interchanges;
  }

  public parse(): InterchangeResult {
    const rawSegments = this.rawSegments();
    const segments = this.segments(rawSegments);
    const interchanges = this.interchanges(segments);
    return new InterchangeResult(interchanges, this.#errors);
  }
}
