# Watch Widget VS Code Extension

A powerful VS Code extension that adds customizable NPM script execution options to the folder context menu in the Explorer. This extension allows you to quickly run any NPM script from package.json files directly from the VS Code interface with full customization support.

## Features

- **Dynamic Script Detection**: Automatically discovers NPM scripts from package.json files
- **Customizable Context Menu**: Configure which scripts appear in the right-click menu
- **Script Picker Interface**: Quick pick dialog to select and run any available script
- **Flexible Configuration**: Choose between showing all scripts or only selected ones
- **Terminal Integration**: Automatically opens terminals with proper working directories
- **Multiple Script Support**: Handle different scripts across different folders
- **Visual Feedback**: Shows notifications and detailed script information

## Usage

### Basic Usage

1. Right-click on any folder in the VS Code Explorer
2. Select "NPM Scripts" from the context menu
3. Choose from the available options:
   - **Run NPM Script**: Opens a picker with all available/enabled scripts
   - **Configure Script Menu**: Set which scripts appear in the menu
   - **Refresh Available Scripts**: Reload script detection

### Configuration

The extension provides several configuration options:

#### Enable/Disable Scripts
- Use the "Configure Script Menu" option to select which scripts show in the context menu
- Scripts are filtered based on your selections across all workspace folders

#### Settings

Access these settings via VS Code Settings (`Ctrl+,`) and search for "Watch Widget":

- **`watchWidget.enabledScripts`**: Array of script names to show in context menu (default: `["watch", "dev", "start", "build", "test"]`)
- **`watchWidget.maxScriptsShown`**: Maximum number of scripts in the menu (default: `10`)
- **`watchWidget.showAllScripts`**: Show all scripts regardless of enabled list (default: `false`)
- **`watchWidget.scriptPrefix`**: Command prefix for running scripts (default: `"npm run"`)

#### Example Settings

```json
{
  "watchWidget.enabledScripts": ["watch", "dev", "start", "build", "test", "lint"],
  "watchWidget.maxScriptsShown": 8,
  "watchWidget.showAllScripts": false,
  "watchWidget.scriptPrefix": "npm run"
}
```

## Requirements

- VS Code version 1.74.0 or higher
- Node.js and npm installed on your system
- Folders with `package.json` files containing `scripts` section

## Installation

### From Source
1. Clone this repository
2. Run `npm install` to install dependencies
3. Press `F5` to run the extension in a new Extension Development Host window

### From Package
1. Package the extension using `vsce package`
2. Install the generated `.vsix` file via VS Code's Extensions view

## Development

### Building

```bash
npm run compile
```

### Watch Mode

```bash
npm run watch
```

### Package Extension

```bash
vsce package
```

## How It Works

The extension:
1. **Scans** package.json files in workspace folders and right-clicked directories
2. **Filters** available scripts based on your configuration
3. **Creates** dynamic context menu items and commands
4. **Executes** scripts in terminals with proper working directories
5. **Manages** script visibility and customization through VS Code settings

## Supported Script Examples

The extension works with any NPM scripts defined in package.json:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "watch": "webpack --watch",
    "build": "webpack --mode production",
    "test": "jest",
    "lint": "eslint src/",
    "deploy": "npm run build && deploy.sh"
  }
}
```

## Troubleshooting

- **No scripts showing**: Ensure the folder has a package.json with a scripts section
- **Scripts not updating**: Use "Refresh Available Scripts" from the context menu
- **Wrong scripts showing**: Configure enabled scripts in settings or via the context menu

## License

MIT - see [License.md](License.md) for details

## Author

Pratik Bali

## Version History

### 0.0.1
- Initial release with basic functionality
- Dynamic script detection and execution
- Customizable script filtering and configuration
- Context menu integration with submenu support
- Settings-based customization
- Multi-workspace support
