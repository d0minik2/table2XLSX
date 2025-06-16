# Table to Excel Downloader Chrome Extension

A Chrome extension that allows you to download tables from any website into Excel format.

## Features

- Extract tables from any webpage
- Download tables in Excel format
- Simple and intuitive user interface
- Works on any website with HTML tables

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage

1. Navigate to any webpage containing tables
2. Click the extension icon in your Chrome toolbar
3. Click the "Download Tables to Excel" button
4. Choose where to save the Excel file
5. Open the downloaded file in Excel or any spreadsheet application

## Development

The extension consists of the following files:
- `manifest.json`: Extension configuration
- `popup.html`: User interface
- `popup.js`: Popup logic and table processing
- `content.js`: Content script for table extraction
- `icons/`: Extension icons

## Note

This is a basic implementation that exports tables as CSV format. For better Excel compatibility, you might want to integrate a library like SheetJS to create proper .xlsx files. 