import { Segment } from "./segment.js";
import { SegmentBase } from "./segment_base.js";
import type { SegmentCollection } from "./segment_collection.js";
import type { SegmentGroupCollection } from "./segment_group_collection.js";

export class SegmentGroup extends SegmentBase {
	protected segments: (
		| Segment
		| SegmentCollection
		| SegmentGroup
		| SegmentGroupCollection
	)[];

	constructor(tag: string) {
    super();
		this.Tag = tag;
		this.segments = [];
	}

	public get Segments() {
		return this.segments;
	}

	public get Head(): string {
		const first = this.segments.at(0);
		if (!first) return "";
		return first.Tag;
	}

	public tagMatchesHead(tag: string): boolean {
		return this.Head === tag;
	}

	public deleteAndReturnIfNextIsTag(
		tag: string,
	):
		| Segment
		| SegmentCollection
		| SegmentGroup
		| SegmentGroupCollection
		| undefined {
		if (this.Head === tag) {
			return this.segments.shift();
		}

		return undefined;
	}

	public findFirstByTag(tag: string): Segment | undefined {
		for (const segment of this.segments) {
			if (segment instanceof Segment && segment.matchTag(tag)) {
				return segment;
			}
		}
		return undefined;
	}

	public merge(segments: (Segment | SegmentCollection | SegmentGroup | SegmentGroupCollection)[]) {
		this.segments = [...this.segments, ...segments];
	}
}
