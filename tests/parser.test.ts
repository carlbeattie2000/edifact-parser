import { describe, expect, it } from 'vitest';

import { EdifactEnvelopeError, EdifactValidationError, InterchangeNotFoundError } from '../src/errors.js';
import Parser from '../src/parser/index.js';

const VALID_EDIFACT = `UNA:+.? '
UNB+UNOA:2+MAERSK+GBFXT+260424:0811+000001'
UNH+000001+BAPLIE:D:95B:UN:SMDG20'
BGM++V123456+9'
DTM+137:202604240811:201'
UNT+4+000001'
UNZ+1+000001'`;

const VALID_EDIFACT_NO_UNA = `UNB+UNOA:2+MAERSK+GBFXT+260424:0811+000001'
UNH+000001+BAPLIE:D:95B:UN:SMDG20'
BGM++V123456+9'
DTM+137:202604240811:201'
UNT+4+000001'
UNZ+1+000001'`;

const VALID_EDIFACT_TWO_MESSAGES = `UNB+UNOA:2+MAERSK+GBFXT+260424:0811+000001'
UNH+000001+BAPLIE:D:95B:UN:SMDG20'
BGM++V123456+9'
UNT+3+000001'
UNH+000002+BAPLIE:D:95B:UN:SMDG20'
BGM++V234567+9'
UNT+3+000002'
UNZ+2+000001'`;

describe('Parser.split', () => {
  const parser = new Parser('');

  it('splits on delimiter', () => {
    const result = parser.split("hello'world", "'", false);
    expect(result).toEqual(['hello', 'world']);
  });

  it('keeps escaped delimiter when preserveRelease=false', () => {
    const result = parser.split("hello?'world'end", "'", false);
    expect(result).toEqual(["hello?'world", 'end']);
  });

  it('drops escape character when preserveRelease=true', () => {
    const result = parser.split("hello?'world'end", "'", true);
    expect(result).toEqual(["hello'world", 'end']);
  });

  it('handles consecutive delimiters as empty tokens', () => {
    const result = parser.split("hello''world", "'", false);
    expect(result).toEqual(['hello', '', 'world']);
  });

  it('handles escaped data element separator', () => {
    const result = parser.split('hello?+world+end', '+', true);
    expect(result).toEqual(['hello+world', 'end']);
  });

  it('returns single token when no delimiter found', () => {
    const result = parser.split('hello', "'", false);
    expect(result).toEqual(['hello']);
  });

  it('handles empty input', () => {
    const result = parser.split('', "'", false);
    expect(result).toEqual([]);
  });

  it('handles multiple consecutive escaped delimiters', () => {
    const result = parser.split('a?+b?+c+d', '+', true);
    expect(result).toEqual(['a+b+c', 'd']);
  });
});

describe('Parser UNA handling', () => {
  it('uses default delimiters when no UNA present', () => {
    const parser = new Parser(VALID_EDIFACT_NO_UNA);
    const result = parser.parse();
    expect(result).toHaveLength(1);
  });

  it('parses UNA and extracts custom delimiters', () => {
    const parser = new Parser(VALID_EDIFACT);
    const result = parser.parse();
    expect(result).toHaveLength(1);
  });
});

