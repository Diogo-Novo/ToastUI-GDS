/**
 * @fileoverview Custom GDS-compliant color picker implementation
 * Replaces ToastUI Color Picker with dropdown-style interface
 */

import css from 'tui-code-snippet/domUtil/css';
import on from 'tui-code-snippet/domEvent/on';
import off from 'tui-code-snippet/domEvent/off';

const RESET_COLOR = '#000000';

// Default GDS color palette - used when restrictedMode is true and no preset provided
const DEFAULT_GDS_COLORS = [
  { color: '#d4351c', label: 'Red' },
  { color: '#fd0', label: 'Yellow' },
  { color: '#00703c', label: 'Green' },
  { color: '#1d70b8', label: 'Blue' },
  { color: '#4c2c92', label: 'Purple' },
  { color: '#f499be', label: 'Pink' },
  { color: '#ffdd00', label: 'Gold' },
  { color: '#00a33b', label: 'Light green' },
  { color: '#003078', label: 'Dark blue' },
  { color: '#5694ca', label: 'Light blue' },
  { color: '#0b0c0c', label: 'Black' },
  { color: '#6f777b', label: 'Grey' },
  { color: '#ffffff', label: 'White' }
];

let lastScrollTop = 0;

/**
 * Set style color
 * @param {SquireExt} sq - squire ext instance
 * @param {string} color - color sting value
 * @ignore
 */
function setStyleColor(sq, color) {
  if (!sq.hasFormat('PRE')) {
    if (color === RESET_COLOR) {
      sq.changeFormat(null, {
        class: 'colour',
        tag: 'span'
      });
    } else {
      sq.setTextColour(color);
    }
  }
}

/**
 * Get scrollTop of squire
 * @param {SquireExt} sq - squire ext instance
 * @ignore
 */
function getScrollTopForReFocus(sq) {
  return sq.getRoot().parentNode.scrollTop;
}

/**
 * Process preset colors and extract label mapping
 * @param {Array} presetColors - Array of color strings or objects with color/label
 * @param {boolean} restrictedMode - Whether to restrict to only preset/default colors
 * @returns {Object} Object with colors array and labelMap
 * @ignore
 */
function processPresetColors(presetColors, restrictedMode = false) {
  let colorsToProcess = presetColors;

  // In restricted mode, use default GDS colors if no preset provided
  if (restrictedMode && (!presetColors || presetColors.length === 0)) {
    colorsToProcess = DEFAULT_GDS_COLORS;
  }

  if (!colorsToProcess || !Array.isArray(colorsToProcess)) {
    return { colors: [], labelMap: {} };
  }

  const colors = [];
  const labelMap = {};

  colorsToProcess.forEach(item => {
    if (typeof item === 'string') {
      colors.push(item);
      labelMap[item] = item; // Use hex as fallback label
    } else if (item && typeof item === 'object' && item.color) {
      colors.push(item.color);
      labelMap[item.color] = item.label || item.color;
    }
  });

  return { colors, labelMap };
}

/**
 * Create GDS-compliant dropdown color picker
 * @param {HTMLElement} container - Container element
 * @param {Array} colors - Array of color values
 * @param {Object} labelMap - Map of colors to labels
 * @param {Object} options - Configuration options
 * @returns {Object} Color picker API
 * @ignore
 */
