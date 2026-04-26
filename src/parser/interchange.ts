import type Message from "./message.js";

export default class Interchange {
	public syntaxIdentifier: string = '';
	public syntaxVersion: string = '';
	public senderId: string = '';
	public recipientId: string = '';
	public date: string = '';
	public time: string = '';
	public controlReference: string = '';

	public messages: Message[] = [];

	public declaredMessageCount: number = 0;
}
