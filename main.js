'use strict';

var obsidian = require('obsidian');

// How long to wait, after the last observed change to a file, before
// treating it as "settled" and safe to act on.
var SETTLE_DELAY_MS = 300;

// Upper bound on how long to wait for a file to settle at all, in case
// something keeps it perpetually "active" (or we miss a modify event).
var MAX_WAIT_MS = 15000;

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

    // Files currently being watched for insertion, keyed by path, so
    // file-open firing again (or handleRename) doesn't start a second,
    // overlapping wait for the same file.
    this.pendingFiles = new Set();

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

  onunload() {
    this.pendingFiles.clear();
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

    if (this.pendingFiles.has(openedFile.path)) {
      return;
    }
    this.pendingFiles.add(openedFile.path);

    var heading = "# " + capitalizeFirstLetter(basename.replaceAll("_", " ")) + "\n\n";

    try {
      await this.insertHeadingWhenSettled(openedFile, heading);
    } finally {
      this.pendingFiles.delete(openedFile.path);
    }
  }

  // Another plugin (e.g. Rapid Notes' Templater integration) may also be
  // populating this same newly created file, asynchronously and on its own
  // schedule -- its template render time is open-ended, so there's no fixed
  // delay that's reliably "long enough" to wait before acting. Instead,
  // watch the file and only act once nothing has modified it for a short
  // quiet period, then prepend the heading to whatever is there by then.
  // Being the last writer this way avoids both losing our own write to a
  // later overwrite, and clobbering content a slower writer hasn't
  // finished adding yet.
  insertHeadingWhenSettled(file, heading) {
    var app = this.app;

    return new Promise((resolve) => {
      var done = false;
      var settleTimer = null;
      var maxTimer = null;
      var modifyRef = null;

      var finish = () => {
        if (done) {
          return;
        }
        done = true;
        clearTimeout(settleTimer);
        clearTimeout(maxTimer);
        app.vault.offref(modifyRef);

        app.vault.process(file, (data) => (data.startsWith(heading) ? data : heading + data))
          .then(resolve, resolve);
      };

      var scheduleSettleCheck = () => {
        clearTimeout(settleTimer);
        settleTimer = setTimeout(finish, SETTLE_DELAY_MS);
      };

      modifyRef = app.vault.on('modify', (changedFile) => {
        if (changedFile.path === file.path) {
          scheduleSettleCheck();
        }
      });

      scheduleSettleCheck();
      maxTimer = setTimeout(finish, MAX_WAIT_MS);
    });
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
