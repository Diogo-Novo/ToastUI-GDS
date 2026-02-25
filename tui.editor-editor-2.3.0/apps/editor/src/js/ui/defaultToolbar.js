/**
 * @fileoverview implements DefaultToolbar
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */
import ResizeObserver from 'resize-observer-polyfill';

import i18n from '../i18n';
import Toolbar from './toolbar';
import PopupDropdownToolbar from './popupDropdownToolbar';
import ToolbarItemFactory from './toolbarItemFactory';

const MORE_BUTTON_NAME = 'more';
const DEBUG_TOOLBAR = false; // set to false when done

/**
 * Class DefaultToolbar
 */
class DefaultToolbar extends Toolbar {
  /**
   * more button
   * @type {ToolbarButton}
   * @private
   */
  _moreButton;

  /**
   * popup dropdown toolbar
   * @type {PopupDropdownToolbar}
   * @private
   */
  _popupDropdownToolbar;

  /**
   * resize observer
   * @type {ResizeObserver}
   * @private
   */
  _observer;

  constructor(eventManager, options) {
    super(eventManager, options);

    this._init(eventManager);
    this._bindWidthChangedEvent();
  }

  /**
   * insert toolbar item
   * @param  {number} index - index at given item inserted
   * @param  {ToolbarItem|string|object} item - toolbar item
   * @override
   */
  insertItem(index, item) {
    super.insertItem(index, item);
    this._arrangeMoreButton();
  }

  _init(eventManager) {
    const moreButton = ToolbarItemFactory.create('button', {
      name: MORE_BUTTON_NAME,
      className: 'tui-more',
      tooltip: i18n.get('More'),
      event: PopupDropdownToolbar.OPEN_EVENT
    });

    this._moreButton = moreButton;

    this._popupDropdownToolbar = new PopupDropdownToolbar({
      eventManager,
      target: this.el,
      button: moreButton.el
    });

    this.addItem(moreButton);
  }

  _bindWidthChangedEvent() {
    this._observer = new ResizeObserver(() => {
      this._popupDropdownToolbar.hide();

      requestAnimationFrame(() => {
        // guard against zero-height layout
        if (this.el.clientHeight === 0) {
          return;
        }

        this._balanceButtons();
      });
    });

    this._observer.observe(this.el);
  }

  _balanceButtons() {
    // Guard against unmounted or zero-height toolbar
    if (!this.el || this.el.clientHeight === 0) {
      this.debug('aborted: zero height or missing element');
      return;
    }

    // Move all items currently in the popup back to the main toolbar
    const dropDownToolbarItems = this._popupDropdownToolbar.getItems();

    dropDownToolbarItems.forEach((item) => {
      this._popupDropdownToolbar.removeItem(item, false);
      super.insertItem(this.getItems().length, item);
    });

    // Ensure "More" button is always first, temporarily remove for rearrangement
    this.removeItem(this._moreButton, false);
    super.insertItem(0, this._moreButton);

    const toolbarItems = this.getItems();

    if (!toolbarItems.length) {
      return;
    }

    // Row-based overflow calculation: use first item's offsetTop as reference
    const firstRowTop = toolbarItems[0].el.offsetTop;

    const overflowItems = toolbarItems.filter((item) => item.el.offsetTop > firstRowTop);

    // Move overflowed items into the popup
    overflowItems.forEach((item) => {
      this.removeItem(item, false);
      this._popupDropdownToolbar.addItem(item);
    });

    // Re-add "More" button only if there are overflowed items
    this._arrangeMoreButton();

    // Debug log for final layout
    this.debug('balance complete', {
      toolbarHeight: this.el.clientHeight,
      firstRowTop,
      overflowCount: overflowItems.length,
      visibleItems: this.getItems().map((item) => item.name)
    });
  }

  // _balanceButtons() {
  //   this.debug('balance start', {
  //     elHeight: this.el.clientHeight,
  //     scrollHeight: this.el.scrollHeight,
  //     items: this.getItems().map(item => {
  //       return {
  //         name: item.name,
  //         offsetTop: item.el.offsetTop,
  //         offsetHeight: item.el.offsetHeight
  //       };
  //     })
  //   });

  //   if (!this.el || this.el.clientHeight === 0) {
  //     this.debug('aborted: zero height');
  //     return;
  //   }

  //   const dropDownToolbarItems = this._popupDropdownToolbar.getItems();

  //   dropDownToolbarItems.forEach(item => {
  //     this._popupDropdownToolbar.removeItem(item, false);

  //     const itemLength = this.getItems().length;

  //     super.insertItem(itemLength, item);
  //   });

  //   this.removeItem(this._moreButton, false);
  //   super.insertItem(0, this._moreButton);

  //   const defaultToolbarItems = this.getItems();
  //   const overflowItems = defaultToolbarItems.filter(
  //     item => item.el.offsetTop > this.el.clientHeight
  //   );

  //   overflowItems.forEach(item => {
  //     this.removeItem(item, false);
  //     this._popupDropdownToolbar.addItem(item);
  //   });

  //   this._arrangeMoreButton();

  //   this.debug('final state', {
  //     toolbarHeight: this.el.clientHeight,
  //     itemTops: this.getItems().map(item => item.el.offsetTop)
  //   });
  // }

  _arrangeMoreButton() {
    if (!this._popupDropdownToolbar) {
      return;
    }

    this.removeItem(this._moreButton, false);

    const hasOverflow = this._popupDropdownToolbar.getItems().length > 0;
    const itemLength = this.getItems().length;

    if (hasOverflow) {
      super.insertItem(itemLength, this._moreButton);
    }
  }

  /**
   * destroy
   * @override
   */
  destroy() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
  }

  debug(...args) {
    if (DEBUG_TOOLBAR) {
      console.log('[DefaultToolbar]', ...args);
    }
  }
}

export default DefaultToolbar;
