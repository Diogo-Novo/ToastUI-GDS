/**
 * @fileoverview default UI with external toolbar support
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */
import css from 'tui-code-snippet/domUtil/css';
import addClass from 'tui-code-snippet/domUtil/addClass';
import removeClass from 'tui-code-snippet/domUtil/removeClass';

import DefaultToolbar from './defaultToolbar';
import Tab from './tab';
import LayerPopup from './layerpopup';
import ModeSwitch from './modeSwitch';
import PopupAddLink from './popupAddLink';
import PopupAddImage from './popupAddImage';
import PopupTableUtils from './popupTableUtils';
import PopupAddTable from './popupAddTable';
import PopupAddHeading from './popupAddHeading';
import PopupCodeBlockLanguages from './popupCodeBlockLanguages';
import PopupCodeBlockEditor from './popupCodeBlockEditor';
import i18n from '../i18n.js';
import tooltip from './tooltip';
import domUtils from '../utils/dom';

const CLASS_TOOLBAR = 'te-toolbar-section';
const CLASS_MARKDOWN_TAB = 'te-markdown-tab-section';
const CLASS_EDITOR = 'te-editor-section';
const CLASS_MODE_SWITCH = 'te-mode-switch-section';

// Modified: Conditional toolbar section
const CONTAINER_TEMPLATE_WITH_TOOLBAR = [
  '<div class="tui-editor-defaultUI">',
  `<div class="${CLASS_TOOLBAR}"><div class="${CLASS_MARKDOWN_TAB}"></div></div>`,
  `<div class="${CLASS_EDITOR}"></div>`,
  `<div class="${CLASS_MODE_SWITCH}"></div>`,
  '</div>'
].join('');

const CONTAINER_TEMPLATE_WITHOUT_TOOLBAR = [
  '<div class="tui-editor-defaultUI">',
  `<div class="${CLASS_EDITOR}"></div>`,
  `<div class="${CLASS_MODE_SWITCH}"></div>`,
  '</div>'
].join('');

// Template for external toolbar container
const EXTERNAL_TOOLBAR_TEMPLATE = [
  `<div class="${CLASS_TOOLBAR} te-toolbar-external">`,
  `<div class="${CLASS_MARKDOWN_TAB}"></div>`,
  '</div>'
].join('');

class DefaultUI {
  name = 'default';

  el;

  _toolbar;

  _container;

  _editorSection;

  _initialEditType;

  _editor;

  _markdownTabSection;

  _markdownTab;

  _modeSwitch;

  _popups = [];

  _externalToolbarContainer = null;

  _toolbarElement = null;

  _isExternalToolbar = false;

  constructor(editor) {
    this._editor = editor;
    this._initialEditType = editor.options.initialEditType;

    this._init(editor.options);
    this._initEvent();
  }

  _init({ el: container, toolbarItems, hideModeSwitch, toolbarContainer }) {
    // Check if external toolbar container is specified
    this._isExternalToolbar = !!toolbarContainer;

    // Use appropriate template based on toolbar location
    const template = this._isExternalToolbar
      ? CONTAINER_TEMPLATE_WITHOUT_TOOLBAR
      : CONTAINER_TEMPLATE_WITH_TOOLBAR;

    this.el = domUtils.createElementWith(template, container);
    this._container = container;
    this._editorSection = this.el.querySelector(`.${CLASS_EDITOR}`);
    this._editorSection.appendChild(this._editor.layout.getEditorEl());

    // Initialize toolbar in external or internal container
    if (this._isExternalToolbar) {
      this._initExternalToolbar(this._editor.eventManager, toolbarItems, toolbarContainer);
    } else {
      this._initToolbar(this._editor.eventManager, toolbarItems);
    }

    this._initModeSwitch(this._editor.eventManager, hideModeSwitch);

    this._initPopupAddLink();
    this._initPopupAddImage();
    this._initPopupAddTable();
    this._initPopupAddHeading();
    this._initPopupTableUtils();
    this._initPopupCodeBlockLanguages();
    this._initPopupCodeBlockEditor();

    this._initMarkdownTab();
  }

