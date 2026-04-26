import type DataElement from "./data_element.js";

export default class Segment {
  tag: string;
  dataElements: DataElement[];

  constructor(tag: string, dataElements: DataElement[]) {
    this.tag = tag;
    this.dataElements = dataElements;
  }

  public getDataElement(index: number): DataElement | undefined {
    return this.dataElements[index];
  }
}
