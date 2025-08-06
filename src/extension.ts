import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

interface PackageJson {
    scripts?: { [key: string]: string };
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Hydra Npm Scripts Runner extension activated');

    const registeredScriptCommands: vscode.Disposable[] = [];

    // Helper function to get enabled scripts for a folder
    function getEnabledScripts(folderPath: string): string[] {
        try {
            const config = vscode.workspace.getConfiguration('hydraNpmScriptsRunner');
            const enabledScripts = config.get<{ [key: string]: string[] }>('enabledScripts', {});
            const scripts = enabledScripts[folderPath] || [];
            console.log(`Retrieved enabled scripts for ${folderPath}:`, scripts);
            return scripts;
        } catch (error) {
            console.error('Error retrieving enabled scripts:', error);
            return [];
        }
    }

    // Helper function to set enabled scripts for a folder
    async function setEnabledScripts(folderPath: string, scripts: string[]) {
        try {
            const config = vscode.workspace.getConfiguration('hydraNpmScriptsRunner');
            const enabledScripts = config.get<{ [key: string]: string[] }>('enabledScripts', {});
            enabledScripts[folderPath] = scripts;
            
            // Try both workspace and global targets for better persistence
            try {
                await config.update('enabledScripts', enabledScripts, vscode.ConfigurationTarget.Workspace);
                console.log(`Saved enabled scripts to workspace config for ${folderPath}:`, scripts);
            } catch (workspaceError) {
                console.warn('Failed to save to workspace, trying global:', workspaceError);
                await config.update('enabledScripts', enabledScripts, vscode.ConfigurationTarget.Global);
                console.log(`Saved enabled scripts to global config for ${folderPath}:`, scripts);
            }
        } catch (error) {
            console.error('Error saving enabled scripts:', error);
            vscode.window.showErrorMessage('Failed to save script configuration: ' + error);
        }
    }

    // Helper function to read package.json scripts
    function readPackageJsonScripts(folderPath: string): { [key: string]: string } {
        const packageJsonPath = path.join(folderPath, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            return {};
        }
        try {
            const pkg: PackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            return pkg.scripts || {};
        } catch (error) {
            console.error('Error reading package.json:', error);
            return {};
        }
    }

    // Helper function to create and run a task
    async function runScript(folderPath: string, scriptName: string, scripts: { [key: string]: string }) {
        const folderName = path.basename(folderPath);
        
        // Create a truly unique task identifier using multiple unique factors
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 11);
        const uniqueId = `${timestamp}-${randomId}`;
        
        // Create a completely unique task definition that VS Code won't match with existing tasks
        const task = new vscode.Task(
            { 
                type: 'npm',  // Changed to npm type for better recognition
                script: scriptName,
                path: folderPath,
                uniqueId: uniqueId,  // This makes each task completely unique
                timestamp: timestamp
            },
            vscode.TaskScope.Workspace,
            `${scriptName}`,  // Simple name for the loading animation
            'npm',  // Changed source to npm for proper loading animation
            new vscode.ShellExecution(`npm run ${scriptName}`, { cwd: folderPath })
        );
        
        // Configure task presentation for proper loading animation and concurrency
        task.group = vscode.TaskGroup.Build;
        task.presentationOptions = {
            echo: true,
            reveal: vscode.TaskRevealKind.Always,
            focus: false,
            panel: vscode.TaskPanelKind.New,  // Each task gets its own terminal
            clear: false,
            showReuseMessage: false
        };
        
        // Mark as background task to get the loading animation
        task.isBackground = true;
        
        // Add problem matcher to detect when the task starts and stops (for loading animation)
        task.problemMatchers = [];
        
