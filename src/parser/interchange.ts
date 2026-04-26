import type Message from "./message.js";

export default class Interchange {
	public syntaxIdentifier: string;
	public syntaxVersion: string;
	public senderId: string;
	public recipientId: string;
	public date: string;
	public time: string;
	public controlReference: string;

	public messages: Message[];

	public declaredMessageCount: number;

	constructor(
		syntaxIndentifier: string,
		syntaxVersion: string,
		senderId: string,
		recipientId: string,
		date: string,
		time: string,
		controlReference: string,
		messages: Message[],
		declaredMessageCount: number,
	) {
		this.syntaxIdentifier = syntaxIndentifier;
		this.syntaxVersion = syntaxVersion;
		this.senderId = senderId;
		this.recipientId = recipientId;
		this.date = date;
		this.time = time;
		this.controlReference = controlReference;

		this.messages = messages;

		this.declaredMessageCount = declaredMessageCount;
	}
}
