import type Segment from '../segment.js';

export default class Message {
  public messageReferenceNumber = '';

  public messageType = '';

  public messageVersion = '';

  public messageRelease = '';

  public controllingAgency = '';

  public associationCode = '';

  public segments: Segment[] = [];

  public declaredSegmentCount = 0;
}
