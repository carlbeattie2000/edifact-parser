import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import Parser from "../src/parser/index.js";

async function loadExampleBaplieFile() {
	const fileContent = await readFile(
		join(__dirname, "example.baplie"),
		"utf-8",
	);
	return fileContent;
}

describe('', async () => {
  const textContent = await loadExampleBaplieFile();
  const parser = new Parser(textContent);
  parser.parse();
});

describe("Parser.split", () => {
  const parser = new Parser('')

  it("splits on delimiter", () => {
    const result = parser.split("hello'world", "'", false)
    expect(result).toEqual(["hello", "world"])
  })

  it("keeps escaped delimiter when escape=true", () => {
    const result = parser.split("hello?'world'end", "'", false)
    expect(result).toEqual(["hello?'world", "end"])
  })

  it("drops escape character when escape=false", () => {
    const result = parser.split("hello?'world'end", "'", true)
    expect(result).toEqual(["hello'world", "end"])
  })

  it("handles consecutive delimiters as empty tokens", () => {
    const result = parser.split("hello''world", "'", false)
    expect(result).toEqual(["hello", "", "world"])
  })

  it("handles escaped data element separator", () => {
    const result = parser.split("hello?+world+end", "+", true)
    expect(result).toEqual(["hello+world", "end"])
  })

  it("returns single token when no delimiter found", () => {
    const result = parser.split("hello", "'", false)
    expect(result).toEqual(["hello"])
  })

  it("handles empty input", () => {
    const result = parser.split("", "'", false)
    expect(result).toEqual([])
  })
})