  _initEvent() {
    this._editor.eventManager.listen('hide', this.hide.bind(this));
    this._editor.eventManager.listen('show', this.show.bind(this));
    this._editor.eventManager.listen('changeMode', this._markdownTabControl.bind(this));
    this._editor.eventManager.listen('changePreviewStyle', this._markdownTabControl.bind(this));
  }

  // Original internal toolbar initialization
  _initToolbar(eventManager, toolbarItems) {
    const toolbar = new DefaultToolbar(eventManager, toolbarItems);

    this._toolbar = toolbar;
    this._toolbarElement = this.el.querySelector(`.${CLASS_TOOLBAR}`);
    this._toolbarElement.appendChild(toolbar.el);
  }

  // External toolbar initialization
  _initExternalToolbar(eventManager, toolbarItems, toolbarContainer) {
    let externalContainer;

    // Get the external container element
    if (typeof toolbarContainer === 'string') {
      externalContainer = document.getElementById(toolbarContainer);

      if (!externalContainer) {
        console.warn(`Toolbar container "${toolbarContainer}" not found. Using default location.`);
        this._isExternalToolbar = false;
        this._initToolbar(eventManager, toolbarItems);

        return;
      }
    } else if (toolbarContainer instanceof HTMLElement) {
      externalContainer = toolbarContainer;
    } else {
      console.warn('Invalid toolbarContainer option. Using default location.');
      this._isExternalToolbar = false;
      this._initToolbar(eventManager, toolbarItems);

      return;
    }

    // Store external container reference
    this._externalToolbarContainer = externalContainer;

    // Create toolbar structure element but don't append yet
    const toolbarWrapper = document.createElement('div');

    toolbarWrapper.innerHTML = EXTERNAL_TOOLBAR_TEMPLATE;
    this._toolbarElement = toolbarWrapper.firstChild;

    // Create and append toolbar to the toolbar element
    const toolbar = new DefaultToolbar(eventManager, toolbarItems);

    this._toolbar = toolbar;
    this._toolbarElement.appendChild(toolbar.el);

    // Now append the complete toolbar element to external container
    externalContainer.appendChild(this._toolbarElement);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toolbar._popupDropdownToolbar.hide();
        toolbar._balanceButtons();
      });
    });
  }

  _initModeSwitch(eventManager, hideModeSwitch) {
    const modeSwitchTabBar = this.el.querySelector(`.${CLASS_MODE_SWITCH}`);
    const editType =
      this._initialEditType === 'markdown' ? ModeSwitch.TYPE.MARKDOWN : ModeSwitch.TYPE.WYSIWYG;
    const modeSwitch = new ModeSwitch(modeSwitchTabBar, editType, eventManager);

    this._modeSwitch = modeSwitch;

    if (hideModeSwitch) {
      modeSwitch.hide();
    }

    modeSwitch.on('modeSwitched', (type) => this._editor.changeMode(type));
  }

  _initMarkdownTab() {
    const editor = this._editor;

    this._markdownTab = new Tab({
      initName: i18n.get('Write'),
      items: [i18n.get('Write'), i18n.get('Preview')],
      sections: [editor.layout.getMdEditorContainerEl(), editor.layout.getPreviewEl()]
    });

    // Get markdown tab section from toolbar element (works for both internal and external)
    this._markdownTabSection = this._toolbarElement.querySelector(`.${CLASS_MARKDOWN_TAB}`);
    this._markdownTabSection.appendChild(this._markdownTab.el);

    this._markdownTab.on('itemClick', (itemText) => {
      if (itemText === i18n.get('Preview')) {
        editor.eventManager.emit('previewNeedsRefresh');
        editor.eventManager.emit('changePreviewTabPreview');
        editor.eventManager.emit('closeAllPopup');
      } else {
        editor.getCodeMirror().focus();
        editor.eventManager.emit('changePreviewTabWrite');
      }
    });
  }

  _markdownTabControl() {
    if (this._editor.isMarkdownMode() && this._editor.getCurrentPreviewStyle() === 'tab') {
      css(this._markdownTabSection, { display: 'block' });
      this._markdownTab.activate(i18n.get('Write'));
    } else {
      css(this._markdownTabSection, { display: 'none' });
    }
  }

  _initPopupAddLink() {
    this._popups.push(
      new PopupAddLink({
        target: this.el,
        editor: this._editor
      })
    );
  }

  _initPopupAddImage() {
    this._popups.push(
      new PopupAddImage({
        target: this.el,
        eventManager: this._editor.eventManager
      })
    );
  }

  _initPopupAddTable() {
    // Query from the correct toolbar element
    const tableButton = this._toolbarElement.querySelector('button.tui-table');

    this._popups.push(
      new PopupAddTable({
        target: this._toolbar.el,
        eventManager: this._editor.eventManager,
        button: tableButton,
        css: {
          position: 'absolute'
        }
      })
    );
  }

  _initPopupAddHeading() {
    // Query from the correct toolbar element
    const headingButton = this._toolbarElement.querySelector('button.tui-heading');

    this._popups.push(
      new PopupAddHeading({
        target: this._toolbar.el,
        eventManager: this._editor.eventManager,
        button: headingButton,
        css: {
          position: 'absolute'
        }
      })
    );
  }

  _initPopupTableUtils() {
    this._editor.eventManager.listen('contextmenu', (ev) => {
      if (domUtils.parents(ev.data.target, '[contenteditable=true] table').length > 0) {
        ev.data.preventDefault();
        this._editor.eventManager.emit('openPopupTableUtils', ev.data);
      }
    });

    this._popups.push(
      new PopupTableUtils({
        target: this.el,
        eventManager: this._editor.eventManager
      })
    );
  }

  _initPopupCodeBlockLanguages() {
    const editor = this._editor;

    this._popups.push(
      new PopupCodeBlockLanguages({
        target: this.el,
        eventManager: editor.eventManager,
        languages: editor.codeBlockLanguages
      })
    );
  }

  _initPopupCodeBlockEditor() {
    this._popups.push(
      new PopupCodeBlockEditor({
        target: this.el,
        eventManager: this._editor.eventManager,
        convertor: this._editor.convertor,
        languages: this._editor.codeBlockLanguages
      })
    );
  }

  getToolbar() {
    return this._toolbar;
  }

  setToolbar(toolbar) {
    this._toolbar.destroy();
    this._toolbar = toolbar;
  }

  getModeSwitch() {
    return this._modeSwitch;
  }

  getEditorSectionHeight() {
    const clientRect = this._editorSection.getBoundingClientRect();

    return clientRect.bottom - clientRect.top;
  }

  getEditorHeight() {
    const clientRect = this._container.getBoundingClientRect();

    return clientRect.bottom - clientRect.top;
  }

  getPopupTableUtils() {
    let tablePopup;

    this._popups.forEach((popup) => {
      if (popup instanceof PopupTableUtils) {
        tablePopup = popup;
      }
    });

    return tablePopup;
  }

  hide() {
    addClass(this.el, 'te-hide');

    // Also hide external toolbar if present
    if (this._isExternalToolbar && this._toolbarElement) {
      addClass(this._toolbarElement, 'te-hide');
    }
  }

  show() {
    removeClass(this.el, 'te-hide');

    // Also show external toolbar if present
    if (this._isExternalToolbar && this._toolbarElement) {
      removeClass(this._toolbarElement, 'te-hide');
    }
  }

  remove() {
    domUtils.remove(this.el);

    // Remove external toolbar if present
    if (this._isExternalToolbar && this._toolbarElement) {
      domUtils.remove(this._toolbarElement);
    }

    this._markdownTab.remove();
    this._modeSwitch.remove();
    this._toolbar.destroy();
    this._popups.forEach((popup) => popup.remove());
    this._popups = [];
    tooltip.hide();
  }

  createPopup(options) {
    return new LayerPopup(options);
  }
}

export default DefaultUI;
