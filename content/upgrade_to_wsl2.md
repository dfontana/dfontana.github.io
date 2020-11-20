+++
title = "Upgrading to WSL2"
date = 2020-03-29
[taxonomies]
tags = ["terminal", "wsl2", "configuration"]
categories = ["system"]
+++

WSL2 comes with a performance and feature perks over the old system, including choice of Linux flavor and a different virtualization strategy. If for no other reason, though, it was simply time for an upgrade.<!-- more --> Here's the shortnotes:

## Get WSL2 Installed ##

Wasn't as straightforward as [the MSDocs made it][ms_docs]. I had to opt into the insiders program, with my computer having been out of date for almost a year -- the slow ring was enough to get the right version. A few restarts later and I had a latest enough build: `19041`. Then it was a matter of:

- Enable Virtual Machine Platform ('Turn Windows Features on or off' > 'Virtual Machine Platform' & 'Windows Subsystem for Linux').
- Reboot, and while you're at the BIOS - turn on Intel Virtualization (VT-x). VT-d, if supported on your system, is also a good call - as it allows direct IO by the virtual machines. I had an issue where this was switched off and WSL2 threw a Virtualization error during installation. You might need to comb over some of the 'Advanced' sections of youe BIOS to find it.

Then the system was ready to _start_ installing WSL2.

### Distro Picking ###

From the MS Store pick out a distro. I stuck with Ubuntu. I had an issue getting the latest Ubuntu to download -- I had apparently tried to install Ubuntu 18.04 before (which is a separate download from Ubuntu latest - simply known as 'Ubuntu' in the store). Uninstalling that version worked fine.

Before booting the new Ubuntu I decided to copy any files I wanted to keep onto a separate drive -- thinks like dotfiles or projects I didn't want to re-clone. Doing this now made it easier later to just flip the switch, so take a moment if you haven't already.

Once ready, launch the new 'Ubuntu' app you downloaded and follow the prompt to setup your user. In my quick searches I couldn't find a way to migrate my existing user over easily, so I found it better to just go with the clean install approach. Once done, boot a Powershell and run `wsl --set-default-version 2` followed by `wsl --set-version <Distro> 2`. If the commands suceeded your almost there. If they failed (like they did for me), you'll want to circle back to checking your System Updates.

### Knock out the old guy ###

`wsl -l -v` will list all your installe distros and their versions. For me this was Ubuntu on WSL 2 and `Ubuntu (Legacy)`. WSL V1 might be what you'll find if you came to the party after Legacy. If you'd like to rid yourself of this, you're looking for the `unregister` command: `wsl --unregister <distroName>`. Verify with a `wsl -l -v` again to confirm it's removal.

## System Prep - Terminal ##

With the new system ready, I like to get my pieces back in place. First was a terminal emulator. I used to use [Cmder][cmdr], but grew tired of that setup pretty quick. I moved onto [Hyper][hyper] but it too felt clunky after a lot of day-to-day use (little things like copy paste or resizing the window just got a bit too annoying). Recently on my Linux dual-boot I've been using [Kitty][kitty] which I've enjoyed, but Windows has no such option.

I opted for the new ['Windows Terminal'][windows_terminal]:

  - Download from the MS Store
  - Launch it, Open the Settings
  - Remove any profiles from the list you don't care for and add a new one with the settings you'd like:

    ```json
    {
      "hidden": false,
      "name": "Ubuntu",
      "source": "Windows.Terminal.Wsl",
      "startingDirectory": "\\\\wsl$\\Ubuntu\\home\\"
    }
    ```

  - If there are some defaults you want to apply to all windows, you can tweak those as well in the `"defaults"` key. Here's mine:

    ```json
    {
      "colorScheme": "Solarized Light",
      "startingDirectory": "~",
      "cursorColor": "#002b36",
      "fontFace": "Fira Code",
      "fontSize": 11
    }
    ```

  - And to wrap up that Solarized scheme, you might want to install the [Solarized Dir Colors][dir_colors]:
    - Download the file you'd like to `~/.dir_colors`.
    - In your bash/zshrc add `eval dircolors ~/.dir_colors`
  - If you're interested in a non-emoji version of Fira Code (which instead uses special patched symbols are requires a compatible prompt), you can download one from [NerdFonts][nerd_fonts]
  - Speaking of prompts, I used to use [Spaceship][spaceship], but decided to give a pure-Rust version (inpired by Spacehsip) a shot - [Starship][starship].

## System Prep - Environment ##

I won't cover everything, but here's a few that you might want:

- Basic system tools: `build-essentials`, `exa` (an `ls` replacement), and `bat` (a `cat` replacement).
- Rust, if that's your poison: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- Go, if you also dabble there: [Download the Linux Tar][go_downloads], `tar -C /usr/local -xzf <downloaded>`, and add to PATH: `export PATH=$PATH:/usr/local/go/bin`

Otherwise that's about it. If you're interested in ZSH, check out my notes on [Setting up ZSH](../setting_up_zsh)

---

### Annoyance: Can't Copy from Vim ###

Problem: I want to `y`ank some code from Vim and paste it in anything that's _not_ vim. In Hyper I could simply highlight + right click, in Windows Terminal I can't.

Fix: Add the following snippet to your `~/.vimrc`:

  ```vim
    " WSL yank support
    let s:clip = '/mnt/c/Windows/System32/clip.exe'  " default location
    if executable(s:clip)
        augroup WSLYank
            autocmd!
            autocmd TextYankPost * call system('echo '.shellescape(join(v:event.regcontents, "\<CR>")).' | '.s:clip)
        augroup END
    end
  ```

  [ms_docs]: https://docs.microsoft.com/en-us/windows/wsl/wsl2-install
  [cmdr]: https://gist.github.com/dfontana/3e27ec5ea3a6f935b7322b580d3df318
  [hyper]: https://hyper.is/
  [kitty]: https://sw.kovidgoyal.net/kitty/
  [windows_terminal]: https://github.com/microsoft/terminal
  [dir_colors]: https://github.com/seebi/dircolors-solarized
  [nerd_fonts]: https://www.nerdfonts.com/
  [spaceship]: https://github.com/denysdovhan/spaceship-prompt
  [starship]: https://github.com/starship/starship
  [go_downloads]: https://golang.org/dl/
