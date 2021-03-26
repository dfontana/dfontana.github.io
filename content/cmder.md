+++
title = "Using Cmder, Mintty, & ZSH on Windows"
date = 2017-01-23
[taxonomies]
tags = ["terminal", "zsh", "configuration"]
+++

[_Originally Shared as a Gist_](https://gist.github.com/dfontana/3e27ec5ea3a6f935b7322b580d3df318). ZSH setup on Windows, minus the input funny business. We'll use mintty emulated by cygwin running on cmder. <!-- more -->

### Why is this here?
For the benefit of myself and others. I've already followed these instructions twice. It took me hours to figure all this out, maybe someone else can save a few.

### What exactly is covered?
- Installing and setting up cmder
- Installing and setting up cygwin with a package manager
- Configuring Mintty colors, fonts, and a few other settings
- Installing zsh, oh-my-zsh, a nifty plugin, and adding a color theme.
- Configuring the usage of Dir_colors (albeit not in detail), as well as powerline fonts for fancy symbols
- [optional] Generating a fancy promptline using a vim plugin (since I use vim)
- Correcting input issues popular python, nodejs, and other language libraries may face... in a very simple way.

# The Instructions:
While there is a lot of detail here, the ETA to follow these instructions with reasonable pace is ~1hr, especially if you skip a lot of the vim / dir_colors / extra plugin stuff (or save it for another time). I tried to present this in a way that covers the essentials first and cosmetics later.

### 1. Cygwin setup:
1. This is straight forward and simple. [Download Cygwin](https://cygwin.com/install.html).
2. Run the installer. When it asks for packages, search for 'wget' and make sure that it is selected for install (it will have a version number displayed when set to). Only download the bin, no need for src.
3. Finish installing. Launch the cygwin terminal from the start menu or the batch file from C:\cygwin64

We're going to setup a package manager for cygwin now. Normally if you wanted more packages you'd have to re-run the installer - which means you have to keep it around for later. I don't like that option, so I found [apt-cyg](https://github.com/transcode-open/apt-cyg). Works like it sounds: apt-get for cygwin!

4. Run the following to download apt-cyg with wget, install it into the bin of cygwin, and then install a few important commands. Note, you don't need gdb, vim, or dos2unix. I personally use all 3 and will be setting up vim, so I'm grabbing them now. [Explore the cygwin packages and grab what you want!](https://cygwin.com/packages/package_list.html) **NOTE if you run into any line ending issues from here out, scroll down to "I can't run upgrade oh my zsh" and read**

```sh
wget rawgit.com/transcode-open/apt-cyg/master/apt-cyg
install apt-cyg /bin
apt-cyg install zsh git gdb dos2unix openssh vim [or your favorite text editor]
```

5. If you want your home folder to be your user's folder, you need to edit /etc/nsswitch.conf. You can do this in the text editor you just downloaded, or type `explorer /etc` to open the root directory to edit the file in wordpad.
6. Add this line to the bottom: `db_home: windows`

That's it for cygwin, you can close the terminal. Unless you are adding more packages with apt-cyg, you'll probably not be touching cygwin much more. It's mostly the backbone of this little operation. Now onto cmder, which is the terminal emulator of choice for this guide.

### 2. CMDER Setup:
1. Download and install some or all of the [powerline fonts](https://github.com/powerline/fonts). I only use Hack in this guide, so feel free to stick to this. Powerline fonts, for the uneducated, are patched fonts that include some fancy symbols related to git and such. You don't **need** this, but it's a plus!
  - "There's a install.ps1 in the folder. Set execution policy and run it." (Thanks @yiufung)
2. [Download cmder](http://cmder.net/) to get started (the full version!). This is a conemu derivative to run shells inside of. It's flexible and highly customizable, which tends to make it desireable. Features a quake-style drop down shell if you're that kind of person, but more importantly plays really nice with keyboard interactions.
3. Unpack cmder to a desired location, this is where you'll be keeping cmder permanently, so pick a cozy spot. Run cmder.exe.
4. Right click the tab bar of cmder to open the settings. We're going to tweak a few things. Tweak as you like of course.
    1. Under *Main* (Check `General > Fonts` if missing - Thanks @SturmB!) we're going to set the font for non-mintty terminals, just for consistency: Hack, Size 16, Uncheck the option for an alternative font.
    2. Under *Size&Position* we're going to tweak the size of the final window. This applies for the quake style drop down too, which I'm going to lead you into setting up. Set width to 95%, height 75% (be sure to type the %!).
    3. Under *Quake*, make sure it's turned on!
    4. Under *Confirm*, turn off the new console / tab dupping confirms. Personally, I don't like them.
    5. **IMPORTANT** If anything, don't skip this setting: under *Tasks*, hit the '+' button to create a task that looks like this:
    ```
    Name:             Zsh::cygwin-mintty (or whatever you like)
    Task Paramaters:  -icon "C:\cygwin64\Cygwin.ico" (or blank, if you want to leave the icon be)
    Commands:         C:\cygwin64\bin\mintty.exe /usr/bin/zsh --login -i -new_console:d:%USERPROFILE%
    ```
    6. Under *Keys and Macros*, here are my settings. Tweak as you like:
    ```
    Win+Esc:    minimize/restore for quake
    Win+Down:   Create new console
    Win+Left:   Switch previous console
    Win+Right:  Switch next console
    ```
    7. Under *Keyboard* check "Install keyboard hooks" (Might now be called  `Support special hotkeys` if missing - Thanks @SturmB!)
    8. Under *Paste* make sure each mode is in "Multi-line". This only affects cmd / non-mintty terminals from what I've seen, but is pleasant to have set for when not using mintty.
5. Save settings and hit Win+Down, run your task. Tada you have a ConEmu running cygwin, running mintty. Wonderful. This is what we'll be using to tweak from here out! If you're prompted to generate configuration files, feel free to. If you keep following, I'll be providing my configuration which you can poke around. We're also about to overwrite the default .zshrc with the oh-my-zsh one, so hold out on tweaking that!

### 3. Setting up oh-my-zsh and plugins
You're already running zsh, but now we're going to add a manager to handle plugins, updating, and themes. Not the most critical stuff, but this is the reason I went through all this trouble - might as well pay it off!

1. Install [oh-my-zsh](https://github.com/robbyrussell/oh-my-zsh) the manual way. This is well down the page under Advanced Topics. Here's my summary:

```sh
git clone git://github.com/robbyrussell/oh-my-zsh.git ~/.oh-my-zsh
cp ~/.oh-my-zsh/templates/zshrc.zsh-template ~/.zshrc
```

2. Close the current terminal and open a new one to load up oh-my-zsh. If it prompts you to update, do it.
3. If you have a theme file and a .zshrc, now is the time to copy that over (~/.zshrc and ~/.oh-my-zsh/themes/). You can find mine [on my GitHub](https://github.com/dfontana/dotfiles) if you would like a starting point.
    - Realize it does a few things like source a `dir_colors` file, add ssh keys on login, adds the vim generated promptline, and utilize my personal theme (also in that repo). (It's also subject to change!) Be sure to follow step 6 or remove the related lines from the .zshrc if you use mine!
    - Alternatively, feel free to also just edit the .zshrc generated by oh-my-zsh and pick a theme from one of the defaults for yourself! Oh-my-zsh provides samples online, google it.
4. Install any oh-my-zsh plugins now. More information on the repo! My favorite is [zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting/blob/master/INSTALL.md). If you would like that plugin, follow the link and install with the oh-my-zsh package manager guide. Quick tip: This plugin **only** works if it is loaded last in your .zshrc's plugins list. Yes, I know, how odd.

### 4. Mintty settings
This one's short, but this is where we configure mintty's cursor, font, and other stuff. Feel free to poke around.

1. Right click inside your terminal.
2. Hit options.
3. Under *text* change the font to 'Hack' (or your powerline font of choice). Choose your font size (I like 9).
4. When you're done poking around the rest of the settings (like cursor), hit Apply and Save.

### 5. Fixing input issues for python, node, and friends.
I had issues using input libraries from NodeJS and such. I was confused how Git Bash was able to function just fine, yet mintty was failing. The trick? Git Bash aliases node, python, and others to use winpty. Follow along to install winpty and setup the aliases. If you want more information, be sure to stop and read the repo!

1. Download the release from here: https://github.com/rprichard/winpty
    - This means navigating to their [releases and downloading the artifact](https://github.com/rprichard/winpty/releases) (Cygwin tar, choose the correct binary for your platform i.e. x64)
2. `cd <path-to-extracted-files>`
3. Copy the needed files for installing: `cp -an ./bin/* /usr/bin/.` and `cp -an ./lib/* /usr/lib/.`
4. Set permissions for the files with winpty at the start: `chmod 755 /usr/bin/winpty*` and `chmod 755 /usr/lib/winpty*`
5. Ensure you have alias'd in your .zshrc: "node = winpty node.exe"
    - Repeat for any other problematic programs like: ipython php php5 psql python2.7
    - If you want to see how and what GitBash does it this for, go to your cmder's install directory and open: `vendor\git-for-windows\etc\profile.d\aliases.sh`

### 6. Dir Colors, Vim, and the fancy promptline
This section is not very detailed as we're now talking about aesthetic stuff. Look at my github for my configuration files and tweak as you like. Make sure you add in the needed references inside your .zshrc, like using `dir_colors` and sourcing the prompt line's .sh file. This is what I'm doing with them:

1. Copy your minttyrc and `dir_colors` files into their needed spots (see my github for examples, or google!): `~/.minttyrc` and `~/.dir_colors`
2. Copy your vimrc into `~/.vimrc` and install vundle: `git clone https://github.com/VundleVim/Vundle.vim.git ~/.vim/bundle/Vundle.vim`
3. Launch vim and run `:PluginInstall` followed by `:PromptlineSnapshot ~/.shell_prompt.sh airline` to generate the nifty looking powerline prompt script (this needs to be sourced in .zshrc).

## I can't run `upgrade_oh_my_zsh`
I ran into this once, and it was due to line endings being in dos instead of unix. This may have been because of a gitconfig setting or an issue with the repo -- I'm going to say it was me. If you run into line ending issues for anything, try this:

1. Verify this is the issue by checking the file format. For `upgrade_oh_my_zsh` this means the issue is inside ~/.oh-my-zsh/tools/upgrade.sh.
    - I do this by opening the file in vim, where the filetype is displayed on the powerline. If the type is utf-8[dos], you got carriage returns (not desired here).
2. Install dos2unix [(man page)](https://linux.die.net/man/1/dos2unix) with `apt-cyg install dos2unix`. This is a simple utility to convert the line endings of a file.
3. To convert a file just run `dos2unix <path to file>`. In this case, `dos2unix ~/.oh-my-zsh/tools/upgrade.sh`.
