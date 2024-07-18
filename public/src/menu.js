export class Menu{
    constructor(socket, images, audios){
        this.socket = socket
        this.images = images
        this.audios = audios

        this.players_online = 0
        this.username = ""

        // this.html_input.onkeydown = e => /[0-9a-zA-Z]/i.test(e.key)
        this.current_map = 0
        this.maps = {
            0: {name: "isle", img: images.isle},
            1: {name: "sand", img: images.sand}
        }

        this.sounds = {
            select: audios.select
        }

        this.is_menu_loaded = false
        this.loadHtml()
        this.networkListener()
    }

    update(){
        if (this.is_menu_loaded){
            
        }
    }

    loadHtml(){
        try{
            fetch('/src/html/menu.html')
                .then(res => res.text())
                .then(data => {
                    document.getElementById("menu_container").innerHTML = data
                    this.is_menu_loaded = true
                })
        } catch (err) {
            console.error(err)
        }
    }

    quickLaunch({map_name}){
        this.username = `toto_${this.socket.id.substr(0, 3)}`
        this.socket.emit("waiting", {username: this.username, map: map_name}) 
        this.page = "waiting_page"
    }

    networkListener(){
        this.socket.on("game_found", () => {
            this.page = "gamefound_page"
            this.sounds.select.currentTime = 0
            this.sounds.select.play()
        })
        this.socket.on("opponent_leave", () => {
            this.page = "main_page"
            this.html_input.value = ""
            this.username = ""
        })
        this.socket.on("players_online", n => {
            this.players_online = n == 0 ? 1 : n
        })
    }
}