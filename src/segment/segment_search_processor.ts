import type { Interchange } from "./interchange.js";
import type { Message } from "../message.js";
import type { Segment } from "./segment.js";
import { SegmentCollection } from "./segment_collection.js";
import { SegmentGroup } from "./segment_group.js";
import { SegmentGroupCollection } from "./segment_group_collection.js";
import type { SegmentSearch } from "./segment_search.js";

export class SegmentSearchProcessor {
	private interchange: Interchange;
	private segmentSearches: SegmentSearch[];
  private ignoreSegments: string[];
	private message: Message;

	constructor(
		interchange: Interchange,
		segmentSearches: SegmentSearch[],
    ignoreSegments: string[],
		message: Message,
	) {
		this.interchange = interchange;
		this.segmentSearches = segmentSearches;
    this.ignoreSegments = ignoreSegments;
		this.message = message;
	}

  private consumeIngoreUntilHeadClean() {
    while (this.ignoreSegments.includes(this.interchange.Head)) {
      this.interchange.deleteHead();
    }
  }

	private consumeSegment(
		searchSegment: SegmentSearch,
	): Segment | SegmentCollection | undefined {
    this.consumeIngoreUntilHeadClean();
		const foundSegments: Segment[] = [];

		for (let i = 0; i < searchSegment.Repeatable; i++) {
			if (this.interchange.Head !== searchSegment.Tag) {
				break;
			}

			const segment = this.interchange.deleteAndReturnIfNextIsTag(
				searchSegment.Tag,
			);

			if (segment) {
				foundSegments.push(segment);
			}
		}

		if (searchSegment.Required && foundSegments.length === 0) {
			throw new Error(
				`Malformed Segment: ${searchSegment.Tag} is required but missing from file`,
			);
		}

		if (foundSegments.length > 1) {
			return new SegmentCollection().merge(foundSegments);
		}

		return foundSegments.shift();
	}

	private consumeSegmentGroup(
		searchSegment: SegmentSearch,
	): SegmentGroup | SegmentGroupCollection | undefined {
		if (!searchSegment.Group) {
			throw new Error("SegmentSearch is not a group");
		}

    this.consumeIngoreUntilHeadClean();

    if (this.interchange.Head !== searchSegment.Tag) {
      if (!searchSegment.Required) {
        return undefined;
      }
      throw new Error(`Required group ${searchSegment.Tag} not found`)
    }

		const foundSegmentGroups: SegmentGroup[] = [];

		for (let i = 0; i < searchSegment.Repeatable; i++) {
      this.consumeIngoreUntilHeadClean();
			if (this.interchange.Head !== searchSegment.Tag) {
				break;
			}

			const segmentGroup = new SegmentGroup(searchSegment.Tag);

			for (const child of searchSegment.Children) {
				if (child.Group) {
					const childGroupSegments = this.consumeSegmentGroup(child);
					if (childGroupSegments) {
						segmentGroup.merge([childGroupSegments]);
					}
					continue;
				}

				const childSegment = this.consumeSegment(child);

				if (!childSegment) {
          continue
				}

				segmentGroup.merge([childSegment]);
			}

			foundSegmentGroups.push(segmentGroup);
		}

		if (searchSegment.Required && foundSegmentGroups.length === 0) {
			throw new Error(
				`Malformed Segment Group: ${searchSegment.Tag} group is required but missing from file`,
			);
		}

		if (foundSegmentGroups.length > 1) {
			return new SegmentGroupCollection().merge(foundSegmentGroups);
		}

		return foundSegmentGroups.shift();
	}

	public consume() {
		for (const segmentSearch of this.segmentSearches) {
      if (segmentSearch.Tag === 'UNT') {
        console.log('remaining segments:', this.interchange.Segments.map(s => s.Tag))
      }

			if (segmentSearch.Group) {
				const segmentGroup = this.consumeSegmentGroup(segmentSearch);

				if (segmentSearch.Ignore || !segmentGroup) {
					continue;
				}

				this.message.add(segmentGroup);
				continue;
			}

			const segment = this.consumeSegment(segmentSearch);

			if (segmentSearch.Ignore || !segment) {
				continue;
			}

			this.message.add(segment);
		}
	}
}
