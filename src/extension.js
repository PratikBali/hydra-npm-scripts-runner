"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const path = require("path");
function activate(context) {
    console.log('Watch Widget extension is now active!');
    let disposable = vscode.commands.registerCommand('watchWidget.watchFolder', (uri) => {
        if (uri && uri.fsPath) {
            const folderPath = uri.fsPath;
            const folderName = path.basename(folderPath);
            // Create a new terminal with the folder path as working directory
            const terminal = vscode.window.createTerminal({
                name: `Watch: ${folderName}`,
                cwd: folderPath
            });
            // Show the terminal
            terminal.show();
            // Send the npm run watch command
            terminal.sendText('npm run watch');
            // Show a notification
            vscode.window.showInformationMessage(`Started watching ${folderName}`);
        }
        else {
            vscode.window.showErrorMessage('No folder selected');
        }
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map