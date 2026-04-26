import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe } from "vitest";
import RawParser from "../src/parser/raw_parser.js";

async function loadExampleBaplieFile() {
	const fileContent = await readFile(
		join(__dirname, "example.baplie"),
		"utf-8",
	);
	return fileContent;
}

describe("Parser", async () => {
	const textContent = await loadExampleBaplieFile();

	const parser = new RawParser(textContent);

	parser
		.tag("UNB", { required: true })
		.tag("UNH", { required: true })
		.tag("BGM", { required: true })
		.tag("DTM", { required: true });

	parser.segmentGroup(
		"RFF",
		(group) => {
			group
				.tag("RFF", { required: true })
				.tag("DTM", { required: false, repeatable: 9 });
		},
		{ repeatable: 9 },
	);

	parser.segmentGroup(
		"NAD",
		(group) => {
			group.tag("NAD");
			group.segmentGroup(
				"CTA",
				(subGroup) => {
					subGroup.tag("CTA", { required: true });
					subGroup.tag("COM", { repeatable: 9 });
				},
				{ repeatable: 9 },
			);
		},
		{ repeatable: 9 },
	);

	parser.segmentGroup(
		"TDT",
		(group) => {
			group.tag("TDT", { required: true });
			group.tag("LOC", { required: true, repeatable: 2 });
			group.tag("DTM", { required: true, repeatable: 99 });
			group.tag("RFF");
			group.tag("FTX");
		},
		{ required: true, repeatable: 3 },
	);

	parser.segmentGroup(
		"LOC",
		(group) => {
			group.tag("LOC", { required: true });
			group.tag("GID");
			group.tag("GDS");
			group.tag("FTX", { repeatable: 9 });
			group.tag("MEA", { required: true, repeatable: 9 });
			group.tag("DIM", { repeatable: 9 });
			group.tag("TMP");
			group.tag("RNG");
			group.tag("LOC", { repeatable: 9 });
			group.tag("RFF", { required: true });

			group.segmentGroup(
				"EQD",
				(subGroup) => {
					subGroup.tag("EQD", { required: true });
					subGroup.tag("EQA", { repeatable: 9 });
					subGroup.tag("NAD", { repeatable: 9 });
					subGroup.tag("RFF", { repeatable: 9 });
				},
				{ repeatable: 3 },
			);

			group.segmentGroup(
				"DGS",
				(subGroup) => {
					subGroup.tag("DGS", { required: true });
					subGroup.tag("FTX");
				},
				{ repeatable: 3 },
			);
		},
		{ repeatable: 9999 },
	);

	parser.tag("UNT", { required: true });

	parser.ignore("UNS").ignore("CNT").ignore("UNZ");

	parser.parse();
});
