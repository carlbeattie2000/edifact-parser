import type { SegmentSearchOptions } from "../types.js";

export class SegmentSearch {
	private required: boolean;
	private repeatable: number;
	private ignore: boolean;
	private group: boolean;
	private _tag: string;

	private children: SegmentSearch[];

	constructor(tag: string, options?: SegmentSearchOptions) {
		this._tag = tag;
		this.required = options?.required ?? false;
		this.repeatable =
			options?.repeatable && options.repeatable > 0 ? options.repeatable : 1;
		this.ignore = options?.ignore ?? false;
		this.group = options?.group ?? false;
		this.children = [];
	}

	public get Required(): boolean {
		return this.required;
	}

	public get Repeatable(): number {
		return this.repeatable;
	}

	public get Ignore(): boolean {
		return this.ignore;
	}

	public get Tag(): string {
		return this._tag;
	}

  public get Group(): boolean {
    return this.group;
  }

  public get Children(): SegmentSearch[] {
    return this.children;
  }

	private child(tag: string, options?: SegmentSearchOptions) {
		if (!this.group) {
			throw new Error("SegmentSearch not a group");
		}
		this.children.push(new SegmentSearch(tag, options));
	}

	public segmentGroup(
		headTag: string,
		cb: (group: SegmentSearch) => void,
		options?: Omit<SegmentSearchOptions, "group">,
	) {
		if (!this.group) {
			throw new Error("SegmentSearch not a group");
		}

		const group = new SegmentSearch(headTag, { ...options, group: true });

		cb(group);
		this.children.push(group);
    return this;
	}

	public tag(tag: string, options?: Omit<SegmentSearchOptions, "group">) {
		this.child(tag, options);
		return this;
	}
}
