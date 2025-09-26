# ToastUI-GDS

This repository contains a customized version of:

* [Toast UI Editor v2.3.0](https://github.com/nhn/tui.editor/tree/editor%402.3.0)
* [Toast UI Color Picker v2.2.6](https://github.com/nhn/tui.color-picker/tree/v2.2.6)

The goal is to adapt these libraries to align with the **GDS (Government Digital Service) Design System guidelines**, ensuring that they can be used consistently in services that follow UK Government accessibility, usability, and design standards.

---

## Planned Changes

To ensure compliance with [GDS Design System guidelines](https://design-system.service.gov.uk/), the following changes will be applied:

* **Colors**
  Update the Color Picker palette to match GDS accessible colors while allowing:

  * Custom configuration of colors
  * Enable/disable of the color slider

* **Accessibility (A11y)**

  * Ensure contrast ratios meet WCAG 2.1 AA standards
  * Add ARIA labels and semantic HTML where needed

* **UI Consistency**
  * Adjust spacing, button styles, focus states, and other components to match GOV.UK patterns.

* **Simplification**
  * Remove or disable features that conflict with GDS principles (if any).

---

## Node & npm Requirements

This project requires:

* **Node.js v16 (LTS)**
* **npm v8.19.4**

The easiest way to manage this setup is via [NVM](https://github.com/nvm-sh/nvm?tab=readme-ov-file#node-version-manager---).

### Setup

1. Install Node.js 16:

   ```bash
   nvm install 16
   nvm use 16
   ```

   You should see:

   ```
   Now using node v16.20.2 (npm v8.19.4)
   ```

2. Install dependencies for the **editor** project:

   ```bash
   cd tui.editor-editor-2.3.0
   npm install
   ```

3. Run the full clean-and-reinstall process (recommended after the first install):

   ```bash
   npm run clean-and-reinstall
   ```

   This script will:

   * Wipe existing dependencies and caches
   * Reinstall everything from scratch
   * Ensure dependencies are installed not only for the editor but also for all included plugins and libraries

After this, you’re ready to start developing within the **main editor project**.

---

## Working on Color-Syntax & Color-Picker

This repo includes both the **color-syntax plugin** and the **color-picker project**, which can be developed independently.

### Color-Syntax Plugin

The **color-syntax plugin** integrates color highlighting into the editor.

* Location: `/tui.editor-editor-2.3.0/plugins/color-syntax`
* Dependencies: *Already installed from clean-and-reinstall script.*
* Build the plugin:

  ```bash
  cd /tui.editor-editor-2.3.0/
  npm run build:color-syntax
  ```

### Color-Picker

The **color-picker project** is a separate dependency used by both the editor and color-syntax.

* Location: `/tui.color-picker-2.2.6`
* Install dependencies:

  ```bash
  cd tui.color-picker-2.2.6
  npm install
  ```
* Build the library:

  ```bash
  npm run bundle
  ```

Changes made here will need to be fed into the editor once rebuilt and linked.
