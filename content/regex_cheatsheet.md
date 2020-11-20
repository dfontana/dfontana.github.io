+++
title = "Regex's: A quick little cheatsheet"
date = 2018-12-17
[taxonomies]
tags = ["cheatsheet"]
categories = ["code"]
+++

It's not frequent I come across a need for a regex - perhaps to my own detriment - but when I do, I often find myself forgetting what specific parts may mean. Here's a little cheatsheet<!-- more --> I made myself ~ perhaps there's some value for you.

Symbol      | Name        | Meaning
:----------:|:-----------:|:----------
`.`         | Wildcard    | Anything can take this guy's place. You'll need to escape (`\.`) it for periods.
`\d`        | Digit       | Will search for any digit. It's sister, `\D` is for any non-digit. Ex: `\d\d\d` looks for 3 digits.
`[ ]`       | 'Only'      | Anything inside braces will search through things only containing characters inside. If you were to negate this `^`, you'll ignore those characters. Ex: `[^abc]` Looks for 3 characters not starting with a, b, or c
`{ }`       | Repeating   | Will look for the proceeding group for the number of times inside. `[wxy]{3}`
`*`         | Any Number  | Looks for any number of the proceeding group
`+`         | At least    | Looks for at least one of the proceeding group
`?`         | Optional    | Will treat the prior group as an optional match. `ab?c` will match `abc` or `ac`
`\s`        | Whitespace  | Space, newline, tab, carriage return
`^ $`       | 'Block'     | Using these anchors, we can prevent getting matches encased inside words. ex: `^Mission: successful$`
`( )`       | Capture     | If you want to extract a specific piece of information about your matches, you'll wrap it with parentheses. You can nest these as much as you'd like, spitting out each group.
`pipe`      | OR          | yep. Markdown tables are fun. The OR (same representation as bitwise OR) applies.
