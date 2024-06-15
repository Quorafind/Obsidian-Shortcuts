### General

| First key   | Second key | Third key | Action                                                                                      | Supported |
|-------------|------------|-----------|---------------------------------------------------------------------------------------------|-----------|
| Escape      |            |           | remove focus from text input field (or graph view/canvas)<br>SHORTCUT MODE                  | ✔️        |
| I or Insert |            |           | reset focus to latest text input field (or graph view/canvas)<br>LEAVE Shortcut mode        | ✔️        |
| Shift       |            |           | open fast chooser                                                                           | ✔️        |
| Space       |            |           | open command palette                                                                        | ✔️        |
| G           |            |           | open graph view                                                                             |           |
| L           |            |           | open latest *edited* note                                                                   |           |
| O           | L          |           | hide left sidebar (off left sidebar)                                                        | ✔️        |
| O           | R          |           | hide right sidebar (off right sidebar)                                                      | ✔️        |
| F3          |            |           | toggle source code view (actually this should work outside of Shortcut mode)                |           |
| F4          |            |           | toggle fold properties of current file (actually this should work outside of Shortcut mode) |           |
| F12         |            |           | open Obsidian preferences (actually this should also work outside of Shortcut mode)         |           |
| V (Hold)    | Tab        |           | open another vault                                                                          |           |
| Pos 1       |            |           | create new tab in current frame                                                             |           |
| End         |            |           | close current note/graph/canvas                                                             |           |
| X           |            |           | save and close Obsidian without asking                                                      |           |
| Z           |            |           | toggle Zen mode (only show current note/graph/canvas without any overhead)                  |           |

### Notes

