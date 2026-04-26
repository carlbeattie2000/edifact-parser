export class SegmentBase {
	private _tag: string = "";

	public get Tag() {
		return this._tag;
	}

	public set Tag(tag: string) {
		this._tag = tag;
	}
}