function createGDSColorPicker(container, colors, labelMap, options = {}) {
  const picker = document.createElement('div');

  picker.className = 'gds-color-picker';
  picker.setAttribute('role', 'listbox');
  picker.setAttribute('aria-label', 'Choose a color');

  // Apply GDS styling
  picker.style.cssText = `
    background: white;
    border: 2px solid #0b0c0c;
    border-radius: 0;
    padding: 0;
    margin: 0;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    min-width: 220px;
    max-width: 280px;
    max-height: 300px;
    overflow-y: auto;
    font-family: "GDS Transport", arial, sans-serif;
    font-size: 16px;
    line-height: 1.25;
    z-index: 1000;
  `;

  let selectedColor = null;
  const eventListeners = [];

  // Create color options
  colors.forEach(color => {
    const option = document.createElement('div');

    option.className = 'gds-color-option';
    option.setAttribute('role', 'option');
    option.setAttribute('tabindex', '0');
    option.setAttribute('aria-selected', 'false');
    option.dataset.color = color;

    // GDS-compliant styling for options
    option.style.cssText = `
      display: flex;
      align-items: center;
      padding: 12px 16px;
      cursor: pointer;
      border: none;
      border-bottom: 1px solid #f3f2f1;
      background: white;
      transition: background-color 0.15s ease;
      outline: none;
    `;

    // Color circle
    const colorCircle = document.createElement('div');

    colorCircle.className = 'gds-color-circle';
    colorCircle.style.cssText = `
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: ${color};
      border: 2px solid ${color === '#ffffff' || color === '#fff' ? '#0b0c0c' : color};
      margin-right: 12px;
      flex-shrink: 0;
    `;

    // Label
    const label = document.createElement('span');

    label.className = 'gds-color-label';
    label.textContent = labelMap[color] || color;
    label.style.cssText = `
      color: #0b0c0c;
      font-weight: 400;
      flex-grow: 1;
      font-size: 16px;
    `;

    option.appendChild(colorCircle);
    option.appendChild(label);

    // Event handlers
    const handleSelect = () => {
      // Remove previous selection
      picker.querySelectorAll('.gds-color-option').forEach(opt => {
        opt.setAttribute('aria-selected', 'false');
        opt.style.backgroundColor = 'white';
      });

      // Mark as selected
      option.setAttribute('aria-selected', 'true');
      option.style.backgroundColor = '#f3f2f1';
      selectedColor = color;

      // Emit custom event
      const event = new CustomEvent('colorSelected', {
        detail: { color, label: labelMap[color] || color, origin: 'palette' }
      });

      picker.dispatchEvent(event);
    };

    const clickHandler = handleSelect;
    const keyHandler = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelect();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = option.nextElementSibling;

        if (next) next.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = option.previousElementSibling;

        if (prev) prev.focus();
      }
    };

    // Focus styling
    const focusHandler = () => {
      option.style.outline = '3px solid #fd0';
      option.style.outlineOffset = '-3px';
    };

    const blurHandler = () => {
      option.style.outline = 'none';
    };

    option.addEventListener('click', clickHandler);
    option.addEventListener('keydown', keyHandler);
    option.addEventListener('focus', focusHandler);
    option.addEventListener('blur', blurHandler);

    // Hover effects
    option.addEventListener('mouseenter', () => {
      if (option.getAttribute('aria-selected') !== 'true') {
        option.style.backgroundColor = '#f8f8f8';
      }
    });

    option.addEventListener('mouseleave', () => {
      if (option.getAttribute('aria-selected') !== 'true') {
        option.style.backgroundColor = 'white';
      }
    });

    eventListeners.push(
      { element: option, event: 'click', handler: clickHandler },
      { element: option, event: 'keydown', handler: keyHandler },
      { element: option, event: 'focus', handler: focusHandler },
      { element: option, event: 'blur', handler: blurHandler }
    );

    picker.appendChild(option);
  });

  // Public API
  const api = {
    getColor: () => selectedColor || RESET_COLOR,
    setColor: color => {
      const option = picker.querySelector(`[data-color="${color}"]`);

      if (option) {
        option.click();
      }
    },
    on: (event, callback) => {
      picker.addEventListener(event, callback);
    },
    off: (event, callback) => {
      picker.removeEventListener(event, callback);
    },
    destroy: () => {
      eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      if (picker.parentNode) {
        picker.parentNode.removeChild(picker);
      }
    }
  };

  container.appendChild(picker);
  return api;
}

/**
 * Initialize UI with GDS color picker
 * @param {object} editor - Editor instance
 * @param {Array} presetColors - Preset colors (strings or objects)
 * @param {Object} options - Plugin options
 * @ignore
 */