| First key | Second key       | Third key      | Action                                                                                                                                                                                    | Supported |
|-----------|------------------|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------|
| N         | N                |                | note -> new (within current directory)                                                                                                                                                    |           |
| N         | D                |                | note -> new daily note                                                                                                                                                                    |           |
| N         | O                |                | note -> open                                                                                                                                                                              |           |
| N         | Delete           |                | note -> delete (with confirmation)                                                                                                                                                        |           |
| N         | F                | {string}       | note -> find \| search for {string in current note}                                                                                                                                       |           |
| N         | M                | Arrow Keys (+) | note -> move current note<br><br>shows the explorer sidebar;<br>use Arrow Keys to jump with selection through the folders;<br>confirm movement with Enter;<br>cancel movement with Escape |           |
| N         | Tab (+)          |                | cycle through all frames with on open note (show a marker)                                                                                                                                |           |
| H         |                  |                | show headings sidebar                                                                                                                                                                     |           |
| H         | 1 - 9            |                | go to heading 1 - 9 in highest heading hierarchy                                                                                                                                          |           |
| H         | Arrow Keys       |                | Up/Down: move selection in list<br>Right: expand heading in sidebar<br>Left: collapse heading<br>Enter: go to selected heading                                                            |           |
| H         | Arrow Keys + Alt |                | move selected heading with its content up or down, left or right within the heading list                                                                                                  |           |
| H         | Arrow Keys       | Alt + Left     | increase the hierarchy level of the selected heading by one (remove one # in Markdown)                                                                                                    |           |
| H         | Arrow Keys       | Alt + Right    | decrease the hierarchy level of the selected heading by one (add one # in Markdown)                                                                                                       |           |
| H         | C                |                | toggle (note -> headings -> collapse)                                                                                                                                                     |           |

### Graph View

| First key | Second key | Third key | Action                                                                                                                                                      | Supported |
|-----------|------------|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------|
| G         |            |           | open graph view                                                                                                                                             |           |
| G         | G          |           | show and center whole graph                                                                                                                                 |           |
| G         | H          |           | [highlight / animate briefly](https://forum.obsidian.md/t/graph-view-highlight-current-node-more-noticeable/72465) the location of the open notes/canvases. |           |
| G         | Tab (+)    |           | cycle through all frames with a graph view in it (show a marker)                                                                                            |           |
| Star      |            |           | animate graph                                                                                                                                               |           |

When a graph view HAS the focus, these are additions to the already given shortcuts...

#### Graph View with Focus

| First key | Second key | Third key | Action                                                                                                                                                      | Supported |
|-----------|------------|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------|
| 0 - 9     |            |           | show 0 - 9 levels of linked notes beginning from the current notes                                                                                          |           |
| H         |            |           | [highlight / animate briefly](https://forum.obsidian.md/t/graph-view-highlight-current-node-more-noticeable/72465) the location of the open notes/canvases. |           |
| T         |            |           | toggle (show tags)                                                                                                                                          |           |
| A         |            |           | toggle (show attachments)                                                                                                                                   |           |
| R         |            |           | toggle (show relations / [graph link types](https://forum.obsidian.md/t/graph-link-types/74710))                                                            |           |
| G         |            |           | toggle (show group colors)                                                                                                                                  |           |
| O         |            |           | toggle (show orphan files)                                                                                                                                  |           |
| P         |            |           | toggle (show pointers / arrows)                                                                                                                             |           |
| F         | G          | {string}  | filter groups with {string} in names                                                                                                                        |           |
| F         | T          | {string}  | filter tags with {string} in names                                                                                                                          |           |
| F         | N          | {string}  | filter notes with {string} in names                                                                                                                         |           |
| F         | A          | {string}  | filter attachments with {string} in names                                                                                                                   |           |
| F         | G          | Space     | disable group filtering                                                                                                                                     |           |
| F         | T          | Space     | disable tag filtering                                                                                                                                       |           |
| F         | N          | Space     | disable note filtering                                                                                                                                      |           |
| F         | A          | Space     | disable attachment filtering                                                                                                                                |           |
| F         | Space      |           | disable all filters                                                                                                                                         |           |
| Pos 1     |            |           | increase spacing between nodes                                                                                                                              |           |
| End       |            |           | decrease spacing between nodes                                                                                                                              |           |
| C         |            |           | center view on all open notes/canvases                                                                                                                      |           |

### Navigation

| First key     | Second key | Third key | Action                                                  | Supported |
|---------------|------------|-----------|---------------------------------------------------------|-----------|
| Left or Right |            |           | cycle through notes in current tab                      |           |
| Up or Down    |            |           | cycle through tabs in current frame                     |           |
| Page Up       |            |           | move hidden focus to the next frame (show a marker)     |           |
| Page Down     |            |           | move hidden focus to the previous frame (show a marker) |           |
| Tab           |            |           | cycle through the frames (without sidebars)             |           |
| 1 - 9         |            |           | go to tab with number 1 - 9 in the current frame        |           |

### Bookmarks

| First key | Second key | Third key      | Action                                                                                                                                                                                        | Supported |
|-----------|------------|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------|
| B         |            |                | show bookmark sidebar                                                                                                                                                                         |           |
| B         | B          |                | bookmark -> new                                                                                                                                                                               |           |
| B         | 1 - 9      |                | open bookmark with number 1 - 9                                                                                                                                                               |           |
| B         | Arrow Keys | Enter          | Up/Down: move selection in list<br>Right: expand folder<br>Left: collapse folder<br>Enter: open selected bookmark                                                                             |           |
| B         | Delete     |                | bookmark -> delete (with confirmation)                                                                                                                                                        |           |
| B         | D          |                | bookmark -> new directory/group                                                                                                                                                               |           |
| B         | M          | Arrow Keys (+) | note -> move current bookmark<br><br>shows the explorer sidebar;<br>use Arrow Keys to jump with selection through the folders;<br>confirm movement with Enter;<br>cancel movement with Escape |           |
| B         | C          |                | toggle (bookmark -> collapse)                                                                                                                                                                 |           |
| B         | F          | {string}       | bookmark -> filter bookmarks that contain {string}                                                                                                                                            |           |
| B         | F          | Space          | bookmark -> no filter                                                                                                                                                                         |           |
| B         | S          | A              | bookmark -> sort -> ascendending                                                                                                                                                              |           |
| B         | S          | D              | bookmark -> sort -> descendending                                                                                                                                                             |           |

### Explorer

| First key | Second key | Third key | Action                                                                                                                                                                                                                                                                           | Supported |
|-----------|------------|-----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------|
| E         |            |           | show explorer sidebar                                                                                                                                                                                                                                                            |           |
| E         | Arrow Keys | Enter     | Up/Down: move selection in list<br>Right: expand folder<br>Left: collapse folder<br>Enter: open selected note                                                                                                                                                                    |           |
| E         | Arrow Keys | Delete    | Up/Down: move selection in list<br>Right: expand folder<br>Left: collapse folder<br>Delete: Delete selected note                                                                                                                                                                 |           |
| E         | Arrow Keys | M         | Up/Down: move selection in list<br>Right: expand folder<br>Left: collapse folder<br><br>M: move - mark selected file/directory as "repositioning"; <br>use Arrow Keys to jump with selection through the folders;<br>confirm movement with Enter;<br>cancel movement with Escape |           |
| E         | Arrow Keys | D         | Up/Down: move selection in list<br>Right: expand folder<br><br>D: create directory at current location of the selection                                                                                                                                                          |           |
| E         | S          | A         | explorer -> sort -> ascendending                                                                                                                                                                                                                                                 | ✔️        |
| E         | S          | D         | explorer -> sort -> descendending                                                                                                                                                                                                                                                | ✔️        |
| E         | S          | 1         | explorer -> sort -> ascending edit time                                                                                                                                                                                                                                          | ✔️        |
| E         | S          | 2         | explorer -> sort -> descending edit time                                                                                                                                                                                                                                         | ✔️        |
| E         | S          | 3         | explorer -> sort -> ascending creation time                                                                                                                                                                                                                                      | ✔️        |
| E         | S          | 4         | explorer -> sort -> descending creation time                                                                                                                                                                                                                                     | ✔️        |

### Search

| First key | Second key | Third key | Action                                                                                                        | Supported |
|-----------|------------|-----------|---------------------------------------------------------------------------------------------------------------|-----------|
| F         |            |           | show search sidebar                                                                                           |           |
| F         | P          |           | search -> path search<br>"path:" is inserted in the search text field                                         |           |
| F         | F          |           | search -> file search<br>"file:" is inserted in the search text field                                         |           |
| F         | T          |           | search -> tag search<br>"tag:" is inserted in the search text field                                           |           |
| F         | L          |           | search -> line search<br>"line:" is inserted in the search text field                                         |           |
| F         | S          |           | search -> section search<br>"section:" is inserted in the search text field                                   |           |
| F         | P          |           | search -> property search<br>`[]` is inserted in the search text field;<br>cursor is located between brackets |           |
| F         | Space      |           | search -> search everywere<br>nothing is inserted in the search text field                                    |           |

### Canvas

| First key | Second key | Third key  | Action                                                                                                                                                                                             | Supported |
|-----------|------------|------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------|
| C         | C          |            | canvas -> new                                                                                                                                                                                      |           |
| C         | F          | {string}   | canvas -> search for {string} within canvas                                                                                                                                                        |           |
| C         | M          | Arrow Keys | canvas -> move current canvas file<br><br>shows the explorer sidebar;<br>use Arrow Keys to jump with selection through the folders;<br>confirm movement with Enter;<br>cancel movement with Escape |           |
| C         | Tab (+)    |            | cycle through all frames with on open canvas (show a marker)                                                                                                                                       |           |

### Templates

| First key | Second key     | Third key       | Action                                                                               | Supported |
|-----------|----------------|-----------------|--------------------------------------------------------------------------------------|-----------|
| Period    | Arrow Keys (+) | Enter or Escape | show list of templates;<br>Enter to confirm and insert template;<br>Escape to cancel |           |

### Tags

| First key | Second key               | Third key | Action                                                                            | Supported |
|-----------|--------------------------|-----------|-----------------------------------------------------------------------------------|-----------|
| T         |                          |           | show tag sidebar                                                                  |           |
| T         | S                        | A         | tags -> sort -> ascendending by name                                              |           |
| T         | S                        | D         | tags -> sort -> descendending by name                                             |           |
| T         | S                        | 1         | tags -> sort -> ascendending by count                                             |           |
| T         | S                        | 2         | tags -> sort -> descendending by count                                            |           |
| T         | C                        |           | toggle (collapse tag tree)                                                        |           |
| T         | Arrow Keys               | Enter     | tags -> select tag -> show files with this tag in search sidebar                  |           |
| T         | Page Up or Page Down (+) | Enter     | tags -> move tag selection pagewise -> show files with this tag in search sidebar |           |

### Frames

| First key | Second key | Third key  | Action                                                                                                                                                  | Supported |
|-----------|------------|------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|-----------|
| W         | S          | H          | window -> split -> horizontally                                                                                                                         |           |
| W         | S          | V          | window -> split -> vertically                                                                                                                           |           |
| W         | S          | Arrow Keys | change size of current frame<br><br>Left or Right: change size horizontally<br>Up or Down: change size vertically<br><br>Enter: confirm/end size change |           |
| W         | End        |            | close frame                                                                                                                                             |           |

### Workspaces

| First key | Second key | Third key | Action                                                | Supported |
|-----------|------------|-----------|-------------------------------------------------------|-----------|
| ^         |            |           | show workspace dialog                                 |           |
| ^         | L          | {string}  | load workspace...                                     |           |
| ^         | S          |           | save workspace and load another...                    |           |
| ^         | 1 - 9      |           | load workspace 1 - 9 without saving current workspace |           |
