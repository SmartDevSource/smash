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

        this.pages = {
            username: null,
            maps: null
        }

        this.widgets = {
            span_alert: null,
            button_to_maps_page: null,
            button_join: null,
            button_back: null,
            input_username: null,
            first_players_count: null,
            second_players_count: null
        }

        this.server_images = {
            first: null,
            second: null
        }

        this.server_selected = {
            current: "",
            last: ""
        }

        this.last_page = ""
        this.current_page = ""
    
        this.is_menu_loaded = false
        this.loadHtml()
        this.networkListener()
    }

    update(){
        if (this.is_menu_loaded){
            this.handleEvents()
        }
    }

    handleEvents(){
        if (this.server_selected.current != this.server_selected.last){
            this.server_images[this.server_selected.current].style.outline = "2px solid white"
            if (this.server_selected.last != "")
                this.server_images[this.server_selected.last].style.outline = "none"
            this.server_selected.last = this.server_selected.current
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
        ///////// WIDGETS //////////
        this.pages.username = document.getElementById("username_page")
        this.pages.maps = document.getElementById("maps_page")
        this.widgets.span_alert = document.getElementById("span_alert")
        this.widgets.button_to_maps_page = document.getElementById("button_to_maps_page")
        this.widgets.button_join = document.getElementById("button_join")
        this.widgets.button_back = document.getElementById("button_back")
        this.widgets.input_username = document.getElementById("input_username")
        this.widgets.first_players_count = document.getElementById("first_players_count")
        this.widgets.second_players_count = document.getElementById("second_players_count")
        ///////// MAPS IMAGES //////////
        this.server_images.first = document.getElementById("first_map")
        this.server_images.second = document.getElementById("second_map")
        ///////// LISTENERS /////////
        this.widgets.button_to_maps_page.onclick = () => {
            const username = this.widgets.input_username.value
            if (username.length < 3)
                this.popup("warning", "Pseudo : minimum 3 lettres.")
            else {
                this.loadMapPage(username)
            }
        }

        this.widgets.button_back.onclick = () => {
            this.pages[this.current_page].style.display = "none"
            this.pages[this.last_page].style.display = "flex"
            this.current_page = this.last_page
        }

        this.widgets.button_join.onclick = () => {
            if (this.server_selected.current == ""){
                this.popup("warning", "Veuillez choisir un serveur.")
            } else {
                this.joinServer()
            }
        }

        for (const key in this.server_images){
            this.server_images[key].onclick = () => {
                this.server_selected.current = key
            }
        }

        this.is_menu_loaded = true
    }

    loadMapPage(username){
        this.username = username
        this.pages.username.style.display = "none"
        this.pages.maps.style.display = "flex"
        this.last_page = "username"
        this.current_page = "maps"
        this.socket.emit("get_players_count")
    }

    popup(type, message){
        this.widgets.span_alert.textContent = message
        switch(type){
            case "warning":
                this.widgets.span_alert.style.backgroundColor = "rgb(255, 66, 66)"
                this.widgets.span_alert.style.borderColor = "rgb(192, 51, 51)"
            break
        }
        this.widgets.span_alert.style.display = "block"
        setTimeout(() => {
            this.widgets.span_alert.style.display = "none"
        }, 3000)
    }

    quickLaunch({map_name}){
        this.username = `toto_${this.socket.id.substr(0, 3)}`
    }

    joinServer(){
        if (this.socket){
            this.socket.emit("join_server", {
                username: this.username,
                server: this.server_selected.current
            })
        }
    }

    networkListener(){
        this.socket.on("server_full", () => {
            this.popup("warning", "Le serveur est plein.")
        })
        this.socket.on("players_count", players_count => {
            for (const key in players_count){
                this.widgets[key].textContent = players_count[key]
            }
        })
    }
}