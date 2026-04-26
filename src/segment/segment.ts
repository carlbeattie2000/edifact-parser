import { SegmentBase } from "./segment_base.js";

export class Segment extends SegmentBase {
	private dataElements: string[];

	constructor(tag: string, dataElements: string[]) {
    super();
    this.Tag = tag;
		this.dataElements = dataElements;
	}

	get DataElements(): string[] {
		return this.dataElements;
	}

	public matchTag(tag: string): boolean {
		return this.Tag === tag.toUpperCase();
	}
}
