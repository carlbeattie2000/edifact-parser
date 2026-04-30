import type Message from '../message/index.js';

export default class Interchange {
  public syntaxIdentifier = '';

  public syntaxVersion = '';

  public senderId = '';

  public recipientId = '';

  public date = '';

  public time = '';

  public controlReference = '';

  public messages: Message[] = [];

  public declaredMessageCount = 0;
}
