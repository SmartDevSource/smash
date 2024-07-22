import { Ship } from "./ship.js"
import { Joystick } from "./joystick.js"
import { getDistance, getDistanceToLine, getPythagoreanDistance } from "../misc_functions.js"

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

        this.max_server_score = init_data.max_server_score

        this.main_ship = new Ship({
            ctx: this.ctx,
            screen: this.screen,
            id: init_data.id,
            username: init_data.username,
            position: init_data.map_data.spawn,
            score: init_data.score,
            angle: init_data.angle,
            color: init_data.color,
            max_server_score: this.max_server_score,
            images: this.images
        })

        this.ships = {}
        this.initPlayers(init_data.players_data)
        this.initSocketListeners()

        this.colliders = [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ]
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
                max_server_score: this.max_server_score,
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
                max_server_score: this.max_server_score,
                images: this.images
            })
        }
    }

    update(keys){
        this.events(keys)
        this.draw()
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
        // OTHERS SHIPS //
        for (const id in this.ships)
            this.ships[id].drawShip()
        for (const id in this.ships)
            this.ships[id].drawInfos()
        // MAIN SHIP //
        this.main_ship.drawShip()
        this.main_ship.drawInfos()
        // COLLIDERS //
        this.drawColliders()
    }

    drawColliders(){
        // for(let y = 0 ; y < this.colliders.length ; y++){
        //     for(let x = 0 ; x < this.colliders[y].length ; x++){
        //         if (this.colliders[y][x] == 1){
        //             this.ctx.save()
        //             this.ctx.globalAlpha = .5
        //             this.ctx.fillStyle = "red"
        //             this.ctx.fillRect(x*50, y*50, 50, 50)
        //             this.ctx.restore()
        //         }
        //     }
        // }

        const first_point = {x: 600, y: 200}
        const second_point = {x: 800, y: 400}

        // const line_coords = getDistanceToLine({
        //     first_point: first_point,
        //     second_point: second_point,
        //     vector: this.main_ship.position,
        //     offset: this.main_ship.offset
        // })

        // this.ctx.save()
        // this.ctx.beginPath()
        // this.ctx.strokeStyle = "red"
        // this.ctx.lineWidth = 4
        // this.ctx.moveTo(first_point.x, first_point.y)
        // this.ctx.lineTo(second_point.x, second_point.y)
        // this.ctx.stroke()
        // this.ctx.closePath()
        // this.ctx.restore()

        // if (line_coords.distance){
        //     this.ctx.save()
        //     this.ctx.beginPath()
        //     this.ctx.fillStyle = "lime"
        //     this.ctx.fillRect(
        //         line_coords.point.x,
        //         line_coords.point.y,
        //         5,
        //         5
        //     )
        //     this.ctx.restore()
        // }
    }
}