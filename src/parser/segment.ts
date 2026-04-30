import type DataElement from "./elements/data_element.js";

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

  public getQualifier(): string | undefined {
    return this.getDataElement(0)?.getComponent(0)?.value;
  }
}
