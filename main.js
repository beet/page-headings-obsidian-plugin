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

var PageHeadingFromLinks = /** @class */ (function (_super) {
  __extends(PageHeadingFromLinks, _super);

  function PageHeadingFromLinks() {
    return _super !== null && _super.apply(this, arguments) || this;
  }

  PageHeadingFromLinks.prototype.onload = function () {
    var _this = this;

    console.log("Loading PageHeadingFromLinks plugin");

    this.registerEvent(app.workspace.on('file-open', _this.insertHeadingFromBasename));
  };

  // When opening any blank file, insert a H1 tag into the page constructed
  // from its filename
  PageHeadingFromLinks.prototype.insertHeadingFromBasename = function(openedFile) {
    // Make sure it's a Markdown file, not an image attachment etc.
    var view = app.workspace.getActiveViewOfType(obsidian.MarkdownView);

    if (view !== null) {
      var editor = view.sourceMode.cmEditor;

      // Only update blank files
      if (view.data === '') {
        var basename = view.file.basename;
        var heading = "# " + capitalizeFirstLetter(basename.replaceAll("_", " ")) + "\n\n";
        var doc = editor.getDoc();
        var cursor = doc.getCursor();
        doc.replaceRange(heading, cursor);
      }
    }
  }

  return PageHeadingFromLinks;
}(obsidian.Plugin));

module.exports = PageHeadingFromLinks;
