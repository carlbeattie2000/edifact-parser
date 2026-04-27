import {
	EdifactEnvelopeError,
	EdifactSyntaxError,
	EdifactValidationError,
} from "../errors.js";
import ComponentDataElement from "./component_data_element.js";
import DataElement from "./data_element.js";
import Interchange from "./interchange.js";
import Message from "./message.js";
import Segment from "./segment.js";

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

	private rawSegments(): string[] {
		return this.split(
			this.rawContent,
			this.DEFAULTS.segmentTerminator,
			true,
		).filter(Boolean);
	}

	private segments(segments: string[]): Segment[] {
		const parsedSegments: Segment[] = [];

		for (const segment of segments) {
			const rawDataElements = this.split(
				segment,
				this.DEFAULTS.dataElementSeparator,
				true,
			);

			const tag = rawDataElements.shift();

			if (!tag) {
				if (this.strict) {
					throw new EdifactSyntaxError();
				}
				continue;
			}

			const rawComponents = rawDataElements.map((rawDataElement) =>
				this.split(rawDataElement, this.DEFAULTS.componentSeparator, false),
			);

			const dataElements = rawComponents.map((rawComponentCollection) => {
				const components = rawComponentCollection.map(
					(rawComponent) => new ComponentDataElement(rawComponent),
				);

				return new DataElement(components);
			});

			parsedSegments.push(new Segment(tag, dataElements));
		}

		return parsedSegments;
	}

	private isInterchangeHeader(segment: Segment): boolean {
		return segment.tag === "UNB";
	}

	private isInterchangeTrailer(segment: Segment): boolean {
		return segment.tag === "UNZ";
	}

	private strictModeInterchangeCheck(segments: Segment[]) {
		if (!this.strict) {
			return;
		}

		const head = segments[0];
		const tail = segments[segments.length - 1];

		if (!head || !this.isInterchangeHeader(head)) {
			throw new EdifactEnvelopeError();
		}

		if (!tail || !this.isInterchangeTrailer(tail)) {
			throw new EdifactEnvelopeError();
		}

		let headerCount = 0;
		let trailerCount = 0;

		for (const segment of segments) {
			if (this.isInterchangeHeader(segment)) {
				headerCount++;
			}

			if (this.isInterchangeTrailer(segment)) {
				trailerCount++;
			}
		}

		if (headerCount > 1 || trailerCount > 1) {
			throw new EdifactEnvelopeError();
		}
	}

	private parseInterchangeHeader(segment: Segment): Interchange {
		const interchange = new Interchange();
		interchange.syntaxIdentifier =
			segment.getDataElement(0)?.getComponent(0)?.value ?? "";
		interchange.syntaxVersion =
			segment.getDataElement(0)?.getComponent(1)?.value ?? "";
		interchange.senderId = segment.getDataElement(1)?.Value ?? "";
		interchange.recipientId = segment.getDataElement(2)?.Value ?? "";
		interchange.date = segment.getDataElement(3)?.getComponent(0)?.value ?? "";
		interchange.time = segment.getDataElement(3)?.getComponent(1)?.value ?? "";
		interchange.controlReference = segment.getDataElement(4)?.Value ?? "";
		return interchange;
	}

	private parseInterchangeTrailer(segment: Segment, interchange: Interchange) {
		interchange.declaredMessageCount = Number(
			segment.getDataElement(0)?.Value ?? 0,
		);
		const controlReference = segment.getDataElement(1)?.Value ?? "";

		if (this.strict && controlReference !== interchange.controlReference) {
			throw new EdifactValidationError();
		}
	}

	private isMessageHeader(segment: Segment): boolean {
		return segment.tag === "UNH";
	}

	private isMeassgeTrailer(segment: Segment): boolean {
		return segment.tag === "UNT";
	}

	private strictModeMessagesCheck(segments: Segment[]): void {
		let start = -1;
		let end = -1;
		let index = 0;

		for (const segment of segments) {
			if (this.isMessageHeader(segment)) {
				if (start > end) {
					throw new EdifactEnvelopeError();
				}
				start = index;
			}

			if (this.isMeassgeTrailer(segment)) {
				if (start < end) {
					throw new EdifactEnvelopeError();
				}
				end = index;
			}

			index++;
		}

		if (start > end) {
			throw new EdifactEnvelopeError();
		}
	}

	private parseMessageHeader(segment: Segment): Message {
		const message = new Message();
		message.messageReferenceNumber = segment.getDataElement(0)?.Value ?? "";
		const messageIdentifier = segment.getDataElement(1);
		message.messageType = messageIdentifier?.getComponent(0)?.value ?? "";
		message.messageVersion = messageIdentifier?.getComponent(1)?.value ?? "";
		message.messageRelease = messageIdentifier?.getComponent(2)?.value ?? "";
		message.controllingAgency = messageIdentifier?.getComponent(3)?.value ?? "";
		message.associationCode = messageIdentifier?.getComponent(4)?.value ?? "";
		return message;
	}

	private parseMessageTrailer(segment: Segment, message: Message): void {
		const declaredSegmentCount = Number(segment.getDataElement(0)?.Value ?? 0);
		const controlReference = segment.getDataElement(1)?.Value ?? "";

		if (this.strict && controlReference !== message.messageReferenceNumber) {
			throw new EdifactValidationError();
		}

		message.declaredSegmentCount = declaredSegmentCount;
	}

	private preValidate(segments: Segment[]): void {
		if (!this.strict) return;

		this.strictModeInterchangeCheck(segments);
		this.strictModeMessagesCheck(segments);
	}

  private postValidate(interchanges: Interchange[]) {
    if (!this.strict) return;

    for (const interchange of interchanges) {
      if (interchange.declaredMessageCount !== interchange.messages.length) {
        throw new EdifactValidationError();
      }

      for (const message of interchange.messages) {
        if (message.declaredSegmentCount !== message.segments.length + 2) {
          throw new EdifactValidationError();
        }
      }
    }
  }

	public interchanges(segments: Segment[]) {
		this.preValidate(segments);

		const interchanges: Interchange[] = [];
		let currentInterchange: Interchange | null = null;
		let currentMessage: Message | null = null;

		for (const segment of segments) {
			if (this.isInterchangeHeader(segment)) {
				if (currentInterchange) {
          if (currentMessage) {
            currentInterchange.messages.push(currentMessage);
            currentMessage = null;
          }
					interchanges.push(currentInterchange);
					currentInterchange = null;
				}

				currentInterchange = this.parseInterchangeHeader(segment);
				continue;
			}

			if (this.isInterchangeTrailer(segment)) {
				if (currentInterchange) {
					this.parseInterchangeTrailer(segment, currentInterchange);
          if (currentMessage) {
            currentInterchange.messages.push(currentMessage);
            currentMessage = null;
          }
					interchanges.push(currentInterchange);
					currentInterchange = null;
				}
				continue;
			}

			if (!currentInterchange) {
				currentInterchange = new Interchange();
			}

			if (this.isMessageHeader(segment)) {
				if (currentMessage) {
					currentInterchange.messages.push(currentMessage);
					currentMessage = null;
				}

				currentMessage = this.parseMessageHeader(segment);
				continue;
			}

			if (this.isMeassgeTrailer(segment)) {
				if (currentMessage) {
					this.parseMessageTrailer(segment, currentMessage);
					currentInterchange.messages.push(currentMessage);
					currentMessage = null;
				}
				continue;
			}

			if (!currentMessage) {
				currentMessage = new Message();
			}

      currentMessage.segments.push(segment);
		}

		if (currentInterchange) {
			if (currentMessage) {
				currentInterchange.messages.push(currentMessage);
				currentMessage = null;
			}
			interchanges.push(currentInterchange);
			currentInterchange = null;
		}

    this.postValidate(interchanges);

		return interchanges;
	}

	public parse(): Interchange[] {
		const rawSegments = this.rawSegments();
		const segments = this.segments(rawSegments);
		return this.interchanges(segments);
	}
}
