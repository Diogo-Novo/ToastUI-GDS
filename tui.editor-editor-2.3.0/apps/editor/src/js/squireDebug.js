/**
 * @fileoverview Squire debug helper - tracks empty/BR-only container removal
 * This file is included in the build and provides runtime inspection of Squire's fixContainer behavior
 */

// Initialize debug object on window
if (typeof window !== 'undefined') {
  window.__squireDebug__ = {
    emptyContainers: [],
    beforeFix: null,
    afterFix: null,
    hadRemoval: false,
    callCount: 0
  };

  // Expose helper function to dump debug info to a visible div
  window.__squireDumpDebug = function() {
    var debug = window.__squireDebug__;
    var div = document.getElementById('__squire-debug-output');
    if (!div) {
      div = document.createElement('div');
      div.id = '__squire-debug-output';
      div.style.cssText = 'position:fixed;bottom:0;left:0;right:0;max-height:40vh;overflow:auto;background:#1e1e1e;color:#0f0;font-family:monospace;font-size:12px;padding:10px;z-index:999999;';
      document.body.appendChild(div);
    }
    var output = '<strong style="color:#ff0">=== Squire Debug ===</strong><br>';
    output += '<strong>Call count:</strong> ' + (debug.callCount || 0) + '<br>';
    output += '<strong>Had removal:</strong> ' + (debug.hadRemoval ? 'YES' : 'NO') + '<br>';
    output += '<strong>Empty/BR containers found:</strong> ' + (debug.emptyContainers ? debug.emptyContainers.length : 0) + '<br>';
    if (debug.beforeFix) {
      output += '<strong style="color:#f80">BEFORE fixContainer:</strong><br><pre style="margin:4px 0">' + debug.beforeFix + '</pre><br>';
    }
    if (debug.afterFix) {
      output += '<strong style="color:#0f0">AFTER fixContainer:</strong><br><pre style="margin:4px 0">' + debug.afterFix + '</pre><br>';
    }
    if (debug.emptyContainers && debug.emptyContainers.length > 0) {
      output += '<strong style="color:#f00">Removed empty/BR containers:</strong><br>';
      debug.emptyContainers.slice(-20).forEach(function(c, i) {
        output += '<span style="color:#f80">[' + i + ']</span> <' + c.tag + '> ' + c.innerHTML + ' (parent: <' + c.parentTag + '>) @ ' + c.timestamp + '<br>';
      });
    }
    div.innerHTML = output;
    return output;
  };
}
