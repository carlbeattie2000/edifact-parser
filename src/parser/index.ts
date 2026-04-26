export default class Parser {
	private strict: boolean;

	protected rawContent: string;

	protected DEFAULTS = {
		componentSeparator: ":",
		dataElementSeparator: "+",
		decimalNotation: ".",
		releaseCharacter: "?",
		segmentTerminator: "'",
	};

	constructor(rawContent: string, strict?: boolean) {
		this.rawContent = rawContent.replace(/\r?\n/g, "");
		this.strict = strict ?? false;
		this.parseUNA();
	}

	private parseUNA() {
		if (this.rawContent.trimStart().startsWith("UNA")) {
			const unaSpeicalCharacters = this.rawContent.slice(3, 9).split("");

			this.DEFAULTS.componentSeparator =
				unaSpeicalCharacters[0] ?? this.DEFAULTS.componentSeparator;
			this.DEFAULTS.dataElementSeparator =
				unaSpeicalCharacters[1] ?? this.DEFAULTS.dataElementSeparator;
			this.DEFAULTS.decimalNotation =
				unaSpeicalCharacters[2] ?? this.DEFAULTS.decimalNotation;
			this.DEFAULTS.releaseCharacter =
				unaSpeicalCharacters[3] ?? this.DEFAULTS.releaseCharacter;
			this.DEFAULTS.segmentTerminator =
				unaSpeicalCharacters[5] ?? this.DEFAULTS.segmentTerminator;

			this.rawContent = this.deleteChars(this.rawContent, 9);
		}
	}

	private deleteChars(str: string, count: number): string {
		return str.slice(count);
	}

	public split(
		input: string,
		delimiter: string,
		preserveRelease = false,
	): string[] {
		const tokens: string[] = [];
		let current = "";

		for (let i = 0; i < input.length; i++) {
			if (input[i] === this.DEFAULTS.releaseCharacter) {
				if (i + 1 > input.length) {
					current += input[i];
					continue;
				}
				i++;
				if (preserveRelease) {
					current += input[i];
				} else {
					current += this.DEFAULTS.releaseCharacter + input[i];
				}
				continue;
			}

			if (input[i] === delimiter) {
				tokens.push(current);
				current = "";
				continue;
			}

			current += input[i];
		}

		if (current.length > 0) {
			tokens.push(current);
		}

		return tokens;
	}

	private segments(): string[] {
		return this.split(
			this.rawContent,
			this.DEFAULTS.segmentTerminator,
			true,
		).filter(Boolean);
	}
}
