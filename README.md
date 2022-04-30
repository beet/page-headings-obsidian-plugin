# Page Headings Obsidian Plugin

Obsidian plugin to populate page headings from the filename.

When enabled, any time a blank file is opened, either from having just created it from a wiki link or opening a pre-existing blank file, a Markdown heading will be inserted into the page that is constructed from the filename (see below for details).

If you build up your notes in a similar fashion to Zettelkasten or like to insert wiki links into a parent page and then click on them to create the child page, and you like to follow the convention of the page heading matching the filename _(like NotePlan)_, this plugin will take of that for you.

## From filename to page header

The page header is given by the filename and the following transformations:

* The suffix (usually `.md`) is removed.
* Underscores `_`  are replaced by a blank space `' '`.
* The first word is capitalized.

For example, `this_is_my_filename.md` creates the title `This is my filename`.

## Todo

- [ ] Expose a hotkey/command to insert headings into existing notes that don't have a heading?
