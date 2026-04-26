import { MalformedFileMissingTag } from "../errors.js";
import { Segment } from "./segment.js";
import { SegmentGroup } from "./segment_group.js";

export class Interchange extends SegmentGroup {
	private rawTextFileContent: string;

	constructor(rawTextFileContent: string) {
		super("interchange");
		this.rawTextFileContent = rawTextFileContent;
		this.strip();
		const rawSegments = this.parseDataElements(this.parseSegments());
		this.segments = this.parseIntoSegments(rawSegments);
	}

	private strip() {
		this.rawTextFileContent = this.rawTextFileContent
			.trim()
			.replace(/\r?\n/g, "");
	}

	private parseSegments(): string[] {
		return this.rawTextFileContent.split("'").filter(Boolean);
	}

	private parseDataElements(segments: string[]): string[][] {
		return segments.map((segment) => segment.split("+"));
	}

	private parseIntoSegments(segments: string[][]): Segment[] {
		const parsedSegments: Segment[] = [];

		let line = 1;
		for (const segment of segments) {
			const tag = segment.splice(0, 1).at(0);

			if (!tag) {
				throw new MalformedFileMissingTag(line);
			}

			parsedSegments.push(new Segment(tag, segment));
			line++;
		}

		return parsedSegments;
	}

	public override deleteAndReturnIfNextIsTag(tag: string): Segment | undefined {
		if (this.Head === tag) {
			return this.segments.shift() as Segment;
		}
		return undefined;
	}

  public deleteHead() {
    this.segments.shift();
  }
}