function initUI(editor, presetColors, options = {}) {
  const name = 'colorSyntax';
  const className = 'tui-color';
  const { i18n } = editor;
  const toolbar = editor.getUI().getToolbar();

  // Process colors and labels
  const { colors, labelMap } = processPresetColors(presetColors, options.restrictedMode);

  editor.eventManager.addEventType('colorButtonClicked');

  toolbar.insertItem(3, {
    type: 'button',
    options: {
      name,
      className,
      event: 'colorButtonClicked',
      tooltip: i18n.get('Change font colour'),
    }
  });

  const colorSyntaxButtonIndex = toolbar.indexOfItem(name);
  const { el: button } = toolbar.getItem(colorSyntaxButtonIndex);

  // Create container for our custom picker
  const colorPickerContainer = document.createElement('div');

  colorPickerContainer.className = 'gds-color-picker-container';

  // Create custom GDS color picker
  const colorPicker = createGDSColorPicker(colorPickerContainer, colors, labelMap, options);

  // Set initial color
  colorPicker.setColor(RESET_COLOR);
  let selectedColor = colorPicker.getColor();

  // Create popup
  const popup = editor.getUI().createPopup({
    header: false,
    title: null,
    content: colorPickerContainer,
    className: 'tui-popup-color gds-popup',
    target: editor.getUI().getToolbar().el,
    css: {
      width: 'auto',
      position: 'absolute',
      zIndex: 1000
    }
  });

  // Style popup container to remove default styling
  if (popup.el) {
    popup.el.style.cssText += `
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      background: transparent !important;
    `;
  }

  // Event listeners
  editor.eventManager.listen('focus', () => {
    popup.hide();

    if (editor.isWysiwygMode() && lastScrollTop) {
      editor.getSquire().getRoot().parentNode.scrollTop = lastScrollTop;
      lastScrollTop = 0;
    }
  });

  editor.eventManager.listen('colorButtonClicked', () => {
    if (popup.isShow()) {
      popup.hide();
      return;
    }

    const { offsetTop, offsetLeft, offsetHeight } = button;

    css(popup.el, {
      top: `${offsetTop + offsetHeight}px`,
      left: `${offsetLeft}px`
    });

    editor.eventManager.emit('closeAllPopup');
    popup.show();

    // Focus first option for accessibility
    const firstOption = colorPickerContainer.querySelector('.gds-color-option');

    if (firstOption) {
      setTimeout(() => firstOption.focus(), 50);
    }
  });

  editor.eventManager.listen('closeAllPopup', () => {
    popup.hide();
  });

  editor.eventManager.listen('removeEditor', () => {
    colorPicker.off('colorSelected');
    colorPicker.destroy();
    popup.remove();
  });

  // Handle color selection
  colorPicker.on('colorSelected', e => {
    selectedColor = e.detail.color;

    // In restricted mode or when palette is clicked, apply immediately
    if (options.restrictedMode || e.detail.origin === 'palette') {
      editor.exec('color', selectedColor);
      popup.hide();
    }
  });

  // Return API for external control (maintaining compatibility)
  return {
    getSelectedColor: () => selectedColor,
    setSelectedColor: color => colorPicker.setColor(color),
    show: () => {
      editor.eventManager.emit('colorButtonClicked');
    },
    hide: () => {
      popup.hide();
    },
    destroy: () => {
      colorPicker.destroy();
      popup.remove();
    }
  };
}

/**
 * Make custom color syntax
 * @param {string} text - Text content
 * @param {string} color - Color value
 * @returns {object} - wrapped text and range(from, to)
 * @ignore
 */
function makeCustomColorSyntaxAndTextRange(text, color) {
  return wrapTextAndGetRange(`{color:${color}}`, text, '{color}');
}

/**
 * Make HTML color syntax by given text content and color value
 * @param {string} text Text - content
 * @param {string} color Color - value
 * @returns {object} - wrapped text and range(from, to)
 * @ignore
 */
function makeHTMLColorSyntaxAndTextRange(text, color) {
  return wrapTextAndGetRange(`<span style="color:${color}">`, text, '</span>');
}

/**
 * Wrap text with pre & post and return with text range
 * @param {string} pre - text pre
 * @param {string} text - text
 * @param {string} post - text post
 * @returns {object} - wrapped text and range(from, to)
 * @ignore
 */
function wrapTextAndGetRange(pre, text, post) {
  return {
    result: `${pre}${text}${post}`,
    from: pre.length,
    to: pre.length + text.length
  };
}

/**
 * Change decimal color values to hexadecimal color value
 * @param {string} color Color value string
 * @returns {string}
 * @ignore
 */
function changeDecColorsToHex(color) {
  const decimalColorRx = /rgb\((\d+)[, ]+(\d+)[, ]+(\d+)\)/g;

  return color.replace(decimalColorRx, (colorValue, r, g, b) => {
    const hr = changeDecColorToHex(r);
    const hg = changeDecColorToHex(g);
    const hb = changeDecColorToHex(b);

    return `#${hr}${hg}${hb}`;
  });
}

/**
 * Change individual dec color value to hex color
 * @param {string} color - individual color value
 * @returns {string} - zero padded color string
 * @ignore
 */
function changeDecColorToHex(color) {
  let hexColor = parseInt(color, 10);

  hexColor = hexColor.toString(16);
  hexColor = addDoubleZeroPad(hexColor);

  return hexColor;
}

