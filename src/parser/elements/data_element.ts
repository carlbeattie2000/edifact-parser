import type ComponentDataElement from "./component_data_element.js";

export default class DataElement {
	components: ComponentDataElement[];

	constructor(components: ComponentDataElement[]) {
		this.components = components;
	}

	get Value(): string {
		const headComponent = this.components[0];

		return headComponent?.value ?? "";
	}

	public getComponent(index: number): ComponentDataElement | undefined {
		return this.components[index];
	}

  public addComponent(component: ComponentDataElement) {
    this.components.push(component);
  }
}
