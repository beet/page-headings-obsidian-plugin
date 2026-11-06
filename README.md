# Page Headings Obsidian Plugin

Obsidian plugin to populate page headings from the filename.

When enabled, any time a blank file is opened, either from having just created it from a wiki link or opening a pre-existing blank file, a Markdown heading will be inserted into the page that is constructed from the filename (see below for details).

If you build up your notes in a similar fashion to Zettelkasten or like to insert wiki links into a parent page and then click on them to create the child page, and you like to follow the convention of the page heading matching the filename _(like NotePlan)_, this plugin will take care of that for you.

## From filename to page header

The page header is given by the filename and the following transformations:

* The suffix (usually `.md`) is removed.
* Underscores `_`  are replaced by a blank space `' '`.
* The first word is capitalized.

For example, `this_is_my_filename.md` creates the title `This is my filename`.

## Skipping Daily Notes

If the core Daily Notes plugin is enabled, this plugin skips inserting a
heading into notes created in its configured folder by default — useful if
your daily note's filename already is the date and you don't want a
duplicate heading. This can be turned off in the plugin's settings if you do
want a heading inserted into your daily notes.

## Interaction with templates (e.g. Templater)

If a new file is still blank when opened, but something else — most often a
Templater folder/file template applied automatically on creation — adds
content to it shortly afterward, this plugin waits for that to finish
before deciding what to do, rather than racing it (Templater's own render
time is open-ended, so there's no fixed delay that would reliably be "long
enough").

If the file is still blank once things settle, the heading is inserted as
usual. If something else has already added content by then, this plugin
leaves the file alone entirely rather than inserting a heading on top of it.
This avoids a duplicate heading in the common case where a template already
includes one (e.g. a Templater template containing `# <% tp.file.title %>`),
at the cost of this plugin not adding its heading if your template happens
not to include one of its own.

## Todo

- [ ] Expose a hotkey/command to insert headings into existing notes that don't have a heading?
