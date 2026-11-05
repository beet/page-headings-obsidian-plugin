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
  async insertHeadingFromBasename(openedFile) {
    // Make sure it's a Markdown file, not an image attachment etc.
    if (!(openedFile instanceof obsidian.TFile) || openedFile.extension !== 'md') {
      return;
    }

    // Only act on files that are genuinely empty on disk.
    if (openedFile.stat.size !== 0) {
      return;
    }

    var basename = openedFile.basename;

    // Leave still-untitled new notes alone until they're renamed (see
    // handleRename)
    if (isUntitledName(basename)) {
      return;
    }

    var heading = "# " + capitalizeFirstLetter(basename.replaceAll("_", " ")) + "\n\n";

    // Write directly to the file rather than an editor buffer: file-open
    // can fire while Obsidian (or another plugin) is still settling the
    // new file's creation and the leaf/view showing it, and editing the
    // editor's in-memory buffer at that moment can lose a race against
    // Obsidian's own sync and get silently clobbered back to blank.
    //
    // Use process() rather than modify() so this is a non-destructive
    // prepend, not a blind overwrite: another plugin (e.g. Rapid Notes'
    // Templater integration) may also be writing a template into this same
    // newly created file around the same time, and overwriting the file's
    // full contents with just the heading would erase that template
    // content if its write happened to land first.
    await this.app.vault.process(openedFile, (data) => heading + data);
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
