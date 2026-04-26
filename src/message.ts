import { Segment } from "./segment/segment.js";
import { SegmentCollection } from "./segment/segment_collection.js";
import { SegmentGroup } from "./segment/segment_group.js";
import type { SegmentGroupCollection } from "./segment/segment_group_collection.js";

export class Message {
	private segments: Map<string, Segment>;
	private segmentCollections: Map<string, SegmentCollection>;
	private segmentGroups: Map<string, SegmentGroup>;
	private segmentGroupCollections: Map<string, SegmentGroupCollection>;

	constructor() {
		this.segments = new Map();
    this.segmentCollections = new Map();
		this.segmentGroups = new Map();
		this.segmentGroupCollections = new Map();
	}

	public add(
		value: Segment | SegmentCollection | SegmentGroup | SegmentGroupCollection,
	): void {
		if (value instanceof Segment) {
			this.segments.set(value.Tag, value);
		} else if (value instanceof SegmentCollection) {
      this.segmentCollections.set(value.Tag, value);
		} else if (value instanceof SegmentGroup) {
			this.segmentGroups.set(value.Tag, value);
		} else {
			this.segmentGroupCollections.set(value.Tag, value);
		}
	}
}