describe('Parser.parse - non strict mode', () => {
  it('parses a valid interchange', () => {
    const parser = new Parser(VALID_EDIFACT);
    const result = parser.parse();
    expect(result).toHaveLength(1);
  });

  it('parses interchange header correctly', () => {
    const parser = new Parser(VALID_EDIFACT);
    const [interchange] = parser.parse();
    expect(interchange).toBeDefined();
    if (!interchange) return;
    expect(interchange.syntaxIdentifier).toBe('UNOA');
    expect(interchange.syntaxVersion).toBe('2');
    expect(interchange.senderId).toBe('MAERSK');
    expect(interchange.recipientId).toBe('GBFXT');
    expect(interchange.date).toBe('260424');
    expect(interchange.time).toBe('0811');
    expect(interchange.controlReference).toBe('000001');
  });

  it('parses interchange message count', () => {
    const parser = new Parser(VALID_EDIFACT);
    const [interchange] = parser.parse();
    expect(interchange).toBeDefined();
    if (!interchange) return;
    expect(interchange.declaredMessageCount).toBe(1);
  });

  it('parses message header correctly', () => {
    const parser = new Parser(VALID_EDIFACT);
    const [interchange] = parser.parse();
    expect(interchange).toBeDefined();
    if (!interchange) return;
    const [message] = interchange.messages;
    expect(message).toBeDefined();
    if (!message) return;
    expect(message.messageReferenceNumber).toBe('000001');
    expect(message.messageType).toBe('BAPLIE');
    expect(message.messageVersion).toBe('D');
    expect(message.messageRelease).toBe('95B');
    expect(message.controllingAgency).toBe('UN');
    expect(message.associationCode).toBe('SMDG20');
  });

  it('parses message segments correctly', () => {
    const parser = new Parser(VALID_EDIFACT);
    const [interchange] = parser.parse();
    expect(interchange).toBeDefined();
    if (!interchange) return;
    const [message] = interchange.messages;
    expect(message).toBeDefined();
    if (!message) return;
    expect(message.segments).toHaveLength(2);
    expect(message.segments[0]!.tag).toBe('BGM');
    expect(message.segments[1]!.tag).toBe('DTM');
  });

  it('parses two messages in one interchange', () => {
    const parser = new Parser(VALID_EDIFACT_TWO_MESSAGES);
    const [interchange] = parser.parse();
    expect(interchange).toBeDefined();
    if (!interchange) return;
    expect(interchange.messages).toHaveLength(2);
    expect(interchange.messages[0]!.messageReferenceNumber).toBe('000001');
    expect(interchange.messages[1]!.messageReferenceNumber).toBe('000002');
  });

  it('creates orphan interchange when segments appear before UNB', () => {
    const input = `BGM++V123456+9'
UNB+UNOA:2+MAERSK+GBFXT+260424:0811+000001'
UNH+000001+BAPLIE:D:95B:UN:SMDG20'
UNT+2+000001'
UNZ+1+000001'`;
    const parser = new Parser(input);
    const result = parser.parse();
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('handles missing UNZ gracefully', () => {
    const input = `UNB+UNOA:2+MAERSK+GBFXT+260424:0811+000001'
UNH+000001+BAPLIE:D:95B:UN:SMDG20'
BGM++V123456+9'
UNT+3+000001'`;
    const parser = new Parser(input);
    const result = parser.parse();
    expect(result).toHaveLength(1);
  });

  it('handles missing UNT gracefully', () => {
    const input = `UNB+UNOA:2+MAERSK+GBFXT+260424:0811+000001'
UNH+000001+BAPLIE:D:95B:UN:SMDG20'
BGM++V123456+9'
UNZ+1+000001'`;
    const parser = new Parser(input);
    const result = parser.parse();
    expect(result).toHaveLength(1);
  });

  it('handles multiple UNB as multiple interchanges', () => {
    const input = `UNB+UNOA:2+MAERSK+GBFXT+260424:0811+000001'
UNH+000001+BAPLIE:D:95B:UN:SMDG20'
UNT+2+000001'
UNZ+1+000001'
UNB+UNOA:2+MAERSK+GBFXT+260424:0812+000002'
UNH+000001+BAPLIE:D:95B:UN:SMDG20'
UNT+2+000001'
UNZ+1+000002'`;
    const parser = new Parser(input);
    const result = parser.parse();
    expect(result).toHaveLength(2);
  });
});

describe('Parser.parse - strict mode', () => {
  it('parses a valid interchange in strict mode', () => {
    const parser = new Parser(VALID_EDIFACT, true);
    const result = parser.parse();
    expect(result).toHaveLength(1);
  });

  it('throws when first segment is not UNB', () => {
    const input = `BGM++V123456+9'
UNB+UNOA:2+MAERSK+GBFXT+260424:0811+000001'
UNZ+1+000001'`;
    const parser = new Parser(input, true);
    expect(() => parser.parse()).toThrow(EdifactEnvelopeError);
  });

  it('throws when last segment is not UNZ', () => {
    const input = `UNB+UNOA:2+MAERSK+GBFXT+260424:0811+000001'
UNH+000001+BAPLIE:D:95B:UN:SMDG20'
UNT+2+000001'
BGM++V123456+9'`;
    const parser = new Parser(input, true);
    expect(() => parser.parse()).toThrow(EdifactEnvelopeError);
  });

  it('throws on multiple UNB segments', () => {
    const input = `UNB+UNOA:2+MAERSK+GBFXT+260424:0811+000001'
UNH+000001+BAPLIE:D:95B:UN:SMDG20'
UNT+2+000001'
UNZ+1+000001'
UNB+UNOA:2+MAERSK+GBFXT+260424:0811+000002'
UNZ+0+000002'`;
    const parser = new Parser(input, true);
    expect(() => parser.parse()).toThrow(EdifactEnvelopeError);
  });

  it('throws when UNH has no matching UNT', () => {
    const input = `UNB+UNOA:2+MAERSK+GBFXT+260424:0811+000001'
UNH+000001+BAPLIE:D:95B:UN:SMDG20'
BGM++V123456+9'
UNZ+1+000001'`;
    const parser = new Parser(input, true);
    expect(() => parser.parse()).toThrow(EdifactEnvelopeError);
  });

  it('throws when UNZ control reference does not match UNB', () => {
    const input = `UNB+UNOA:2+MAERSK+GBFXT+260424:0811+000001'
UNH+000001+BAPLIE:D:95B:UN:SMDG20'
UNT+2+000001'
UNZ+1+WRONGREF'`;
    const parser = new Parser(input, true);
    expect(() => parser.parse()).toThrow(EdifactValidationError);
  });

  it('throws when UNT control reference does not match UNH', () => {
    const input = `UNB+UNOA:2+MAERSK+GBFXT+260424:0811+000001'
UNH+000001+BAPLIE:D:95B:UN:SMDG20'
BGM++V123456+9'
UNT+3+WRONGREF'
UNZ+1+000001'`;
    const parser = new Parser(input, true);
    expect(() => parser.parse()).toThrow(EdifactValidationError);
  });

  it('throws when UNZ message count does not match actual message count', () => {
    const input = `UNB+UNOA:2+MAERSK+GBFXT+260424:0811+000001'
UNH+000001+BAPLIE:D:95B:UN:SMDG20'
BGM++V123456+9'
UNT+3+000001'
UNZ+99+000001'`;
    const parser = new Parser(input, true);
    expect(() => parser.parse()).toThrow(EdifactValidationError);
  });

  it('throws when UNT segment count does not match actual segment count', () => {
    const input = `UNB+UNOA:2+MAERSK+GBFXT+260424:0811+000001'
UNH+000001+BAPLIE:D:95B:UN:SMDG20'
BGM++V123456+9'
UNT+99+000001'
UNZ+1+000001'`;
    const parser = new Parser(input, true);
    expect(() => parser.parse()).toThrow(EdifactValidationError);
  });
});

describe('Parser - segment data elements', () => {
  it('parses data elements correctly', () => {
    const parser = new Parser(VALID_EDIFACT);
    const [interchange] = parser.parse();
    expect(interchange).toBeDefined();
    if (!interchange) return;
    const [message] = interchange.messages;
    expect(message).toBeDefined();
    if (!message) return;
    const bgm = message.segments[0];
    expect(bgm!.tag).toBe('BGM');
    expect(bgm!.getDataElement(0)?.Value).toBe('');
    expect(bgm!.getDataElement(1)?.Value).toBe('V123456');
    expect(bgm!.getDataElement(2)?.Value).toBe('9');
  });

  it('parses composite data elements correctly', () => {
    const parser = new Parser(VALID_EDIFACT);
    const [interchange] = parser.parse();
    expect(interchange).toBeDefined();
    if (!interchange) return;
    const [message] = interchange.messages;
    expect(message).toBeDefined();
    if (!message) return;
    const dtm = message.segments[1];
    expect(dtm!.tag).toBe('DTM');
    expect(dtm!.getDataElement(0)?.getComponent(0)?.value).toBe('137');
    expect(dtm!.getDataElement(0)?.getComponent(1)?.value).toBe('202604240811');
    expect(dtm!.getDataElement(0)?.getComponent(2)?.value).toBe('201');
  });
});

describe('Parser - example EDIFACT file', () => {
  const textContent = VALID_EDIFACT;

  it('parses without throwing', () => {
    const parser = new Parser(textContent);
    expect(() => parser.parse()).not.toThrow();
  });

  it('returns one interchange', () => {
    const parser = new Parser(textContent);
    const result = parser.parse();
    expect(result).toHaveLength(1);
  });

  it('has one message', () => {
    const parser = new Parser(textContent);
    const [interchange] = parser.parse();
    expect(interchange).toBeDefined();
    if (!interchange) return;
    expect(interchange.messages).toHaveLength(1);
  });

  it('message type is BAPLIE', () => {
    const parser = new Parser(textContent);
    const [interchange] = parser.parse();
    expect(interchange).toBeDefined();
    if (!interchange) return;
    expect(interchange.messages[0]!.messageType).toBe('BAPLIE');
  });
});

describe('Parser - example parseResult()', () => {
  const textContent = VALID_EDIFACT;

  it('parses without throwing', () => {
    const parser = new Parser(textContent);
    expect(() => parser.parseResult()).not.toThrow();
  });

  it('first() returns valid interchange', () => {
    const parser = new Parser(textContent);
    const result = parser.parseResult();
    const first = result.first();
    expect(first).toBeDefined();
  });

  it('firstOrValid() returns valid interchange', () => {
    const parser = new Parser(textContent);
    const result = parser.parseResult();
    const first = result.firstOrFail();
    expect(first).toBeDefined();
  });

  it('firstOrValid() throws when no interchange', () => {
    const parser = new Parser('');
    const result = parser.parseResult();
    expect(() => result.firstOrFail()).toThrow(InterchangeNotFoundError);
  });

  it('at() returns valid interchange', () => {
    const parser = new Parser(textContent);
    const result = parser.parseResult();
    const first = result.at(0);
    expect(first).toBeDefined();
  });

  it('atOrFail() throws when no interchange at the index', () => {
    const parser = new Parser('');
    const result = parser.parseResult();
    expect(() => result.atOrFail(1)).toThrow(InterchangeNotFoundError);
  });

  it('length() returns correct interchanges inner array length', () => {
    const parser = new Parser(textContent);
    const result = parser.parseResult();
    expect(result.length()).toEqual(1);
  });

  it('all() returns all the inner interchange array', () => {
    const parser = new Parser(textContent);
    const result = parser.parseResult();
    expect(result.all()).toHaveLength(1);
  });

  it('hasErrors() returns false ', () => {
    const parser = new Parser(textContent);
    const result = parser.parseResult();
    expect(result.hasErrors()).toBeFalsy();
  });

  it('isValid() returns true', () => {
    const parser = new Parser(textContent);
    const result = parser.parseResult();
    expect(result.isValid()).toBeTruthy();
  });
});
