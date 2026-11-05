# page-headings-obsidian-plugin

Obsidian community plugin. `main.js` is hand-written directly — there's no
build step, no `package.json`, no bundler. You edit `main.js` itself, not a
TypeScript source file that compiles to it.

## Workflow

One fix per feature branch, with a PR referencing the GitHub issue it fixes.
Merge to `main` before cutting a release — don't commit fixes straight to
`main`.

## Release process

Obsidian's updater needs:
- `manifest.json`'s `version` bumped on `main`.
- A GitHub release **tagged with that exact version, no `v` prefix** (e.g. `0.2.7`,
  not `v0.2.7`).
- `main.js` and `manifest.json` attached to the release as binary assets — the
  updater downloads these specific files, not the source tarball GitHub
  generates automatically.

## Test locally before releasing — don't guess-and-release

This plugin deals with editor/file timing races (deferred views, new-tab
opens, file-creation races with other plugins) that are **impossible to
diagnose from a stack trace or symptom description alone**, and cutting a
release just to find out a fix didn't work wastes a full round trip. Verify
live in a running Obsidian instance first.

### Prerequisites

- Obsidian must actually be running.
- `obsidian-cli` ships inside the app bundle: `.../Obsidian.app/Contents/MacOS/obsidian-cli`
  (path varies by platform/install). Run `obsidian-cli --help` for the full
  command list.
- A vault with the plugin already installed (and any plugin you're debugging
  an interaction with, e.g. Rapid Notes).

### Set up a live-reload loop

Symlink the installed plugin's folder to this repo's working directory, so
edits here take effect without a release:

```sh
PLUGDIR="<vault>/.obsidian/plugins/page-heading-from-links"
mv "$PLUGDIR" /somewhere/outside/.obsidian/plugins/   # NOT a rename-in-place — see gotcha below
ln -s /path/to/this/repo "$PLUGDIR"
```

Then after each edit to `main.js`:

```sh
obsidian-cli plugin:reload id=page-heading-from-links vault=<name>
```

**Gotcha:** if you back up the installed folder by renaming it *in place*
(e.g. to `page-heading-from-links.installed-backup`) instead of moving it
fully outside `.obsidian/plugins/`, Obsidian's plugin scanner finds two
folders whose `manifest.json` both declare the same plugin `id` and silently
keeps loading the stale one. Neither `plugin:reload`, disable/enable, nor
"Reload the vault" fixes this — only a full `obsidian-cli restart` after the
backup is moved *entirely outside* `.obsidian/plugins/` does. Check which
folder is actually loaded with:

```sh
obsidian-cli eval code="app.plugins.plugins['page-heading-from-links'].manifest.dir" vault=<name>
```

**Gotcha:** `vault=<name>` must come *after* the command name
(`obsidian-cli vault vault=Marketplacer`), not before.

**Gotcha:** `obsidian-cli restart` doesn't reliably reopen every vault window
that was open before — you may need to manually reopen the vault you're
testing in afterward.

### Observe what's actually happening

```sh
obsidian-cli dev:debug on vault=<name>       # attach once per session
obsidian-cli dev:console clear vault=<name>  # clear before each test
# ... trigger the repro steps ...
obsidian-cli dev:console limit=100 vault=<name>
obsidian-cli dev:errors vault=<name>
```

Add temporary `console.log` statements at each branch point in `main.js`
while debugging, then strip them before committing the real fix.

You can also script repro steps directly instead of clicking around by hand —
`obsidian-cli create`, `open`, `rename`, `delete`, `read` all operate on the
live vault and are far faster to iterate with than manual testing for cases
that don't need a specific other plugin's behavior.

### Only after it's confirmed working live

Commit on a branch, open a PR referencing the issue, bump `manifest.json`'s
version, merge, then cut the release as described above.
