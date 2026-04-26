import type RawParser from "./parser/raw_parser.js";

export interface RawBaplieSegments {}

export interface SegmentSearchOptions {
  required?: boolean;
  repeatable?: number;
  ignore?: boolean;
  group?: boolean;
  parser?: RawParser
}
