import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    // NOTE: vscode.window.onDidShowMenuItem does not exist. 
    // If you want to refresh script commands, you should call 'watchWidget.refreshScriptCommands' from a supported event or context menu command.
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

    // Register the more scripts command to show a Quick Pick of all scripts in package.json
    const moreScriptsCommand = vscode.commands.registerCommand('watchWidget.moreScripts', async (uri: vscode.Uri) => {
        if (!uri?.fsPath) {
            vscode.window.showErrorMessage('Please select a folder to view scripts');
            return;
        }
        const fs = require('fs');
        const pathModule = require('path');
        const packageJsonPath = pathModule.join(uri.fsPath, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            vscode.window.showErrorMessage('No package.json found in the selected folder');
            return;
        }
        let scripts: any = {};
        try {
            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            scripts = pkg.scripts || {};
        } catch (e) {
            vscode.window.showErrorMessage('Failed to read package.json');
            return;
        }
        const scriptNames = Object.keys(scripts);
        if (scriptNames.length === 0) {
            vscode.window.showInformationMessage('No scripts found in package.json');
            return;
        }
        const selected = await vscode.window.showQuickPick(scriptNames.map(s => ({ label: s, description: scripts[s] })), {
            placeHolder: 'Select an npm script to run'
        });
        if (selected) {
            const task = new vscode.Task(
                { type: 'shell', task: selected.label, folder: path.basename(uri.fsPath) },
                vscode.TaskScope.Workspace,
                `[${path.basename(uri.fsPath)}] ${selected.label}`,
                'Watch Widget',
                new vscode.ShellExecution(`npm run ${selected.label}`, { cwd: uri.fsPath })
            );
            await vscode.tasks.executeTask(task);
            vscode.window.showInformationMessage(`Started script '${selected.label}' in ${path.basename(uri.fsPath)}`);
        }
    });

    // Register a refresh scripts command for the submenu
    const refreshScriptsCommand = vscode.commands.registerCommand('watchWidget.refreshScripts', async (uri: vscode.Uri) => {
        await vscode.commands.executeCommand('watchWidget.refreshScriptCommands', uri);
        vscode.window.showInformationMessage('Scripts refreshed for this folder. Now open the More Scripts submenu again.');
    });

    // Dynamically register commands for each script in package.json when a folder is right-clicked
    const fs = require('fs');
    const pathModule = require('path');
    const registeredScriptCommands: vscode.Disposable[] = [];

    vscode.commands.registerCommand('watchWidget.refreshScriptCommands', async (uri: vscode.Uri) => {
        // Dispose previous dynamic commands
        registeredScriptCommands.forEach(d => d.dispose());
        registeredScriptCommands.length = 0;

        if (!uri?.fsPath) return;
        const packageJsonPath = pathModule.join(uri.fsPath, 'package.json');
        if (!fs.existsSync(packageJsonPath)) return;
        let scripts: any = {};
        try {
            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            scripts = pkg.scripts || {};
        } catch (e) {
            return;
        }
        Object.keys(scripts).forEach(scriptName => {
            const commandId = `watchWidget.runScript.${scriptName}`;
            const disposable = vscode.commands.registerCommand(commandId, async (uri2: vscode.Uri) => {
                const task = new vscode.Task(
                    { type: 'shell', task: scriptName, folder: path.basename(uri.fsPath) },
                    vscode.TaskScope.Workspace,
                    `[${path.basename(uri.fsPath)}] ${scriptName}`,
                    'Watch Widget',
                    new vscode.ShellExecution(`npm run ${scriptName}`, { cwd: uri.fsPath })
                );
                await vscode.tasks.executeTask(task);
                vscode.window.showInformationMessage(`Started script '${scriptName}' in ${path.basename(uri.fsPath)}`);
            });
            registeredScriptCommands.push(disposable);
        });
    });

    context.subscriptions.push(watchWidgetCommand, moreScriptsCommand, refreshScriptsCommand, ...registeredScriptCommands);
}

export function deactivate() {
    console.log('Watch Widget extension deactivated');
}
