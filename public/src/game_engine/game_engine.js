import { Ship } from "./ship.js"
import { Joystick } from "./joystick.js"

export class GameEngine{
    constructor(ctx, screen, socket, is_mobile, init_data, images, audios){
        this.ctx = ctx
        this.screen = screen
        this.socket = socket
        this.images = images
        this.audios = audios
        this.force_divider = 20

        this.joystick = new Joystick(this.ctx, this.screen, is_mobile)

        this.map_data = init_data.map_data
        this.background_image = this.images[init_data.map_data.name]

        this.main_ship = new Ship({
            ctx: this.ctx,
            screen: this.screen,
            id: init_data.id,
            username: init_data.username,
            position: init_data.map_data.spawn,
            angle: init_data.angle,
            color: init_data.color,
            images: this.images
        })

        this.ships = {}
        this.initPlayers(init_data.players_data)
        this.initSocketListeners()

        this.last_delta_time = Date.now()
        this.current_delta_time = 0
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
                images: this.images
            })
        })
        this.socket.on("del_player", id => {
            console.log(this.ships[id].username, "s'est déconnecté.")
            delete this.ships[id]
        })
        this.socket.on("coords", data => {
            if (data.id == this.main_ship.id){
                this.main_ship.setCoords({
                    position: data.position,
                    angle: data.angle
                })
            } else {
                if (this.ships[data.id]){
                    this.ships[data.id].setCoords({
                        position: data.position,
                        angle: data.angle
                    })
                }
            }
        })
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
                images: this.images
            })
        }
    }

    update(keys){
        this.current_delta_time = (Date.now() - this.last_delta_time)
        this.last_delta_time = Date.now()
        this.events(keys)
        this.draw()
        this.main_ship.update(this.current_delta_time)
        this.joystick.update()
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
        // MAP//
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
        // OTHERS SHIPS //
        for (const id in this.ships){
            this.ships[id].update(this.current_delta_time)
            this.ships[id].handleColliding(this.main_ship)
        }
    }
}