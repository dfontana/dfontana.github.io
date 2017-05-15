if ! screen -list | grep -q "hugo"; then
    cd ~/website
    screen -S hugo -d -m hugo server --baseUrl=192.168.0.16 --bind=192.168.0.16 --buildDrafts  
fi

