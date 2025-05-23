const vscode = require('vscode');
let fs = require("fs");
let path = require("path");
let axios = require("axios");
let { format, parse } = require("../lib/http-parser.js");

let extensionPath = path.join(__dirname, "..");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	extensionPath = context.extensionPath;

	// create output channel
	let outputChannel = vscode.window.createOutputChannel("HTTP Format");
	outputChannel.appendLine('HTTP Format extension activated'); // Add this line to test


	(async () => {

		['http', 'rest', 'plaintext'].forEach((lang) => {
			context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(lang, {
				provideDocumentFormattingEdits(document, options, token) {
					text = document.getText().trim() + "\n";
					text = text.replace(/\r\n/g, '\n');
					const [formattedText, error] = format(text);

					if (text.replace(/[\s\n\r\t]/g, '') != formattedText.replace(/[\s\n\r\t]/g, '')) {
						outputChannel.appendLine('Content corrupted after formatting. Not applying changes.');
						vscode.window.showInformationMessage("HTTP Format: Failed to format. File is too complex.");
						return [];
					}

					// if before and after are the same, log that nothing changed
					if (text.trim() === formattedText.trim()) {
						outputChannel.appendLine('Content before and after are the same. Format had no effect.');
						return [];
					}

					if (error || !formattedText) {
						outputChannel.appendLine('Error: ' + error);
						return [];
					}

					outputChannel.appendLine('Formatting successful.');
					return [
						vscode.TextEdit.replace(
							new vscode.Range(0, 0, document.lineCount, 0),
							formattedText
						)
					];
				}
			}));
		});
	})();

}

function deactivate() { }


module.exports = {
	activate,
	deactivate
}


function safe(fn, onError = () => { }) {
	try {
		let res = fn();
		if (res instanceof Promise) {
			return (async (resolve, reject) => {
				try {
					return (await res);
				} catch (e) {
					if (onError) onError(e);
					return null;
				}
			})();
		} else {
			return res;
		}
	} catch (e) {
		if (onError) onError(e);
		return null;
	}
}

