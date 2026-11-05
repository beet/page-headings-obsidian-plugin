'use strict';

var obsidian = require('obsidian');

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Obsidian names new notes (e.g. from "New note" / Cmd+N) "Untitled",
// "Untitled 1", etc. before the user has had a chance to rename them.
function isUntitledName(basename) {
  return /^Untitled( \d+)?$/.test(basename);
}

var PageHeadingFromLinks = /** @class */ (function (_super) {
  __extends(PageHeadingFromLinks, _super);

  function PageHeadingFromLinks() {
    return _super !== null && _super.apply(this, arguments) || this;
  }

  PageHeadingFromLinks.prototype.onload = function () {
    var _this = this;

    console.log("Loading PageHeadingFromLinks plugin");

    this.registerEvent(this.app.workspace.on('file-open', function (openedFile) {
      _this.insertHeadingFromBasename(openedFile);
    }));

    // New notes are created as "Untitled" with the filename field open for
    // editing, so insertHeadingFromBasename defers them; pick those up once
    // the user commits a real name.
    this.registerEvent(this.app.vault.on('rename', function (file, oldPath) {
      _this.handleRename(file, oldPath);
    }));
  };

  // When opening any blank file, insert a H1 tag into the page constructed
  // from its filename
  PageHeadingFromLinks.prototype.insertHeadingFromBasename = function(openedFile) {
    // Make sure it's a Markdown file, not an image attachment etc.
    if (!(openedFile instanceof obsidian.TFile) || openedFile.extension !== 'md') {
      return;
    }

    // Only act on files that are genuinely empty on disk. Checking the
    // file's size (vault metadata, available synchronously) rather than the
    // editor's in-memory buffer avoids a race where file-open fires before
    // the editor has finished loading existing content: reading the buffer
    // too early would see '' for a populated file and overwrite it with
    // just the heading.
    if (openedFile.stat.size !== 0) {
      return;
    }

    var basename = openedFile.basename;

    // Leave still-untitled new notes alone until they're renamed (see
    // handleRename)
    if (isUntitledName(basename)) {
      return;
    }

    var view = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);

    if (view !== null && view.file === openedFile) {
      var heading = "# " + capitalizeFirstLetter(basename.replaceAll("_", " ")) + "\n\n";
      var cursor = view.editor.getCursor();
      view.editor.replaceRange(heading, cursor);
    }
  }

  // When a still-blank "Untitled" note is renamed to its real name, insert
  // the heading now that we have a meaningful filename to build it from
  PageHeadingFromLinks.prototype.handleRename = function(file, oldPath) {
    var oldBasename = oldPath.split('/').pop().replace(/\.md$/, '');

    if (!isUntitledName(oldBasename)) {
      return;
    }

    this.insertHeadingFromBasename(file);
  }

  return PageHeadingFromLinks;
}(obsidian.Plugin));

module.exports = PageHeadingFromLinks;
