import { getAngleTo, getDistance, getDistanceTo } from "../misc_functions.js"

export class Ship {
    constructor({ctx, screen, id, username, position, angle, color, score, images}){
        this.ctx = ctx
        this.screen = screen
        this.half_screen = {x: screen.w / 2, y: screen.h / 2}
        this.id = id
        this.username = username
        this.position = position
        this.angle = angle
        this.color = color
        this.score = score
        this.images = images

        this.offset = 25

        this.collide_distance = 1200
        this.bounce_offset = .15
        this.mass = 1

        this.velocity = {
            vertical: 0,
            horizontal: 0,
            vertical_max_default: 6,
            horizontal_max_default: 6,
            vertical_max: 6,
            horizontal_max: 6,
            step: .006
        }

        this.current_delta_time = 0
        this.directions = {horizontal: '', vertical: ''}
    }

    update(current_delta_time){
        this.current_delta_time = current_delta_time
        this.draw()
    }

    setCoords({position, angle}){
        this.position = position
        this.angle = angle
    }

    draw(){
        // GLOW //
        this.ctx.drawImage(
            this.images[this.color],
            0,
            0,
            this.images[this.color].width,
            this.images[this.color].height,
            this.position.x - this.offset / 2,
            this.position.y - this.offset / 2,
            this.offset * 3,
            this.offset * 3
        )
        // SHIP //
        this.ctx.save()
        this.ctx.translate(this.position.x + this.offset, this.position.y + this.offset)
        this.ctx.rotate(this.angle - Math.PI / 2)
        this.ctx.drawImage(
            this.images.ship,
            0,
            0,
            this.images.ship.width,
            this.images.ship.height,
            -this.offset,
            -this.offset,
            50,
            50
        )
        this.ctx.restore()
    }

    handleColliding(ship){
        if (getDistance(ship.position, this.position) <= this.collide_distance){
            switch(true){
                case ship.velocity.horizontal > 0:
                    ship.velocity.horizontal = -ship.velocity.horizontal - this.bounce_offset
                    this.velocity.horizontal -= ship.velocity.horizontal / this.mass
                break
                case ship.velocity.horizontal < 0:
                    ship.velocity.horizontal = Math.abs(ship.velocity.horizontal) + this.bounce_offset
                    this.velocity.horizontal -= ship.velocity.horizontal / this.mass
                break
            }
            switch(true){
                case ship.velocity.vertical > 0:
                    ship.velocity.vertical = -ship.velocity.vertical - this.bounce_offset
                    this.velocity.vertical -= ship.velocity.vertical / this.mass
                break
                case ship.velocity.vertical < 0:
                    ship.velocity.vertical = Math.abs(ship.velocity.vertical) + this.bounce_offset
                    this.velocity.vertical -= ship.velocity.vertical / this.mass
                break
            }
        }
    }

    move(){
        switch(this.directions.horizontal){
            case 'l':
                if (this.velocity.horizontal > -this.velocity.horizontal_max)
                    this.velocity.horizontal -= this.velocity.step * this.current_delta_time
                if (this.velocity.horizontal < -this.velocity.horizontal_max)
                    this.velocity.horizontal = -this.velocity.horizontal_max
            break
            case 'r':
                if (this.velocity.horizontal < this.velocity.horizontal_max)
                    this.velocity.horizontal += this.velocity.step * this.current_delta_time
                if (this.velocity.horizontal > this.velocity.horizontal_max)
                    this.velocity.horizontal = this.velocity.horizontal_max
            break
            default:
                if (this.velocity.horizontal < 0){
                    this.velocity.horizontal += this.velocity.step * this.current_delta_time
                    if (this.velocity.horizontal > 0){
                        this.velocity.horizontal = 0
                    }
                }
                if (this.velocity.horizontal > 0){
                    this.velocity.horizontal -= this.velocity.step * this.current_delta_time
                    if (this.velocity.horizontal < 0){
                        this.velocity.horizontal = 0
                    }
                }
            break
        }

        switch(this.directions.vertical){
            case 'u':
                if (this.velocity.vertical > -this.velocity.vertical_max)
                    this.velocity.vertical -= this.velocity.step * this.current_delta_time
                if (this.velocity.vertical < -this.velocity.vertical_max)
                    this.velocity.vertical = -this.velocity.vertical_max
            break
            case 'd':
                if (this.velocity.vertical < this.velocity.vertical_max)
                    this.velocity.vertical += this.velocity.step * this.current_delta_time
                if (this.velocity.vertical > this.velocity.vertical_max)
                    this.velocity.vertical = this.velocity.vertical_max
            break
            default:
                if (this.velocity.vertical < 0){
                    this.velocity.vertical += this.velocity.step * this.current_delta_time
                    if (this.velocity.vertical > 0){
                        this.velocity.vertical = 0
                    }
                }
                if (this.velocity.vertical > 0){
                    this.velocity.vertical -= this.velocity.step * this.current_delta_time
                    if (this.velocity.vertical < 0){
                        this.velocity.vertical = 0
                    }
                }
            break
        }

        this.position.x += this.velocity.horizontal
        this.position.y += this.velocity.vertical

        if (this.velocity.horizontal != 0 && this.velocity.vertical != 0)
            this.angle = Math.atan2(-this.velocity.vertical, -this.velocity.horizontal)

        this.directions.horizontal = ''
        this.directions.vertical = ''
        this.velocity.horizontal_max = this.velocity.horizontal_max_default
        this.velocity.vertical_max = this.velocity.vertical_max_default
    }
}