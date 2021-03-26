+++
title = "How to Setup ZSH"
date = 2017-10-13
[taxonomies]
tags = ["terminal", "zsh", "configuration"]
+++

Having not been satisfied with the autocompletion bash provides, and curious what alternative shells had to offer, I found ZSH.<!-- more --> In this guide, I'm going to walk you through how I setup ZSH on my Windows machine (inside WSL) - but the instructions compare similarly for my Mac.

## First Step, ZSH
You'll want to boot up your terminal / WSL terminal and install the ZSH package. This is really simple:

- On WSL:
```sh
sudo apt-get install zsh
```

- With Brew:
```sh
brew install zsh zsh-completions
```

Test the installation went well by trying to execute `zsh`. Note on your first run you may be prompted for some configurations, you can simply exit this as we'll be using a manager to handle our ZSH! Type `exit` to move back to bash.

## Oh-My-ZSH
There's a lot of ZSH managers out there - think of these as your package managers. If you want to add a theme or plugin, this is where you look. I prefer Oh-My-ZSH, but recognize there are alternatives! Install with:

```sh
sh -c "$(wget https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh -O -)"
```

After running the installation script, you'll find a few new directories and files in your home dir: `.zshrc` and `.oh-my-zsh`. Just like a `.bashrc`, your `.zshrc` is responsible for aliases, functions, and more - but more importantly - this is also where we can define themes and plugins.

There's lot of settings to be tweaked, check out the default configuration Oh-My-ZSH makes as its pretty well documented with all the options you can tweak. Read on for some plugin recommendations!

## Plugins
Plugins get to be added via the `.zshrc` file and can be found on the official repository or 3rd party suppliers. The big importance to note here is that plugins are *space delimited*. If you simply list your plugins separated by commas, you'll end up loading none of them. So with that said, there's two plugins I like to use the most and are worthy of highlighting. The first is the included `ssh-agent` plugin to automatically add your ssh keys when opening a terminal. Add the following to the `plugins` line of your `~/.zshrc`:

```sh
...

plugins=(z git ssh-agent)

# Tells what identities to load. Can be more than one separated by spaces.
zstyle :omz:plugins:ssh-agent identities id_rsa

# How long to keep these identities loaded before reasking for password.
zstyle :omz:plugins:ssh-agent lifetime 4h

...
```

And that's it! Now when we open a terminal we type in our ssh password once, and 4 hours later we do it again. Another one I really like is called "zsh-syntax-highlighting". It's beyond helpful as it highlights errors in commands as you type them, gives colors to regex's, and more. It's actually syntax highlighting in your command prompt. This one you'll need to clone into the custom .Oh-my-zsh directory:

```sh
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

After which, you'll need to add it to the plugin list in your `.zshrc` file.

```sh
...

plugins-(z git ssh-agent zsh-syntax-highlighting)

...
```

Finally, if you run `source ~/.zshrc` you can reload your configuration and see the changes.

## Keep Exploring
Now that I've gotten you started, check out other [plugins](https://github.com/robbyrussell/oh-my-zsh/wiki/Plugins) and [themes](https://github.com/robbyrussell/oh-my-zsh/wiki/themes) made available by Oh-My-ZSH!

---

### Old Troubleshooting Steps that You Shouldn't Need?
On a final side note, the zsh-syntax-highlighting plugin has given me trouble installing before. I've always gotten it working, but it's taken a combination of some of the following suggestions, so if it doesn't work first go - try adding some of these fixes in your `.zshrc`:

1. List the `zsh-syntax-highlighting` plugin last. This apparently matters according to prior github issues, but I have a hunch it may not matter any longer after looking at how plugins are loaded by oh-my-zsh in debug logs.

2. Try manually sourcing the plugin. This one definitely isn't the best solution, but it can help diagnose. Just add the following to `.zshrc`:
```sh
source ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
```

3. Finally, if the above two options fail, you can also try to modify the fpath manually. Again, this really shouldn't be needed if you are loading your plugins correctly. (Remember, plugins are separated by *spaces* not *commas*).
```sh
fpath=(/usr/local/share/zsh-completions $fpath)
```
