import { SegmentBase } from "./segment_base.js";
import type { SegmentGroup } from "./segment_group.js";

export class SegmentGroupCollection extends SegmentBase {
	private segmentGroups: SegmentGroup[];

	constructor() {
		super();
		this.segmentGroups = [];
	}

	public get isEmpty(): boolean {
		return this.segmentGroups.length === 0;
	}

	private get HasGroupBeenSet(): boolean {
		return this.Tag !== "";
	}

	private setGroupHead(tag: string) {
		if (!this.HasGroupBeenSet) {
			this.Tag = tag;
		}
	}

	private GroupMatchesHead(tag: string) {
		if (this.Tag !== tag) {
			throw new Error(
				`SegmentGroupCollection head tag mismatch: expected ${this.Tag}`,
			);
		}
	}

	public getGroups() {
		return this.segmentGroups;
	}

	public addGroup(segmentGroup: SegmentGroup) {
		this.setGroupHead(segmentGroup.Tag);
		this.GroupMatchesHead(segmentGroup.Tag);
		this.segmentGroups.push(segmentGroup);
	}

	public merge(segmentGroups: SegmentGroup[]) {
		for (const segmentGroup of segmentGroups) {
			this.addGroup(segmentGroup);
		}
		return this;
	}
}
