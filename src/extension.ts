import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('Watch Widget extension activated');

    // Register the watch widget command
    const watchWidgetCommand = vscode.commands.registerCommand('watchWidget.watchWidget', async (uri: vscode.Uri) => {
        if (uri?.fsPath) {
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
            await vscode.tasks.executeTask(task);
            vscode.window.showInformationMessage(`Started watching ${folderName} as a VS Code Task`);
        } else {
            vscode.window.showErrorMessage('Please select a folder to run watch widget');
        }
    });

    // Register the configure scripts command
    const configureScriptsCommand = vscode.commands.registerCommand('watchWidget.configureScripts', () => {
        vscode.window.showInformationMessage('Configure Scripts - This opens VS Code settings for the extension');
        vscode.commands.executeCommand('workbench.action.openSettings', 'watchWidget');
    });

    context.subscriptions.push(watchWidgetCommand, configureScriptsCommand);
}

export function deactivate() {
    console.log('Watch Widget extension deactivated');
}
