'use strict';

var obsidian = require('obsidian');

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Obsidian names new notes (e.g. from "New note" / Cmd+N) "Untitled",
// "Untitled 1", etc. before the user has had a chance to rename them.
function isUntitledName(basename) {
  return /^Untitled( \d+)?$/.test(basename);
}

class PageHeadingFromLinks extends obsidian.Plugin {
  onload() {
    console.log("Loading PageHeadingFromLinks plugin");

    this.registerEvent(this.app.workspace.on('file-open', (openedFile) => {
      this.insertHeadingFromBasename(openedFile);
    }));

    // New notes are created as "Untitled" with the filename field open for
    // editing, so insertHeadingFromBasename defers them; pick those up once
    // the user commits a real name.
    this.registerEvent(this.app.vault.on('rename', (file, oldPath) => {
      this.handleRename(file, oldPath);
    }));
  }

  // When opening any blank file, insert a H1 tag into the page constructed
  // from its filename
  insertHeadingFromBasename(openedFile) {
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

    var view = this.findMarkdownViewForFile(openedFile);

    if (view !== null) {
      var heading = "# " + capitalizeFirstLetter(basename.replaceAll("_", " ")) + "\n\n";
      var cursor = view.editor.getCursor();
      view.editor.replaceRange(heading, cursor);
    }
  }

  // The active view isn't always the one showing the file that just
  // opened: e.g. opening a link in a new tab can fire file-open before that
  // tab becomes the active leaf. Search all markdown leaves for the one
  // actually displaying this file.
  findMarkdownViewForFile(file) {
    var activeView = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);

    if (activeView !== null && activeView.file === file) {
      return activeView;
    }

    var match = null;

    this.app.workspace.getLeavesOfType('markdown').forEach(function (leaf) {
      if (match === null && leaf.view instanceof obsidian.MarkdownView && leaf.view.file === file) {
        match = leaf.view;
      }
    });

    return match;
  }

  // When a still-blank "Untitled" note is renamed to its real name, insert
  // the heading now that we have a meaningful filename to build it from
  handleRename(file, oldPath) {
    var oldBasename = oldPath.split('/').pop().replace(/\.md$/, '');

    if (!isUntitledName(oldBasename)) {
      return;
    }

    this.insertHeadingFromBasename(file);
  }
}

module.exports = PageHeadingFromLinks;
