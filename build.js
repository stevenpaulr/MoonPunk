#!/usr/bin/env node
// Configuration

// Code below
const pug = require("pug"),
	sass = require("node-sass"),
	fs = require("fs"),
	data = fs.readFileSync("Source/data.json", "utf8");

const options = {
	data: JSON.parse(data),
	pretty: true,
	translation: JSON.parse(fs.readFileSync("translation.json", "utf8")),
	workers: "\n\"use strict\";\n" +
		`const data = ${data.trim()};\n` +
		`${fs.readFileSync("Source/sheetworkers.js", "utf8").trim()}\n`
};

const printOutput = (() => {
	let calledBefore = false,
		t0 = process.hrtime();
	return () => {
		if (!calledBefore) calledBefore = true;
		else {
			console.log(`Sheet build completed. Time taken: ${
				(process.hrtime(t0)[0] + (process.hrtime(t0)[1] / 1e9)).toFixed(3)
			} s.`);
		}
	};
})();


// Build CSS file
sass.render({
	file: "Source/moonpunk.scss",
	outputStyle: "expanded",
}, (error, result) => {
	if (!error) {
		const cssOutput = result.css.toString("utf8").replace(/^@charset "UTF-8";\s*/, "").replace(/^\uFEFF/, "").replace(/\n\n/g, "\n");
		fs.writeFile("moonpunk.css", cssOutput, printOutput);
	} else {
		console.log(`An error occured in the CSS build.\n${error.line}:${error.column} ${error.message}.`);
	}
});

// Build HTML
const htmlOutput = pug.renderFile("Source/moonpunk.pug", options).trim().replace(/\n+/g, "\n");
fs.writeFile("moonpunk.html", `${htmlOutput}\n`, printOutput);