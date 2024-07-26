export class Menu{
    constructor(socket, is_mobile, is_standalone, images, audios){
        this.socket = socket
        this.is_mobile = is_mobile
        this.is_standalone = is_standalone
        this.images = images
        this.audios = audios

        this.players_online = 0
        this.username = ""
        this.google_id = ""

        this.current_map = 0

        this.sounds = {
            select: audios.select
        }

        this.menu_container = document.getElementById("menu_container")
        this.bg_video = document.getElementById("bg_video")

        this.redirect_timer = 2500
    
        this.pages = {
            ask_for_mobile: null,
            connection: null,
            username: null,
            maps: null,
            redirect: null
        }

        this.widgets = {
            span_alert: null,
            div_player_infos: null,
            div_topten_content: null,
            div_topten_container: null,
            text_new_username: null,
            text_redirect: null,
            button_create_account: null,
            button_to_maps_page: null,
            button_join: null,
            button_disconnect: null,
            button_install: null,
            button_topten: null,
            input_username: null,
            first_players_count: null,
            second_players_count: null,
            img_color_choice: null,
            left_color_arrow: null,
            right_color_arrow: null
        }

        this.server_images = {
            first: null,
            second: null
        }

        this.server_selected = {
            current: "",
            last: ""
        }

        this.colors = {
            current: 0,
            max: 6,
            images: {
                0: "./assets/gfx/sprites/green_glow.png",
                1: "./assets/gfx/sprites/orange_glow.png",
                2: "./assets/gfx/sprites/purple_glow.png",
                3: "./assets/gfx/sprites/red_glow.png",
                4: "./assets/gfx/sprites/white_glow.png",
                5: "./assets/gfx/sprites/yellow_glow.png",
                6: "./assets/gfx/sprites/blue_glow.png"
            }
        }
    
        this.is_menu_loaded = false
        this.load()
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

    clear(){
        this.menu_container.innerHTML = null
        this.bg_video.remove()
    }

    load(){
        fetch('/session_status', { method: 'GET'})
        .then(res => res.json())
        .then(data => {
          if (data.is_logged){
            this.fetchHtml({load_google_button: false})
            this.checkIfGoogleIdExists()
          } else {
            this.fetchHtml({load_google_button: true})
          }
        })
    }

    checkIfGoogleIdExists(){
        fetch('/googleexists', { method: 'GET'})
        .then(res => res.json())
        .then(data => {
          if (data.exists){
            this.username = data.nickname
            this.google_id = data.google_id
            this.setCurrentPage({page: "maps"})
            this.widgets.div_player_infos.innerHTML = `
                <span class = "white_text span_player_info"> Pseudo : 
                    <span class = "yellow_text"> ${this.username}</span>
                </span>
                <span class = "white_text span_player_info" style = "margin-left: 10px; margin-right: 10px">|</span>
                <span class = "white_text span_player_info"> Victoires : 
                    <span class = "yellow_text"> ${data.score}</span>
                </span>
            `
            this.widgets.div_player_infos.style.display = "flex"
          } else {
            this.widgets.text_new_username.innerHTML = `Bienvenue ${data.name} !`
            this.setCurrentPage({page: "username"})
          }
        })
    }

    setCurrentPage({page}){
        if ((page != "connection" && page != "ask_for_mobile") && this.widgets.button_install.style.display != "none"){
            this.widgets.button_install.style.display = "none"
        }
        for (const key in this.pages){
            if (key == page){
                this.pages[key].style.display = "flex"
            } else {
                this.pages[key].style.display = "none"
            }
        }
    }

    onSignIn = response => {
        const credential = response.credential
        fetch('/tokensignin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'idToken=' + encodeURIComponent(credential)
        }).then(response => {
          if (response.status == 200){
            this.checkIfGoogleIdExists()
          }
        })
    }

    fetchHtml({load_google_button}){
        try{
            fetch('/src/html/menu.html')
                .then(res => res.text())
                .then(data => {
                    this.menu_container.innerHTML = data
                    this.initWidgetsAndListeners()
                    if (this.is_mobile && !this.is_standalone){
                        this.setCurrentPage({page: "ask_for_mobile"})
                    } else {
                        this.setCurrentPage({page: "connection"})
                    }
                    this.socket.emit("get_players_count")
                    if (load_google_button){
                        google.accounts.id.initialize({
                            client_id: '306304073551-q6q9l4diisetjps4set0e06dad2fkcc5.apps.googleusercontent.com',
                            callback: this.onSignIn
                        })
                        google.accounts.id.renderButton(
                        document.querySelector('.g_id_signin'),
                        { 
                            theme: "outline",
                            size: "large",
                            shape: "square",
                            logo_alignment: "left",
                            width: "300"
                        }
                        )
                        google.accounts.id.prompt()
                    }
                })
        } catch (err) {
            console.error(err)
        }
    }

    async createIfNotExists({username}){
        return fetch('/createaccount', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({username: username})})
        .then(res => res.json())
    }
    
    async getTopTen(){
        return fetch('/topten', {
            method: 'GET',
            header: {
                'Content-Type': 'Application/json'
            }
        }).then(res => res.json())
    }

    createAccount(){
        const username = this.widgets.input_username.value
        if (username.length < 3){
            this.popup("warning", "Pseudo : minimum 3 lettres.")
        } else {
            this.createIfNotExists({username: username}).then(data => {
                    if (data.already_exists){
                        this.popup("warning", "Pseudo déjà pris.")
                    } else {
                        this.widgets.button_create_account.style.display = "none"
                        this.widgets.text_redirect.textContent = "Compte crée avec succès !"
                        this.setCurrentPage({page:"redirect"})
                        setInterval(() => {
                            location.reload()
                        }, this.redirect_timer)
                    }
                }
            )
        }
    }

    signOut(){
        fetch('/signout', { method:'POST' })
            .then(res => res.json())
            .then(data => {
                this.widgets.div_player_infos.style.display = "none"
                this.widgets.text_redirect.textContent = "Déconnexion en cours..."
                this.setCurrentPage({page: "redirect"})
                setTimeout(() => {
                    location.reload()
                }, this.redirect_timer)
            }
        )
    }
    
    showTopTen(){
        this.widgets.button_topten.disabled = true
        this.widgets.button_topten.textContent = "Chargement..."
        this.widgets.div_topten_content.innerHTML = `
            <div class = "flex_row space_between topten_header" style = "width:100%;">
                <span>Position</span>
                <span>Pseudo</span>
                <span>Victoires</span>
            </div>

        `
        if (this.widgets.div_topten_container.style.display == "none"){
            this.getTopTen().then(data=> {
                let line_counter = 1
                for (const nickname in data.topten){
                    this.widgets.div_topten_content.innerHTML += `
                    <div class = "flex_row space_between" style = "width:100%;">
                        <span class = "topten_text white_text">
                            ${line_counter}
                        </span>    
                    <span class = "topten_text yellow_text">
                            ${nickname}
                        </span>
                        <span class = "topten_text orange_text">
                            ${data.topten[nickname]}
                        </span>
                    </div>
                    `
                    line_counter++
                }
                this.widgets.div_topten_content.innerHTML += `
                <button id = "button_close_topten" class = "cstm_button" onmouseenter = "wobble(this)">
                    Fermer
                </button>
                `
                document.getElementById("button_close_topten").onclick = () => this.resetTopTenButton()
                this.widgets.div_topten_container.style.display = "flex"
            })
        }
    }

    resetTopTenButton(){
        this.widgets.div_topten_container.style.display = "none"
        this.widgets.button_topten.disabled = false
        this.widgets.button_topten.textContent = "Afficher le top 10"
    }

    initWidgetsAndListeners(){
        ///////// PAGES //////////
        this.pages.connection = document.getElementById("connection_page")
        this.pages.ask_for_mobile = document.getElementById("ask_for_mobile_page")
        this.pages.username = document.getElementById("username_page")
        this.pages.maps = document.getElementById("maps_page")
        this.pages.redirect = document.getElementById("redirect_page")
        ///////// WIDGETS //////////
        this.widgets.span_alert = document.getElementById("span_alert")
        this.widgets.div_player_infos = document.getElementById("div_player_infos")
        this.widgets.div_topten_content = document.getElementById("div_topten_content")
        this.widgets.div_topten_container = document.getElementById("div_topten_container")
        this.widgets.text_new_username = document.getElementById("text_new_username")
        this.widgets.text_redirect = document.getElementById("text_redirect")
        this.widgets.button_create_account = document.getElementById("button_create_account")
        this.widgets.button_to_maps_page = document.getElementById("button_to_maps_page")
        this.widgets.button_join = document.getElementById("button_join")
        this.widgets.button_disconnect = document.getElementById("button_disconnect")
        this.widgets.button_install = document.getElementById("button_install")
        this.widgets.button_topten = document.getElementById("button_topten")
        this.widgets.input_username = document.getElementById("input_username")
        this.widgets.first_players_count = document.getElementById("first_players_count")
        this.widgets.second_players_count = document.getElementById("second_players_count")
        this.widgets.img_color_choice = document.getElementById("img_color_choice")
        this.widgets.left_color_arrow = document.getElementById("left_color_arrow")
        this.widgets.right_color_arrow = document.getElementById("right_color_arrow")
        ///////// MAPS IMAGES //////////
        this.server_images.first = document.getElementById("first_map")
        this.server_images.second = document.getElementById("second_map")
        ///////// LISTENERS /////////
        this.widgets.button_topten.onclick = () => this.showTopTen()
        this.widgets.button_create_account.onclick = () => this.createAccount()
        this.widgets.button_disconnect.onclick = () => this.signOut()
        this.widgets.button_join.onclick = () => this.joinServer()
        this.widgets.left_color_arrow.onclick = () => {
            this.colors.current--
            if (this.colors.current < 0)
                this.colors.current = this.colors.max
            this.widgets.img_color_choice.src = this.colors.images[this.colors.current]
        }
        this.widgets.right_color_arrow.onclick = () => {
            this.colors.current++
            if (this.colors.current > this.colors.max)
                this.colors.current = 0
            this.widgets.img_color_choice.src = this.colors.images[this.colors.current]
        }

        for (const key in this.server_images){
            this.server_images[key].onclick = () =>
                this.server_selected.current = key
        }

        this.widgets.img_color_choice.src = this.colors.images[this.colors.current]
        this.is_menu_loaded = true
    }

    popup(type, message){
        this.widgets.span_alert.textContent = message
        switch(type){
            case "warning":
                this.widgets.span_alert.style.backgroundColor = "rgb(255, 66, 66)"
                this.widgets.span_alert.style.borderColor = "#963b3b"
                this.widgets.span_alert.style.color = "white"

            break
            case "success":
                this.widgets.span_alert.style.backgroundColor = "#64963b"
                this.widgets.span_alert.style.borderColor = "green"
                this.widgets.span_alert.style.color = "rgb(230, 230, 230)"
            break
        }
        this.widgets.span_alert.style.display = "block"
        setTimeout(() => {
            this.widgets.span_alert.style.display = "none"
        }, 3000)
    }

    joinServer(){
        if (this.server_selected.current == ""){
            this.popup("warning", "Veuillez choisir un serveur.")
        } else {
            this.widgets.button_join.disabled = true
            const color = this.colors.images[this.colors.current]
                        .split('/').at(-1).split('.').at(0)
            if (this.socket){
                this.socket.emit("join_server", {
                    username: this.username,
                    google_id: this.google_id,
                    color: color,
                    server: this.server_selected.current
                })
            }
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