import type Segment from "./segment.js";

export default class Message {
	public messageReferenceNumber: string;
	public messageType: string;
	public messageVersion: string;
	public messageRelease: string;
	public controllingAgency: string;
	public associationCode: string;

	public segments: Segment[];

	public declaredSegmentCount: number;

	constructor(
		messageReferenceNumber: string,
		messageType: string,
		messageVersion: string,
		messageRelease: string,
		controllingAgency: string,
		associationCode: string,
		segments: Segment[],
		declaredSegmentCount: number,
	) {
		this.messageReferenceNumber = messageReferenceNumber;
		this.messageType = messageType;
		this.messageVersion = messageVersion;
		this.messageRelease = messageRelease;
		this.controllingAgency = controllingAgency;
		this.associationCode = associationCode;

		this.segments = segments;

		this.declaredSegmentCount = declaredSegmentCount;
	}
}
