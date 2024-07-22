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
        this.id = this.socket.id

        this.joystick = new Joystick(this.ctx, this.screen, is_mobile)

        this.map_data = init_data.map_data
        this.background_image = this.images[init_data.map_data.name]

        this.max_server_score = init_data.max_server_score

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
        this.initPlayers(init_data.players_data)
        this.initSocketListeners()

        this.last_delta_time = Date.now()
        this.current_delta_time = 0
    }
    
    update(keys){
        this.current_delta_time = (Date.now() - this.last_delta_time)
        this.last_delta_time = Date.now()
        this.events(keys)
        this.draw()
        this.joystick.update()
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
        this.socket.on("collision", data => {
            if (this.ships[data.id]){
                this.ships[data.id].takeImpact({
                    force_impact: data.force_impact,
                    angle_impact: data.angle_impact
                })
            }
        })
        this.socket.on("score", data => {
            if (this.ships[data.id]){
                this.ships[data.id].score = data.score
            }
        })
        this.socket.on("player_dead", data => {
            if (this.ships[data.id]){
                this.ships[data.id].kill()
            }
        })
        this.socket.on("player_respawn", data => {
            if (this.ships[data.id]){
                this.ships[data.id].respawn({
                    position: data.position,
                    angle: data.angle
                })
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
        // OTHERS SHIPS //
        for (const id in this.ships)
            this.ships[id].drawShip(this.current_delta_time)
        for (const id in this.ships)
            this.ships[id].drawInfos()
        // COLLIDERS //
        this.drawColliders()
    }

    drawColliders(){
        const lines = [
            {
                points: {
                    a: {x: 190, y: 233},
                    b: {x: 190, y: 500}
                }
            },
            {
                points: {
                    a: {x: 190, y: 233},
                    b: {x: 360, y: 138}
                }
            },
            {
                points: {
                    a: {x: 360, y: 138},
                    b: {x: 554, y: 138}
                }
            },
            {
                points: {
                    a: {x: 554, y: 138},
                    b: {x: 573, y: 154}
                }
            },
            {
                points: {
                    a: {x: 573, y: 154},
                    b: {x: 710, y: 154}
                }
            },
            {
                points: {
                    a: {x: 710, y: 154},
                    b: {x: 729, y: 138}
                }
            },
            {
                points: {
                    a: {x: 729, y: 138},
                    b: {x: 915, y: 138}
                }
            },
            {
                points: {
                    a: {x: 915, y: 138},
                    b: {x: 1072, y: 233}
                }
            },
            {
                points: {
                    a: {x: 1072, y: 233},
                    b: {x: 1072, y: 500}
                }
            },
            {
                points: {
                    a: {x: 915, y: 591},
                    b: {x: 1072, y: 500}
                }
            },
            {
                points: {
                    a: {x: 915, y: 591},
                    b: {x: 710, y: 591}
                }
            },
            {
                points: {
                    a: {x: 687, y: 563},
                    b: {x: 710, y: 591}
                }
            },
            {
                points: {
                    a: {x: 687, y: 563},
                    b: {x: 585, y: 563}
                }
            },
            {
                points: {
                    a: {x: 559, y: 591},
                    b: {x: 585, y: 563}
                }
            },
            {
                points: {
                    a: {x: 559, y: 591},
                    b: {x: 365, y: 591}
                }
            },
            {
                points: {
                    a: {x: 190, y: 500},
                    b: {x: 365, y: 591}
                }
            },
        ]
        
        for (const line of lines){
            this.ctx.save()
            this.ctx.beginPath()
            this.ctx.strokeStyle = "red"
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

            // console.log(line_coords.points)
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