import { Ship } from "./ship.js"
import { Joystick } from "./joystick.js"
import { getDistance, getDistanceToLine, getPythagoreanDistance } from "../client_utils.js"

export class GameEngine{
    constructor(ctx, screen, socket, is_mobile, init_data, images, audios){
        this.ctx = ctx
        this.screen = screen
        this.socket = socket
        this.is_mobile = is_mobile
        this.images = images
        this.audios = audios
        this.force_divider = 20
        this.id = this.socket.id

        this.joystick = new Joystick(this.ctx, this.screen, is_mobile)

        this.map_data = init_data.map_data
        this.background_image = this.images[init_data.map_data.name]
        this.colliders_image = {
            sprite: this.images[`halo_${init_data.map_data.name}`],
            timer: 0,
            reverse: true,
            speed_frame: 70,
            min_alpha: .6,
            current_alpha: 1,
            max_alpha: 1
        }

        this.max_server_score = init_data.max_server_score

        this.ost_volume = .15
        this.background_ost = this.audios[init_data.map_data.name+"_ost"]
        this.background_ost.loop = true
        this.background_ost.volume = this.ost_volume
        this.background_ost.play()

        this.ships = {
            [init_data.id]: new Ship({
                ctx: this.ctx,
                screen: this.screen,
                id: init_data.id,
                username: init_data.username,
                position: init_data.map_data.spawn,
                score: init_data.score,
                angle: init_data.angle,
                color: init_data.color,
                max_server_score: this.max_server_score,
                audios: this.audios,
                images: this.images
            })
        }

        this.win_screen = {
            show: false,
            show_message: false,
            show_winner: false,
            value: '',
            timer: 0,
            speed_frame: 40,
            offset: 0,
            offset_step: 2,
            offset_max: 200
        }

        this.counter_screen = {
            show: false,
            sprite: this.images.counter,
            value : 0,
            timer: 0,
            speed_frame: 60,
            value: 0,
            opacity: 1,
            opacity_min: .5,
            opacity_offset: .025,
            x_offset: 590
        }

        this.default_win_screen = {...this.win_screen}
        this.default_counter_screen = {...this.counter_screen}

        this.initPlayers(init_data.players_data)
        this.initSocketListeners()

        this.last_delta_time = Date.now()
        this.current_delta_time = 0

        // IN GAME BUTTONS //
        this.button_ingame_disconnect = document.createElement("button")
        this.button_ingame_disconnect.setAttribute("id", "button_ingame_disconnect")
        this.button_ingame_disconnect.classList.add("cstm_button")
        this.button_ingame_disconnect.textContent = "Quitter"
        this.button_ingame_disconnect.onclick = () => location.reload()
        document.body.appendChild(this.button_ingame_disconnect)

        this.button_ingame_music = document.createElement("button")
        this.button_ingame_music.setAttribute("id", "button_ingame_music")
        this.button_ingame_music.classList.add("cstm_button")
        this.button_ingame_music.textContent = "Audio"
        this.button_ingame_music.onclick = () => this.switchMusic()
        document.body.appendChild(this.button_ingame_music)
    }

    switchMusic(){
        switch(true){
            case this.background_ost.volume >= this.ost_volume:
                this.background_ost.volume = 0
                this.button_ingame_music.classList.add("line_through")
                for (const id in this.ships)
                    this.ships[id].manageSounds({type: "mute"})
            break
            case this.background_ost.volume < this.ost_volume:
                this.background_ost.volume = this.ost_volume
                this.button_ingame_music.classList.remove("line_through")
                for (const id in this.ships)
                    this.ships[id].manageSounds({type: "unmute"})
            break
        }
    }
    
    update(keys){
        this.current_delta_time = (Date.now() - this.last_delta_time)
        this.last_delta_time = Date.now()
        this.events(keys)
        this.draw()
        if (this.is_mobile)
            this.joystick.update()
    }

    resetWinScreen(){
        this.win_screen = {...this.default_win_screen}
    }

    resetCounterScreen(){
        this.counter_screen = {...this.default_counter_screen}
    }

