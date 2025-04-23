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

	(async () => {

		['http', 'rest', 'plaintext'].forEach((lang) => {
			context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(lang, {
				provideDocumentFormattingEdits(document, options, token) {
					text = document.getText().trim() + "\n";
					text = text.replace(/\r\n/g, '\n');
					const [formattedText, error] = format(text);

					if (text.replace(/[\s\n\r\t]/g, '') != formattedText.replace(/[\s\n\r\t]/g, '')) {
						console.log('likely corrupted');
						vscode.window.showInformationMessage("HTTP Format: Detected Inconsitent Format, Are you sure its a HTTP File? Else Likely an Issue with the Formatter. Please Report to Developer for Fix.");
						return [];
					}

					if (error || !formattedText) {
						console.log('error', error);
						return [];
					}

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

