export class Menu{
    constructor(screen, ctx, socket, images, audios){
        this.screen = screen
        this.ctx = ctx
        this.socket = socket
        this.images = images
        this.audios = audios

        this.is_menu_ready = false
        this.players_online = 0

        this.text_alpha = {
            switch: false,
            value: 1
        }
        this.text_wobble = {
            value: 1,
            min: 1,
            max: 1.2,
            tick_speed: .03,
            reverse: false
        }
        this.game_logo = {
            image: images.retrowar_logo,
            position: {x: 820, y: 150}
        }
        this.stars_background = {
            image: images.stars_background,
            offset: {w: 0, h: 0}
        }
        this.ship_background = {
            image: images.ship_background,
            offset: {w: 0, h: 0},
            position: {x: 0, y: 400}
        }

        this.global_alpha = 0
        this.background_frame = 0
        this.frames_count = 60
        this.tick_anim = Date.now()
        this.tick_refresh = 60

        this.initImagesSettings()

        const font_operator = new FontFace(
            "operator",
            "url('./assets/fonts/operator.ttf')"
        )
        document.fonts.add(font_operator)

        this.mouse = {
            is_down: false,
            coords: {x: 0, y: 0}
        }
        this.page = "main_page"

        this.focused = null
        this.tick_focus = 0
        this.focus_cursor = false

        if (document.getElementById("hidden_input")){
            document.getElementById("hidden_input").remove()
        }

        this.html_input = document.createElement("input")
        this.html_input.setAttribute("id", "hidden_input")
        this.html_input.onkeydown = e => /[0-9a-zA-Z]/i.test(e.key)
        this.html_input.setAttribute("maxlength", `10`)
        this.html_input.style.display = "none"
        this.html_input.value = ""
        document.body.appendChild(this.html_input)

        this.labels = []

        this.alert = {
            show: false,
            message: "",
            opacity: 0,
            translate: {x: 13, y: 0}
        }

        this.current_map = 0
        this.maps = {
            0: {name: "isle", img: images.isle},
            1: {name: "sand", img: images.sand}
        }

        this.username = ""

        this.sounds = {
            select: audios.select
        }

        this.initWidgets()
        this.initListeners()
        this.networkListener()
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

    update(){
        this.deltaClock()
        this.drawBackground()
        this.drawWidgets()
        if (this.page == "map_page"){
            this.mapSlider()
        }
        this.label({
            page: "",
            text: "Joueurs en ligne : " + this.players_online,
            position: {x: 330, y: 50},
            size: 12
        })
        if (this.alert.show){
            if (this.alert.opacity < 1){
                this.alert.opacity += .05
            }
            this.showAlert()
        }
        this.mouse.is_down = false
    }

    mapSlider(){
        const position = {x: 340, y: 345}
        this.ctx.save()
        this.ctx.strokeStyle = "blue"
        this.ctx.lineWidth = 3
        this.ctx.strokeRect(
            position.x,
            position.y,
            120,
            120
        )
        this.ctx.drawImage(
            this.maps[this.current_map].img,
            position.x,
            position.y,
            120,
            120
        )
        this.ctx.restore()
    }

    drawWidgets(){
        for (const label of this.labels){
            if (label.page == this.page){
                this.label({
                    text: label.text,
                    position: label.position,
                    animated: label.animated,
                    on_click: label.on_click,
                    size: label.size || 16,
                    wobble: label.wobble
                })
            }
        }
        if (this.page == "nickname_page" && 
            this.html_input.style.display == "none")
        {
            this.html_input.style.display = "block"
        } else if (this.page != "nickname_page" &&
            this.html_input.style.display != "none")
        {
            this.html_input.style.display = "none"
        }
    }

    initWidgets(){
        this.labels = [
            //////// MAIN PAGE LABELS ////////
            {
                page: "main_page",
                text: "Trouver un adversaire", 
                position: {x: 305, y: 550},
                animated: true,
                on_click: () => this.page = "nickname_page"
            },
            //////// SEARCH PAGE LABELS ////////
            {
                page: "nickname_page",
                text: "Votre pseudo :", 
                position: {x: 333, y: 500},
                animated: false,
            },
            {
                page: "nickname_page",
                text: "Suivant", 
                position: {x: 362, y: 630},
                animated: true,
                on_click: () => this.checkUsername()
            },
            {
                page: "nickname_page",
                text: "Retour", 
                position: {x: 367, y: 730},
                on_click: () => this.page = "main_page"
            },
            {
                page: "map_page",
                text: "Choix de la map",
                position: {x: 325, y: 320}
            },
            {
                page: "map_page",
                text: "Joueur(s) en attente :",
                position: {x: 325, y: 520},
                size: 10
            },
            {
                page: "map_page",
                text: "<<",
                position: {x: 300, y: 430},
                animated: true,
                size: 24,
                on_click: () => this.setMapCursor("left")
            },
            {
                page: "map_page",
                text: ">>",
                position: {x: 470, y: 430},
                animated: true,
                size: 24,
                on_click: () => this.setMapCursor("right")
            },
            {
                page: "map_page",
                text: "C'est parti !",
                position: {x: 342, y: 600},
                animated: true,
                on_click: () => { 
                    if (this.username.length >= 3){
                        this.socket.emit("waiting", {username: this.username, map: this.maps[this.current_map].name}) 
                        this.page = "waiting_page"
                    } else {
                        this.alert.translate = {x: 0, y: 0}
                        this.triggerAlert("Pseudo trop court !\nMinimum 3 caractères.")
                    }
                }
            },
            {
                page: "map_page",
                text: "Retour", 
                position: {x: 367, y: 730},
                on_click: () => this.page = "nickname_page"
            },
            {
                page: "waiting_page",
                text: "En attente d'un adversaire",
                position: {x: 280, y: 510},
                animated: true
            },
            {
                page: "waiting_page",
                text: "Annuler la recherche", 
                position: {x: 305, y: 730},
                on_click: () => {
                    this.socket.emit("cancel") 
                    this.page = "map_page"
                }
            },
            {
                page: "gamefound_page",
                text: "Partie trouvée !", 
                position: {x: 365, y: 550},
                wobble: true,
            }
        ]
    }

    checkUsername(){
        const username = this.html_input.value
        if (username.length >=3){
            this.username = username
            this.page = "map_page"
        } else {
            this.triggerAlert("Pseudo trop court !\nMinimum 3 caractères.")
        }
    }

    triggerAlert(message, persistent){
        this.alert.show = true
        this.alert.message = message
        if (!persistent){
            setTimeout(()=> {
                this.alert.show = false
                this.alert.opacity = 0
                this.alert.message = ""
            }, 3000)
        }
    }

    setMapCursor(direction){
        const maps_length = Object.keys(this.maps).length - 1
        switch(direction){
            case "left":
                this.current_map--
                if (this.current_map < 0)
                    this.current_map = maps_length
            break
            case "right":
                this.current_map++
                if (this.current_map > maps_length)
                    this.current_map = 0
            break
        }
    }

    initListeners(){
        window.addEventListener("mousedown", e => {
            this.mouse.is_down = true
            const x = e.offsetX * this.ctx.canvas.width / this.ctx.canvas.offsetWidth,
                  y = e.offsetY * this.ctx.canvas.height / this.ctx.canvas.offsetHeight
            this.mouse.coords = {x: x, y: y}
        })
    }

    initImagesSettings(){
        this.stars_background.offset = {
            w: this.stars_background.image.width / this.frames_count, 
            h: this.stars_background.image.height
        }

        this.ship_background.offset = {
            w: this.ship_background.image.width / this.frames_count, 
            h: this.ship_background.image.height
        }
    }

    deltaClock(){
        if (Date.now() - this.tick_anim > this.tick_refresh){
            this.tick_focus++
            if (this.tick_focus > 5){
                this.tick_focus = 0
                this.focus_cursor = !this.focus_cursor
            }
            this.background_frame++
            if (this.ship_background.position.y > - 80)
                this.ship_background.position.y -= 20
            if (this.global_alpha < 1)
                this.global_alpha += .03
            if (this.global_alpha >= 1)
                this.is_menu_ready = true
            if (this.is_menu_ready){
                switch(this.text_alpha.switch){
                    case true:
                        this.text_alpha.value -= .05
                        if (this.text_alpha.value <= .4)
                            this.text_alpha.switch = false
                    break
                    case false:
                        this.text_alpha.value += .05
                        if (this.text_alpha.value >= 1)
                            this.text_alpha.switch = true
                    break
                }
            }
            switch(this.text_wobble.reverse){
                case true:
                    if (this.text_wobble.value > this.text_wobble.min)
                        this.text_wobble.value -= this.text_wobble.tick_speed
                    else 
                        this.text_wobble.reverse = false
                break
                case false:
                    if (this.text_wobble.value < this.text_wobble.max)
                        this.text_wobble.value += this.text_wobble.tick_speed
                    else 
                        this.text_wobble.reverse = true
                break
            }
            this.tick_anim = Date.now()
        }
    }

    drawBackground(){
        if (this.background_frame >= this.frames_count)
            this.background_frame = 0

        this.ctx.drawImage(
            this.stars_background.image, 
            this.background_frame * this.stars_background.offset.w, 
            0,
            this.stars_background.offset.w,
            this.stars_background.offset.h,
            0,
            0,
            this.screen.w,
            this.screen.h
        )

        this.ctx.drawImage(
            this.ship_background.image, 
            this.background_frame * this.ship_background.offset.w, 
            0,
            this.ship_background.offset.w,
            this.ship_background.offset.h,
            this.ship_background.position.x,
            this.ship_background.position.y,
            this.screen.w,
            this.screen.h
        )

        this.ctx.save()
        this.ctx.globalAlpha = this.global_alpha
        this.ctx.scale(.3, .6)
        this.ctx.drawImage(
            this.game_logo.image, 
            this.game_logo.position.x,
            this.game_logo.position.y,
        )
        this.ctx.restore()
    }

    label({text, position, animated = false, on_click, size = 16, wobble=false}){
        const original_position = Object.assign({}, position)
        this.ctx.save()
        if (animated){
            this.ctx.globalAlpha = !this.is_menu_ready ? this.global_alpha : this.text_alpha.value
        }
        if (wobble){
            this.ctx.scale(this.text_wobble.value, this.text_wobble.value + 3)
            original_position.x /= this.text_wobble.value
            original_position.x -= (this.text_wobble.value) * text.length + size
            original_position.y /= this.text_wobble.value + 3
        } else {
            this.ctx.scale(1, 3)
            original_position.x /= 1
            original_position.y /= 3
        }
        this.ctx.font = `${size}px operator`
        this.ctx.fillStyle = "white"
        this.ctx.strokeStyle = "blue"
        this.ctx.lineWidth = 1
        this.ctx.strokeText(text, original_position.x, original_position.y)
        this.ctx.fillText(text, original_position.x, original_position.y)
        const text_width = this.ctx.measureText(text).width
        this.ctx.restore()

        if (on_click && this.mouse.is_down &&
            this.mouse.coords.x >= original_position.x && this.mouse.coords.x <= original_position.x + text_width && 
            this.mouse.coords.y >= (original_position.y*3) - (40 + size) && this.mouse.coords.y <= (original_position.y*3) + 10)
        {
            this.sounds.select.currentTime = 0
            this.sounds.select.play()
            this.mouse.is_down = false
            on_click()
        }
    }

    input({id, position, scale, value, on_click}){
        this.ctx.fillStyle = "white"
        this.ctx.strokeStyle = "grey"
        this.ctx.lineWidth = 2
        this.ctx.fillRect(
            position.x, 
            position.y,
            scale.x,
            scale.y
        )
        this.ctx.strokeRect(
            position.x, 
            position.y,
            scale.x,
            scale.y
        )
        if (on_click && this.mouse.is_down &&
            this.mouse.coords.x >= position.x && this.mouse.coords.x <= position.x + scale.x && 
            this.mouse.coords.y >= position.y && this.mouse.coords.y <= position.y + scale.y)
        {    
            this.html_input.focus()
            on_click()
        }
        if (this.focused == id){
            if (this.focus_cursor){
                this.ctx.fillStyle = "black"
                this.ctx.fillRect(
                    position.x + 2 + value.length * 12, 
                    position.y + 5,
                    1,
                    scale.y - 10
                )
            }
        }
        this.ctx.save()
        this.ctx.scale(1, 1.5)
        this.ctx.font = "bold 20px Courier New, monospace"
        this.ctx.fillStyle = "black"
        this.ctx.fillText(value, position.x + 2, position.y - 150)
        this.ctx.restore()
    }

    showAlert(){
        const message = this.alert.message.split('\n')
        const max_text_width = [...message].sort((a,b) => b.length - a.length)[0].length

        const left = (this.ctx.canvas.width / 2) - (max_text_width * 4) - 15,
              top = (this.ctx.canvas.height / 2) - (message.length * 5),
              right = (max_text_width * 8) + 15,
              bottom = message.length * 50

        this.ctx.save()
        this.ctx.translate(this.alert.translate.x, this.alert.translate.y)
        this.ctx.globalAlpha = this.alert.opacity
        
        this.ctx.fillStyle = "#bf3030"
        this.ctx.strokeStyle = "black"
        this.ctx.lineWidth = 2
        this.ctx.fillRect(
            left,
            top,
            right,
            bottom
        )
        this.ctx.strokeRect(
            left,
            top,
            right,
            bottom
        )

        this.ctx.scale(1, 3)

        for (let i = 0 ; i < message.length ; i++){
            this.ctx.font = '12px operator'
            this.ctx.fillStyle = "white"
            this.ctx.strokeStyle = "black"
            this.ctx.lineWidth = 2
            this.ctx.strokeText(message[i], left + 10, 12 + (top / 3) + i * 15)
            this.ctx.fillText(message[i], left + 10, 12 + (top / 3) + i * 15)
        }
        this.ctx.restore()

    }
}