    initSocketListeners(){
        this.socket.on("new_player", player_data => {
            this.ships[player_data.id] = new Ship({
                ctx: this.ctx,
                screen: this.screen,
                username: player_data.username,
                position: player_data.position,
                angle: player_data.angle,
                color: player_data.color,
                score: player_data.score,
                can_collide: player_data.can_collide,
                max_server_score: this.max_server_score,
                audios: this.audios,
                images: this.images
            })
        })
        this.socket.on("del_player", id => {
            console.log(this.ships[id].username, "s'est déconnecté.")
            delete this.ships[id]
        })
        this.socket.on("coords", data => {
            if (this.ships[data.id]){
                this.ships[data.id].setCoords({
                    position: data.position,
                    angle: data.angle
                })
            }
        })
        this.socket.on("can_collide", data => {
            if (this.ships[data.id])
                this.ships[data.id].can_collide = data.can_collide
        })
        this.socket.on("collision", data => {
            if (this.ships[data.id])
                this.ships[data.id].takeImpact()
        })
        this.socket.on("score", data => {
            if (this.ships[data.id])
                this.ships[data.id].score = data.score
        })
        this.socket.on("player_dead", data => {
            if (this.ships[data.id])
                this.ships[data.id].kill()
        })
        this.socket.on("player_respawn", data => {
            if (this.ships[data.id]){
                this.ships[data.id].respawn({
                    position: data.position,
                    angle: data.angle,
                    can_collide: data.can_collide
                })
            }
        })
        this.socket.on("end_game", data => {
            this.audios.end_game.play()
            this.win_screen.show = true
            this.background_ost.currentTime = 0
            this.background_ost.pause()
            this.win_screen.value = this.ships[data.winner_id].username
            setTimeout(() => {
                this.win_screen.show_winner = true
                setTimeout(()=> { this.win_screen.show_message = true }, 1000)
            }, 1000)
        })
        this.socket.on("start_counter", data => {
            if (!this.counter_screen.show){
                this.counter_screen.show = true
                this.win_screen.show = false
            }
            this.counter_screen.value = data.counter
            this.audios[data.counter].play()
            this.counter_screen.opacity = 1
        })
        this.socket.on("restart_game", data => {
            this.background_ost.play()
            this.counter_screen.value = "Go !"
            this.audios.go.play()
            this.counter_screen.x_offset = 520
            setTimeout(() => {
                this.resetCounterScreen()
            }, 2000)
            this.resetWinScreen()
            this.resetPlayers(data.players_data)
        })
    }

    resetPlayers(players_data){
        for (const id in players_data){
            if (this.ships[id]){
                this.ships[id].angle = players_data[id].angle
                this.ships[id].position = players_data[id].position
                this.ships[id].score = players_data[id].score
                this.ships[id].can_collide = players_data[id].can_collide
            }
        }
    }

    initPlayers(players_data){
        for (const id in players_data){
            this.ships[id] = new Ship({
                ctx: this.ctx,
                screen: this.screen,
                username: players_data[id].username,
                position: players_data[id].position,
                angle: players_data[id].angle,
                color: players_data[id].color,
                score: players_data[id].score,
                can_collide: players_data[id].can_collide,
                max_server_score: this.max_server_score,
                audios: this.audios,
                images: this.images
            })
        }
    }
    
    events(keys){
        if (this.joystick.params.is_picked){
            const horizontal_force = (this.joystick.position.x - this.joystick.initial_position.x) / this.force_divider
            const vertical_force = (this.joystick.position.y - this.joystick.initial_position.y) / this.force_divider
            this.socket.emit("joy_coords", {x: horizontal_force, y: vertical_force})
        } else {
            // HORIZONTAL //
            if (keys.left.isPressed){
                this.socket.emit("key", "l")
            } else if (keys.right.isPressed){
                this.socket.emit("key", "r")
            }
            // VERTICAL //
            if (keys.up.isPressed){
                this.socket.emit("key", "u")
            } else if (keys.down.isPressed){
                this.socket.emit("key", "d")
            }
        }
    }

    draw(){
        // MAP BACKGROUND//
        this.ctx.drawImage(
            this.background_image,
            0,
            0,
            this.background_image.width,
            this.background_image.height,
            0,
            0,
            this.screen.w,
            this.screen.h
        )
        // COLLIDERS IMAGES//
        this.colliders_image.timer += 1 * this.current_delta_time
        if (this.colliders_image.timer > this.colliders_image.speed_frame){
            this.colliders_image.current_alpha += this.colliders_image.reverse ? -.1 : .1
            if (this.colliders_image.current_alpha < this.colliders_image.min_alpha ||
                this.colliders_image.current_alpha > this.colliders_image.max_alpha)
            {
                this.colliders_image.reverse = !this.colliders_image.reverse
            }
            this.colliders_image.timer = 0
        }
        this.ctx.save()
        this.ctx.globalAlpha = this.colliders_image.current_alpha
        this.ctx.drawImage(
            this.colliders_image.sprite,
            0,
            0,
            this.colliders_image.sprite.width,
            this.colliders_image.sprite.height,
            0,
            0,
            this.screen.w,
            this.screen.h
        )
        this.ctx.restore()
        // OTHERS SHIPS //
        for (const id in this.ships)
            this.ships[id].drawShip(this.current_delta_time)
        for (const id in this.ships)
            this.ships[id].drawInfos()
        // WIN SCREEN //
        if (this.win_screen.show)
            this.showWinScreen()
        // COUNTER SCREEN //
        if (this.counter_screen.show)
            this.showCounterScreen()
        // COLLIDERS //
        // this.drawColliders()
    }

