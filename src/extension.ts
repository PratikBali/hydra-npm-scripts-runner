import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('Watch Widget extension activated');

    // Register the watch widget command
    const watchWidgetCommand = vscode.commands.registerCommand('watchWidget.watchWidget', (uri: vscode.Uri) => {
        console.log('Watch Widget command triggered!');
        console.log('URI received:', uri);
        
        if (uri?.fsPath) {
            // Get folder name from the path
            const folderName = path.basename(uri.fsPath);
            console.log('Watch Widget: Creating terminal for folder:', folderName);
            console.log('Full path:', uri.fsPath);
            
            // Create terminal with folder name and loading icon
            const terminalName = `🔄 [${folderName}]`;
            console.log('Terminal name will be:', terminalName);
            
            const terminal = vscode.window.createTerminal({
                name: terminalName,
                cwd: uri.fsPath
            });
            
            console.log('Terminal created with name:', terminal.name);
            terminal.show();
            terminal.sendText('npm run watch');
            
            // Show info message to confirm folder name
            vscode.window.showInformationMessage(`Started Watch Widget for folder: ${folderName}`);
        } else {
            console.log('No URI or fsPath provided');
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
