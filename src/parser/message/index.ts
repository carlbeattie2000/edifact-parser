import type Segment from "../segment.js";

export default class Message {
	public messageReferenceNumber: string = '';
	public messageType: string = '';
	public messageVersion: string = '';
	public messageRelease: string = '';
	public controllingAgency: string = '';
	public associationCode: string = '';

	public segments: Segment[] = [];

	public declaredSegmentCount: number = 0;
}
