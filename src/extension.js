"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const path = require("path");
function activate(context) {
    console.log('Watch Widget extension is now active!');
    let disposable = vscode.commands.registerCommand('watchWidget.watchFolder', async (uri) => {
        if (uri && uri.fsPath) {
            const folderPath = uri.fsPath;
            const folderName = path.basename(folderPath);
            // Create a VS Code Task for npm run watch in the selected folder
            const task = new vscode.Task(
                { type: 'shell', task: 'watch', folder: folderName },
                vscode.TaskScope.Workspace,
                `[${folderName}] Watch`,
                'Watch Widget',
                new vscode.ShellExecution('npm run watch', { cwd: folderPath })
            );
            // Run the task
            await vscode.tasks.executeTask(task);
            vscode.window.showInformationMessage(`Started watching ${folderName} as a VS Code Task`);
        } else {
            vscode.window.showErrorMessage('No folder selected');
        }
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map