        await vscode.tasks.executeTask(task);
        vscode.window.showInformationMessage(`Started '${scriptName}' in ${folderName}`);
    }

    // Helper function to refresh dynamic script commands
    async function refreshScriptCommands(uri: vscode.Uri) {
        // Dispose previous dynamic commands
        registeredScriptCommands.forEach(d => d.dispose());
        registeredScriptCommands.length = 0;

        if (!uri?.fsPath) return;

        const scripts = readPackageJsonScripts(uri.fsPath);
        const enabledScripts = getEnabledScripts(uri.fsPath);

        // Register commands for enabled scripts
        enabledScripts.forEach(scriptName => {
            if (scripts[scriptName]) {
                const commandId = `watchWidget.runScript.${scriptName}`;
                const disposable = vscode.commands.registerCommand(commandId, async () => {
                    await runScript(uri.fsPath, scriptName, scripts);
                });
                registeredScriptCommands.push(disposable);
            }
        });
    }

    // Register the main watch widget command
    const watchWidgetCommand = vscode.commands.registerCommand('watchWidget.watchWidget', async (uri: vscode.Uri) => {
        if (uri?.fsPath) {
            const scripts = readPackageJsonScripts(uri.fsPath);
            if (scripts['watch']) {
                await runScript(uri.fsPath, 'watch', scripts);
            } else {
                vscode.window.showErrorMessage('No "watch" script found in package.json');
            }
        } else {
            vscode.window.showErrorMessage('Please select a folder to run Hydra Npm Scripts Runner');
        }
    });

    // Register the build command
    const buildCommand = vscode.commands.registerCommand('watchWidget.build', async (uri: vscode.Uri) => {
        if (uri?.fsPath) {
            const scripts = readPackageJsonScripts(uri.fsPath);
            if (scripts['build']) {
                await runScript(uri.fsPath, 'build', scripts);
            } else {
                vscode.window.showErrorMessage('No "build" script found in package.json');
            }
        } else {
            vscode.window.showErrorMessage('Please select a folder');
        }
    });

    // Register the default watch command
    const defaultWatchCommand = vscode.commands.registerCommand('watchWidget.defaultWatch', async (uri: vscode.Uri) => {
        if (uri?.fsPath) {
            const scripts = readPackageJsonScripts(uri.fsPath);
            if (scripts['watch']) {
                await runScript(uri.fsPath, 'watch', scripts);
            } else {
                vscode.window.showErrorMessage('No "watch" script found in package.json');
            }
        } else {
            vscode.window.showErrorMessage('Please select a folder');
        }
    });

    // Register the more scripts command to show a Quick Pick of all scripts
    const moreScriptsCommand = vscode.commands.registerCommand('watchWidget.moreScripts', async (uri: vscode.Uri) => {
        if (!uri?.fsPath) {
            vscode.window.showErrorMessage('Please select a folder to view scripts');
            return;
        }

        const scripts = readPackageJsonScripts(uri.fsPath);
        const scriptNames = Object.keys(scripts);

        if (scriptNames.length === 0) {
            vscode.window.showInformationMessage('No scripts found in package.json');
            return;
        }

        const selected = await vscode.window.showQuickPick(
            scriptNames.map(s => ({ label: s, description: scripts[s] })),
            { placeHolder: 'Select an npm script to run' }
        );

        if (selected) {
            await runScript(uri.fsPath, selected.label, scripts);
        }
    });

    // Register the configure scripts command
    const configureScriptsCommand = vscode.commands.registerCommand('watchWidget.configureScripts', async (uri: vscode.Uri) => {
        if (!uri?.fsPath) {
            vscode.window.showErrorMessage('Please select a folder to configure scripts');
            return;
        }

        // Check if we're in a workspace
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            vscode.window.showWarningMessage('No workspace is open. Configuration may not persist between sessions.');
        }

        const scripts = readPackageJsonScripts(uri.fsPath);
        const scriptNames = Object.keys(scripts);

        if (scriptNames.length === 0) {
            vscode.window.showInformationMessage('No scripts found in package.json');
            return;
        }

        const enabledScripts = getEnabledScripts(uri.fsPath);
        console.log('Current enabled scripts before configuration:', enabledScripts);

        const quickPick = vscode.window.createQuickPick();
        quickPick.items = scriptNames.map(scriptName => ({
            label: scriptName,
            description: scripts[scriptName],
            picked: enabledScripts.includes(scriptName)
        }));
        quickPick.canSelectMany = true;
        quickPick.placeholder = 'Select scripts to show in the More Scripts menu';
        quickPick.title = `Configure Scripts for ${path.basename(uri.fsPath)}`;

        quickPick.onDidAccept(async () => {
            const selectedScripts = quickPick.selectedItems.map(item => item.label);
            console.log('Selected scripts:', selectedScripts);
            
            try {
                await setEnabledScripts(uri.fsPath, selectedScripts);
                
                // Verify the configuration was saved by reading it back
                const verifyConfig = vscode.workspace.getConfiguration('hydraNpmScriptsRunner');
                const verifyScripts = verifyConfig.get<{ [key: string]: string[] }>('enabledScripts', {});
                const savedScripts = verifyScripts[uri.fsPath] || [];
                console.log('Verification - scripts saved:', savedScripts);
                
                if (savedScripts.length !== selectedScripts.length || 
                    !selectedScripts.every(script => savedScripts.includes(script))) {
                    vscode.window.showWarningMessage('Configuration may not have been saved properly. Please check the output console.');
                } else {
                    await refreshScriptCommands(uri);
                    vscode.window.showInformationMessage(
                        `Configured ${selectedScripts.length} scripts for ${path.basename(uri.fsPath)}`
                    );
                }
            } catch (error) {
                console.error('Error configuring scripts:', error);
                vscode.window.showErrorMessage('Failed to configure scripts: ' + error);
            }
            
            quickPick.hide();
        });

        quickPick.show();
    });

    // Register the refresh scripts command
    const refreshScriptsCommand = vscode.commands.registerCommand('watchWidget.refreshScripts', async (uri: vscode.Uri) => {
        await refreshScriptCommands(uri);
        vscode.window.showInformationMessage('Scripts refreshed for this folder.');
    });

    // Register debug command to show current configuration
    const debugConfigCommand = vscode.commands.registerCommand('watchWidget.debugConfig', async (uri: vscode.Uri) => {
        if (!uri?.fsPath) {
            vscode.window.showErrorMessage('Please select a folder');
            return;
        }
        
        const config = vscode.workspace.getConfiguration('hydraNpmScriptsRunner');
        const allEnabledScripts = config.get<{ [key: string]: string[] }>('enabledScripts', {});
        const folderScripts = getEnabledScripts(uri.fsPath);
        
        const workspaceInfo = {
            hasWorkspace: !!vscode.workspace.workspaceFolders,
            workspaceFolders: vscode.workspace.workspaceFolders?.map(f => f.uri.fsPath) || [],
            workspaceFile: vscode.workspace.workspaceFile?.fsPath || 'none',
            name: vscode.workspace.name || 'unnamed'
        };
        
        const configInspection = config.inspect('enabledScripts');
        
        const debugInfo = {
            folderPath: uri.fsPath,
            folderName: path.basename(uri.fsPath),
            enabledScriptsForFolder: folderScripts,
            allEnabledScripts: allEnabledScripts,
            workspace: workspaceInfo,
            configInspection: {
                globalValue: configInspection?.globalValue || {},
                workspaceValue: configInspection?.workspaceValue || {},
                workspaceFolderValue: configInspection?.workspaceFolderValue || {},
                defaultValue: configInspection?.defaultValue || {}
            }
        };
        
        const message = JSON.stringify(debugInfo, null, 2);
        console.log('Debug Configuration Info:', message);
        
        // Show a summary message
        vscode.window.showInformationMessage(
            `Scripts for ${path.basename(uri.fsPath)}: ${folderScripts.join(', ') || 'None'}. Full debug info in console.`
        );
        
        // Also create a temporary document with the debug info
        try {
            const doc = await vscode.workspace.openTextDocument({
                content: message,
                language: 'json'
            });
            await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
        } catch (error) {
            console.log('Could not open debug document:', error);
        }
    });

    // Register internal refresh command
    const refreshScriptCommandsCommand = vscode.commands.registerCommand('watchWidget.refreshScriptCommands', refreshScriptCommands);

    // Auto-refresh scripts when workspace configuration changes
    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('hydraNpmScriptsRunner.enabledScripts')) {
            // Refresh for all workspace folders
            if (vscode.workspace.workspaceFolders) {
                vscode.workspace.workspaceFolders.forEach(folder => {
                    refreshScriptCommands(folder.uri);
                });
            }
        }
    });

    context.subscriptions.push(
        watchWidgetCommand,
        buildCommand,
        defaultWatchCommand,
        moreScriptsCommand,
        configureScriptsCommand,
        refreshScriptsCommand,
        refreshScriptCommandsCommand,
        debugConfigCommand,
        ...registeredScriptCommands
    );
}

export function deactivate() {
    console.log('Hydra Npm Scripts Runner extension deactivated');
}
