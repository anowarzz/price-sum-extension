# Chrome Extension

This is a simple Chrome extension that demonstrates the basic structure and functionality of a Chrome extension.

## Project Structure

- **manifest.json**: Contains metadata about the extension, including its name, version, permissions, and scripts.
- **background.js**: Runs in the background and handles events that do not require a user interface.
- **popup/**: Contains files related to the popup interface.
  - **popup.html**: Defines the HTML structure for the popup.
  - **popup.js**: Contains JavaScript code for the popup.
  - **popup.css**: Contains styles for the popup.
- **content-scripts/**: Contains scripts that run in the context of web pages.
  - **content.js**: Interacts with the DOM of the pages the user visits.
- **icons/**: Contains icon images for the extension.
  - **icon16.png**: Icon for the browser toolbar.
  - **icon48.png**: Icon for the Chrome Web Store.
  - **icon128.png**: Icon for the Chrome Web Store.

## Installation

1. Clone the repository or download the files.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" by toggling the switch in the top right corner.
4. Click on "Load unpacked" and select the directory containing the extension files.

## Usage

- Click on the extension icon in the browser toolbar to open the popup.
- The background script will handle any necessary background tasks.
- The content script will interact with the web pages you visit based on the defined permissions in the manifest.

## License

This project is licensed under the MIT License.