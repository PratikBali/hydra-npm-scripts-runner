# Example Package.json for Testing

Create a folder with this package.json to test the extension:

```json
{
  "name": "test-project",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon app.js --watch",
    "build": "webpack --mode production",
    "watch": "webpack --watch --mode development",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "serve": "http-server dist/",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

With this setup, you can:
1. Right-click on the folder containing this package.json
2. Select "NPM Scripts" from the context menu
3. See all the configured scripts available for execution
4. Configure which scripts appear in the menu via settings