    showWinScreen(){
        this.win_screen.timer += 1 * this.current_delta_time
        if (this.win_screen.timer >= this.win_screen.speed_frame && 
            this.win_screen.offset < this.win_screen.offset_max)
        {
            this.win_screen.timer = 0
            this.win_screen.offset += 5
        }
        this.ctx.save()
        this.ctx.fillStyle = "rgb(30,30,30)"
        this.ctx.fillRect(
            0, 
            0, 
            this.screen.w, 
            this.win_screen.offset
        )
        this.ctx.fillRect(
            0,
            this.screen.h,
            this.screen.w,
            -this.win_screen.offset
        )
        
        this.ctx.fillStyle = "orange"
        this.ctx.strokeStyle = "black"
        this.ctx.lineWidth = 4

        if (this.win_screen.show_winner){
            this.ctx.font = "120px quicksand bold"
            const text_width = this.ctx.measureText(this.win_screen.value).width
            console.log(this.ctx.measureText(text_width).width)
            this.ctx.strokeText(
                this.win_screen.value,
                (this.screen.w / 2) - (text_width / 2),
                320
            )
            this.ctx.fillText(
                this.win_screen.value,
                (this.screen.w / 2) - (text_width / 2),
                320
            )
        }

        if (this.win_screen.show_message){
            this.ctx.font = "60px quicksand bold"
            this.ctx.strokeText(
                "Remporte la victoire !",
                380,
                450
            )
            this.ctx.fillStyle = "orange"
            this.ctx.fillText(
                "Remporte la victoire !",
                380,
                450
            )
        }
        this.ctx.restore()
    }

    showCounterScreen(){
        this.counter_screen.timer += 1 * this.current_delta_time
        if (this.counter_screen.timer >= this.counter_screen.speed_frame && 
            this.counter_screen.opacity > 0 && this.counter_screen.current_frame > this.counter_screen.opacity_min)
        {
            this.counter_screen.timer = 0
            this.counter_screen.opacity -= this.counter_screen.opacity_offset
        }
        this.ctx.save()
        this.ctx.globalAlpha = this.counter_screen.opacity

        this.ctx.fillStyle = "white"
        this.ctx.strokeStyle = "black"
        this.ctx.lineWidth = 6

        this.ctx.font = "150px RaceSport bold"
        this.ctx.strokeText(
            this.counter_screen.value,
            this.counter_screen.x_offset,
            350
        )
        this.ctx.fillText(
            this.counter_screen.value,
            this.counter_screen.x_offset,
            350
        )
        this.ctx.restore()
    }

    drawColliders(){
        for (const line of this.map_data.colliders){
            this.ctx.save()
            this.ctx.beginPath()
            this.ctx.strokeStyle = "lime"
            this.ctx.lineWidth = 4
            this.ctx.moveTo(line.points.a.x, line.points.a.y)
            this.ctx.lineTo(line.points.b.x, line.points.b.y)
            this.ctx.stroke()
            this.ctx.closePath()
            this.ctx.restore()

            const line_coords = getDistanceToLine({
                first_point: line.points.a,
                second_point: line.points.b,
                vector: {
                    x: this.ships[this.id].position.x + (this.ships[this.id].offset / 2),
                    y: this.ships[this.id].position.y + (this.ships[this.id].offset / 2),
                }
            })

            if (line_coords.distance){
                const color = line_coords.distance < 30 ? "orange" : "lime"
                this.ctx.save()
                this.ctx.beginPath()
                this.ctx.fillStyle = color
                this.ctx.fillRect(
                    line_coords.points.x,
                    line_coords.points.y,
                    20,
                    20
                )
                this.ctx.restore()
            }
        }
    }
}