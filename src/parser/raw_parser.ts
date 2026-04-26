import { Interchange } from "../segment/interchange.js";
import { Message } from "../message.js";
import { SegmentSearch } from "../segment/segment_search.js";
import { SegmentSearchProcessor } from "../segment/segment_search_processor.js";

export default class RawParser {
	private interchange: Interchange;
	private message: Message = new Message();
	private searchSpec: SegmentSearch[] = [];
  private ignoreSpec: string[] = [];
	private parsed: boolean = false;

	constructor(fileContent: string) {
		this.interchange = new Interchange(fileContent);
	}

	public tag(
		tag: string,
		options?: { required?: boolean; repeatable?: number; ignore?: boolean },
	): RawParser {
		if (this.parsed) {
			throw new Error("File already parsed");
		}
		const spec = new SegmentSearch(tag, options);
		this.searchSpec.push(spec);
		return this;
	}

	public segmentGroup(
		headTag: string,
		cb: (group: SegmentSearch) => void,
		options?: { required?: boolean; repeatable?: number },
	): RawParser {
		if (this.parsed) {
			throw new Error("File already parsed");
		}
		const searchSpecGroup = new SegmentSearch(headTag, {
			...options,
			group: true,
		});
		cb(searchSpecGroup);
		this.searchSpec.push(searchSpecGroup);
		return this;
	}

  public ignore(tag: string) {
    this.ignoreSpec.push(tag);
    return this;
  }

	public parse() {
    const segmentProcessor = new SegmentSearchProcessor(this.interchange, this.searchSpec, this.ignoreSpec, this.message);
    segmentProcessor.consume();
    console.log(this.message);
  }
}
