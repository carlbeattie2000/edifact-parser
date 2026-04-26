import type { Segment } from "./segment.js";
import { SegmentBase } from "./segment_base.js";

export class SegmentCollection extends SegmentBase {
  private segments: Segment[] = [];

  private get hasBeenSet(): boolean {
    return this.Tag !== '';
  }

  public add(segment: Segment): void {
    if (!this.hasBeenSet) {
      this.Tag = segment.Tag;
    }

    if (this.Tag !== segment.Tag) {
      throw new Error(`SegmentCollection tag mismatch: expected ${this.Tag}, got ${segment.Tag}`)
    }

    this.segments.push(segment);
  }

  public getSegments(): Segment[] {
    return this.segments;
  }

  public get isEmpty(): boolean {
    return this.segments.length === 0;
  }

  public merge(segments: Segment[]) {
    for (const segment of segments) {
      this.add(segment);
    }
    return this;
  }
}