/**
 * Add leading 2 zeros number string
 * @param {string} numberStr - number string
 * @returns {string}
 * @ignore
 */
function addDoubleZeroPad(numberStr) {
  const padded = `00${numberStr}`;

  return padded.substr(padded.length - 2);
}

/**
 * Enhanced Color syntax plugin with GDS-compliant UI
 * @param {Editor|Viewer} editor - instance of Editor or Viewer
 * @param {Object} options - options for plugin
 * @param {Array.<string|Object>} [options.preset] - preset colors (ex: ['#181818', '#292929'] or [{color: '#181818', label: 'Dark'}, '#292929'])
 * @param {boolean} [options.useCustomSyntax=false] - whether use custom syntax or not
 * @param {boolean} [options.restrictedMode=false] - restrict to only preset/default colors, immediate selection
 */
export default function colorSyntaxPlugin(editor, options = {}) {
  const { preset, useCustomSyntax = false, restrictedMode = false } = options;

  const colorSyntaxRx = /\{color:(.+?)}(.*?)\{color}/g;
  const colorHtmlRx = /<span (?:class="colour" )?style="color:(.+?)"(?: class="colour")?>(.*?)/g;
  const colorHtmlCompleteRx = /<span (?:class="colour" )?style="color:(.+?)"(?: class="colour")?>(.*?)<\/span>/g;

  editor.eventManager.listen('convertorAfterMarkdownToHtmlConverted', html => {
    let replacement;

    if (!useCustomSyntax) {
      replacement = html;
    } else {
      replacement = html.replace(
        colorSyntaxRx,
        (matched, p1, p2) => makeHTMLColorSyntaxAndTextRange(p2, p1).result
      );
    }

    return replacement;
  });

  editor.eventManager.listen('convertorAfterHtmlToMarkdownConverted', markdown => {
    const findRx = useCustomSyntax ? colorHtmlCompleteRx : colorHtmlRx;

    return markdown.replace(findRx, (founded, color, text) => {
      let replacement;

      if (color.match(/rgb\((\d+)[, ]+(\d+)[, ]+(\d+)\)/)) {
        color = changeDecColorsToHex(color);
      }

      if (!useCustomSyntax) {
        replacement = founded
          .replace(/ ?class="colour" ?/g, ' ')
          .replace(/rgb\((\d+)[, ]+(\d+)[, ]+(\d+)\)/, color);
      } else {
        replacement = makeCustomColorSyntaxAndTextRange(text, color).result;
      }

      return replacement;
    });
  });

  if (!editor.isViewer() && editor.getUI().name === 'default') {
    editor.addCommand('markdown', {
      name: 'color',
      exec(mde, color) {
        const cm = mde.getEditor();
        const rangeFrom = cm.getCursor('from');
        const rangeTo = cm.getCursor('to');
        let replacedText;
        let replacedFrom;

        if (!color) {
          return;
        }

        if (!useCustomSyntax) {
          ({ result: replacedText, from: replacedFrom } = makeHTMLColorSyntaxAndTextRange(
            cm.getSelection(),
            color
          ));
          cm.replaceSelection(replacedText);
        } else {
          ({ result: replacedText, from: replacedFrom } = makeCustomColorSyntaxAndTextRange(
            cm.getSelection(),
            color
          ));
          cm.replaceSelection(replacedText);
        }

        cm.setSelection(
          {
            line: rangeFrom.line,
            ch: rangeFrom.ch + replacedFrom
          },
          {
            line: rangeTo.line,
            ch: rangeFrom.line === rangeTo.line ? rangeTo.ch + replacedFrom : rangeTo.ch
          }
        );

        mde.focus();
      }
    });

    editor.addCommand('wysiwyg', {
      name: 'color',
      exec(wwe, color) {
        if (!color) {
          return;
        }

        const sq = wwe.getEditor();
        const tableSelectionManager = wwe.componentManager.getManager('tableSelection');

        // Cache scrollTop before change text color.
        lastScrollTop = getScrollTopForReFocus(sq);

        if (sq.hasFormat('table') && tableSelectionManager.getSelectedCells().length) {
          tableSelectionManager.styleToSelectedCells(setStyleColor, color);

          const range = sq.getSelection();

          range.collapse(true);
          sq.setSelection(range);
        } else {
          setStyleColor(sq, color);
        }
      }
    });

    initUI(editor, preset, Object.assign({}, options, { restrictedMode }));
  }
}
