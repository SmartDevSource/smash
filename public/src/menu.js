export class Menu{
    constructor(socket, images, audios){
        this.socket = socket
        this.images = images
        this.audios = audios

        this.players_online = 0
        this.username = ""

        this.current_map = 0
        this.maps = {
            0: {name: "isle", img: images.isle},
            1: {name: "sand", img: images.sand}
        }

        this.sounds = {
            select: audios.select
        }

        this.span_alert = null
        this.button_connect = null
        this.input_username = null
    
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
                    this.initWidgetsAndListeners()
                })
        } catch (err) {
            console.error(err)
        }
    }

    initWidgetsAndListeners(){
        this.span_alert = document.getElementById("span_alert")
        this.button_connect = document.getElementById("button_connect")
        this.input_username = document.getElementById("input_username")
        this.button_connect.onclick = () => {
            const username = this.input_username.value
            if (username.length < 3){
                this.popup("warning", "Votre pseudo doit contenir au moins 3 lettres.")
            }
        }
        this.is_menu_loaded = true
    }

    popup(type, message){
        this.span_alert.textContent = message
        switch(type){
            case "warning":
                this.span_alert.style.backgroundColor = "rgb(255, 66, 66)"
                this.span_alert.style.borderColor = "rgb(192, 51, 51)"
            break
        }
        this.span_alert.style.display = "block"
        setTimeout(() => {
            this.span_alert.style.display = "none"
        }, 2000)
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