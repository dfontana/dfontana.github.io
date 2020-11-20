+++
title = "Setting up a Raspberry Pi - Headless"
date = 2018-12-17
[taxonomies]
tags = ["raspberrypi", "configuration"]
categories = ["system"]
+++

This one is more or less straight to the point. We're going to setup a fresh raspberry pi in a headless state. It's fairly easy if you keep your wits about you.<!-- more --> Unfortunately you'll need either a keyboard/mouse + monitor or an ethernet connection to your device in order to get the wifi step of these instructions done.

## Raspbian Lite & Wifi Connect

1.  Download the image from [raspberrypi](https://www.raspberrypi.org/downloads/raspbian/)
2.  Burn to the SD card (straight from the ZIP) with the free [Etcher](https://etcher.io/).
3.  In the boot partition, add an empty & extension-less file named `ssh` to enable ssh connections to the device.
4.  Now connect the pi to a monitor + keyboard/mouse OR connect it via ethernet and use your router's client list to find it's IP. You will be able to SSH into it if you chose the later route. (And yes, that also means you should be turning on the device in this step)
5.  Setup wifi by editing the `wpa_supplicant.conf` to point your device at your wifi network.

    ```sh
    sudo nano /etc/wpa_supplicant/wpa_supplicant.conf

    # Add at the bottom, WITH the quotes.
    network={
      ssid="YOUR_WIFI_NETWORK_NAME"
      psk="YOUR_WIFI_PASSWORD"
    }
    ```

6.  Run `sudo raspi-config` to set things up.

## Removing the Default Pi Account

Keeping the default account around is a bit of a risk. Let's make it yours.

1. Make a new user:
   1. Enter root: `sudo -i`
   2. Make user: `adduser [username]`
   3. Make that user sudo: `adduser [username] sudo`
2. Enable SSH for the user:
   1. `mkdir /home/[username]/.ssh`
   2. `chown [username]:[username] /home/[username]/.ssh`
   3. Leave root and close SSH connection
3. Give local key to Raspberry Pi for SSH:
   1. `scp ~/.ssh/id_rsa.pub [username]@[Pi's IP address]:/home/[username]/.ssh/authorized_keys`
4. SSH in, delete the Pi account, and make a new root password:
   1. `sudo deluser pi`
   2. `sudo passwd root`

## Some extra random steps you can take if you'd like:

1.  Regenerate SSH keys stored on the Pi:
    `rm /etc/ssh/ssh_host_* && dpkg-reconfigure openssh-server`
2.  Ensure Protocol 2 is uncommented and enabled in `/etc/ssh/sshd_config`
3.  Setup IP Tables:

    1.  `sudo apt install iptables`
    2.  Open ports you want open, for example to open 22: `sudo iptables -A INPUT -p tcp --dport 22 -m state --state NEW -j ACCEPT`
    3.  Allow pinging with: `sudo iptables -A INPUT -p icmp -m icmp --icmp-type 8 -j ACCEPT`
    4.  Block inbound traffic that is doesn't follow any of the rules: `sudo iptables -P INPUT DROP`
    5.  View the rules: `sudo iptables -L`
    6.  Save the rules: `sudo bash -c "iptables-save > /etc/iptables.rules"`
    7.  Run the rules on startup:

        ```sh
        # Edit this file
        nano /etc/network/if-pre-up.d/iptables

        #put these lines
        #!/bin/bash
        /sbin/iptables-restore < /etc/iptables.rules

        # ensure it can execute
        chmod +x /etc/network/if-pre-up.d/iptables
        ```

4.  Setup Fail2Ban to push off bots.
    1. Sudo apt install fail2ban
    2. Configure inside /etc/fail2ban/jail.local
    3. Set some of the configuration [found here](http://felipeferreira.net/index.php/2008/10/securing-your-ssh-with-fail2ban/)
    4. Restart the service: /etc/init.d/fail2ban restart
