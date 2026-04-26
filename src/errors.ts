export class MalformedSegment extends Error {
	constructor(tag: string | string[], groupHead?: string, line?: number) {
		super(
			`Malformed ${Array.isArray(tag) ? tag.join(", ") : tag} segment ` +
				groupHead
				? ` in group ${groupHead}`
				: `` + line
					? ` on line ${line}`
					: ``,
		);
	}
}

export class MalformedFileMissingTag extends Error {
  constructor(line: number) {
    super(`Malformed File: ${line} does not have a tag`)
  }
}
