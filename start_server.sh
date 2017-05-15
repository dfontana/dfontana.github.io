if ! screen -list | grep -q "minecraft"; then
    cd ~/website
    screen -S hugo -d -m hugo server --port=8000 --baseUrl=192.168.0.16 --bind=192.168.0.16 --buildDrafts  
fi

