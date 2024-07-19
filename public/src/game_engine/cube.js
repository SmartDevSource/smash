import { getAngleTo, getDistance, getDistanceTo } from "../misc_functions.js"

export class Cube{
    constructor(ctx, screen, position, images){
        this.ctx = ctx
        this.screen = screen
        this.half_screen = {x: screen.w / 2, y: screen.h / 2}
        this.position = position
        this.images = images

        this.offset = 30
        this.rib_length = 15

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

        this.box_struct = {
            top_left: {x: this.position.x, y: this.position.y},
            top_right: {x: this.position.x + this.offset, y: this.position.y},
            bottom_right: {x: this.position.x + this.offset, y: this.position.y + this.offset},
            bottom_left: {x: this.position.x, y: this.position.y + this.offset},
        }

        this.box_colors = {
            bottom: "rgb(100,100,100)",
            left: "rgb(80,80,80)",
            top: "rgb(150,150,150)",
            right: "rgb(200,200,200)",
            face: "rgb(255,255,255)"
        }

        this.current_delta_time = 0
        this.directions = {horizontal: '', vertical: ''}
    }

    update(current_delta_time){
        this.current_delta_time = current_delta_time
        this.move()
        this.draw()
    }

    draw(){
        // SPACE CALCULATIONS //
        const angle_to_center = getAngleTo({
            x: (this.position.x + (this.offset / 2)), 
            y: (this.position.y + (this.offset / 2))
        }, this.half_screen)

        const distance_to_center = getDistanceTo({
            x: (this.position.x + (this.offset / 2)), 
            y: (this.position.y + (this.offset / 2))
        }, this.half_screen)
        // RIBS //
        const top_left_rib = {
            x: (this.box_struct.top_left.x + (distance_to_center.x < this.rib_length ? distance_to_center.x : this.rib_length) * Math.cos(angle_to_center)),
            y: (this.box_struct.top_left.y + (distance_to_center.y < this.rib_length ? distance_to_center.y : this.rib_length) * Math.sin(angle_to_center))
        }
        const top_right_rib = {
            x: (this.box_struct.top_right.x + (distance_to_center.x < this.rib_length ? distance_to_center.x : this.rib_length) * Math.cos(angle_to_center)),
            y: (this.box_struct.top_right.y + (distance_to_center.y < this.rib_length ? distance_to_center.y : this.rib_length) * Math.sin(angle_to_center))
        }
        const bottom_right_rib = {
            x: (this.box_struct.bottom_right.x + (distance_to_center.x < this.rib_length ? distance_to_center.x : this.rib_length) * Math.cos(angle_to_center)),
            y: (this.box_struct.bottom_right.y + (distance_to_center.y < this.rib_length ? distance_to_center.y : this.rib_length) * Math.sin(angle_to_center))
        }
        const bottom_left_rib = {
            x: (this.box_struct.bottom_left.x + (distance_to_center.x < this.rib_length ? distance_to_center.x : this.rib_length) * Math.cos(angle_to_center)),
            y: (this.box_struct.bottom_left.y + (distance_to_center.y < this.rib_length ? distance_to_center.y : this.rib_length) * Math.sin(angle_to_center))
        }

        switch(true){
            case this.position.y + this.offset / 2 >= this.half_screen.y && this.position.x + this.offset / 2 >= this.half_screen.x:
                this.getCulling({
                    type: 'bottom-right', 
                    top_left_rib: top_left_rib,
                    top_right_rib: top_right_rib,
                    bottom_right_rib: bottom_right_rib,
                    bottom_left_rib: bottom_left_rib
                })
            break
            case this.position.y + this.offset / 2 >= this.half_screen.y && this.position.x + this.offset / 2 < this.half_screen.x:
                this.getCulling({
                    type: 'bottom-left', 
                    top_left_rib: top_left_rib,
                    top_right_rib: top_right_rib,
                    bottom_right_rib: bottom_right_rib,
                    bottom_left_rib: bottom_left_rib
                })
            break
            case this.position.y + this.offset / 2 <= this.half_screen.y && this.position.x + this.offset / 2 <= this.half_screen.x:
                this.getCulling({
                    type: 'top-left', 
                    top_left_rib: top_left_rib,
                    top_right_rib: top_right_rib,
                    bottom_right_rib: bottom_right_rib,
                    bottom_left_rib: bottom_left_rib
                })
            break
            case this.position.y + this.offset / 2 < this.half_screen.y && this.position.x + this.offset / 2 > this.half_screen.x:
                this.getCulling({
                    type: 'top-right', 
                    top_left_rib: top_left_rib,
                    top_right_rib: top_right_rib,
                    bottom_right_rib: bottom_right_rib,
                    bottom_left_rib: bottom_left_rib
                })
            break
        }
        // FILL TOP BOX//
        this.ctx.save()
        this.ctx.fillStyle = this.box_colors.face
        this.ctx.fillRect(
            this.position.x,
            this.position.y,
            this.offset,
            this.offset
        )
        this.ctx.restore()
        // STROKE TOP BOX //
        this.ctx.save()
        this.ctx.beginPath()
        this.ctx.lineWidth = 1
        this.ctx.strokeStyle = "black"
        this.ctx.strokeRect(
            this.position.x,
            this.position.y,
            this.offset,
            this.offset
        )
        this.ctx.stroke()
        this.ctx.restore()
        // GLOW //
        this.ctx.drawImage(
            this.images.purple_glow,
            this.position.x - this.offset,
            this.position.y - this.offset
        )
    }

    getCulling({type, top_left_rib, top_right_rib, bottom_right_rib, bottom_left_rib}){
        switch(type){
            case "bottom-right":
                // LEFT SIDE //
                this.ctx.save()
                this.ctx.beginPath()
                this.ctx.fillStyle = this.box_colors.left
                this.ctx.lineTo(this.box_struct.bottom_left.x, this.box_struct.bottom_left.y)
                this.ctx.lineTo(bottom_left_rib.x, bottom_left_rib.y)
                this.ctx.lineTo(top_left_rib.x, top_left_rib.y)
                this.ctx.lineTo(this.box_struct.top_left.x, this.box_struct.top_left.y)
                this.ctx.closePath()
                this.ctx.fill()
                this.ctx.restore()
                // TOP SIDE //
                this.ctx.save()
                this.ctx.beginPath()
                this.ctx.fillStyle = this.box_colors.top
                this.ctx.moveTo(this.box_struct.top_left.x, this.box_struct.top_left.y)
                this.ctx.lineTo(top_left_rib.x, top_left_rib.y)
                this.ctx.lineTo(top_right_rib.x, top_right_rib.y)
                this.ctx.lineTo(this.box_struct.top_right.x, this.box_struct.top_right.y)
                this.ctx.closePath()
                this.ctx.fill()
                this.ctx.restore()
            break
            case "bottom-left":
                // RIGHT SIDE //
                this.ctx.save()
                this.ctx.beginPath()
                this.ctx.fillStyle = this.box_colors.right
                this.ctx.moveTo(this.box_struct.top_right.x, this.box_struct.top_right.y)
                this.ctx.lineTo(top_right_rib.x, top_right_rib.y)
                this.ctx.lineTo(bottom_right_rib.x, bottom_right_rib.y)
                this.ctx.lineTo(this.box_struct.bottom_right.x, this.box_struct.bottom_right.y)
                this.ctx.closePath()
                this.ctx.fill()
                this.ctx.restore()
                // TOP SIDE //
                this.ctx.save()
                this.ctx.beginPath()
                this.ctx.fillStyle = this.box_colors.top
                this.ctx.moveTo(this.box_struct.top_left.x, this.box_struct.top_left.y)
                this.ctx.lineTo(top_left_rib.x, top_left_rib.y)
                this.ctx.lineTo(top_right_rib.x, top_right_rib.y)
                this.ctx.lineTo(this.box_struct.top_right.x, this.box_struct.top_right.y)
                this.ctx.closePath()
                this.ctx.fill()
                this.ctx.restore()
            break
            case "top-left":
                // BOTTOM SIDE //
                this.ctx.save()
                this.ctx.beginPath()
                this.ctx.fillStyle = this.box_colors.bottom
                this.ctx.moveTo(this.box_struct.bottom_right.x, this.box_struct.bottom_right.y)
                this.ctx.lineTo(bottom_right_rib.x, bottom_right_rib.y)
                this.ctx.lineTo(bottom_left_rib.x, bottom_left_rib.y)
                this.ctx.lineTo(this.box_struct.bottom_left.x, this.box_struct.bottom_left.y)
                this.ctx.closePath()
                this.ctx.fill()
                this.ctx.restore()
                // RIGHT SIDE //
                this.ctx.save()
                this.ctx.beginPath()
                this.ctx.fillStyle = this.box_colors.right
                this.ctx.moveTo(this.box_struct.top_right.x, this.box_struct.top_right.y)
                this.ctx.lineTo(top_right_rib.x, top_right_rib.y)
                this.ctx.lineTo(bottom_right_rib.x, bottom_right_rib.y)
                this.ctx.lineTo(this.box_struct.bottom_right.x, this.box_struct.bottom_right.y)
                this.ctx.closePath()
                this.ctx.fill()
                this.ctx.restore()
            break
            case "top-right":
                // BOTTOM SIDE //
                this.ctx.save()
                this.ctx.beginPath()
                this.ctx.fillStyle = this.box_colors.bottom
                this.ctx.moveTo(this.box_struct.bottom_right.x, this.box_struct.bottom_right.y)
                this.ctx.lineTo(bottom_right_rib.x, bottom_right_rib.y)
                this.ctx.lineTo(bottom_left_rib.x, bottom_left_rib.y)
                this.ctx.lineTo(this.box_struct.bottom_left.x, this.box_struct.bottom_left.y)
                this.ctx.closePath()
                this.ctx.fill()
                this.ctx.restore()
                // LEFT SIDE //
                this.ctx.save()
                this.ctx.beginPath()
                this.ctx.fillStyle = this.box_colors.left
                this.ctx.lineTo(this.box_struct.bottom_left.x, this.box_struct.bottom_left.y)
                this.ctx.lineTo(bottom_left_rib.x, bottom_left_rib.y)
                this.ctx.lineTo(top_left_rib.x, top_left_rib.y)
                this.ctx.lineTo(this.box_struct.top_left.x, this.box_struct.top_left.y)
                this.ctx.closePath()
                this.ctx.fill()
                this.ctx.restore()
            break
        }
    }

    handleColliding(cube){
        if (getDistance(cube.position, this.position) <= this.collide_distance){
            switch(true){
                case cube.velocity.horizontal > 0:
                    cube.velocity.horizontal = -cube.velocity.horizontal - this.bounce_offset
                    this.velocity.horizontal -= cube.velocity.horizontal / this.mass
                break
                case cube.velocity.horizontal < 0:
                    cube.velocity.horizontal = Math.abs(cube.velocity.horizontal) + this.bounce_offset
                    this.velocity.horizontal -= cube.velocity.horizontal / this.mass
                break
            }
            switch(true){
                case cube.velocity.vertical > 0:
                    cube.velocity.vertical = -cube.velocity.vertical - this.bounce_offset
                    this.velocity.vertical -= cube.velocity.vertical / this.mass
                break
                case cube.velocity.vertical < 0:
                    cube.velocity.vertical = Math.abs(cube.velocity.vertical) + this.bounce_offset
                    this.velocity.vertical -= cube.velocity.vertical / this.mass
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

        this.box_struct = {
            top_left: {x: this.position.x, y: this.position.y},
            top_right: {x: this.position.x + this.offset, y: this.position.y},
            bottom_right: {x: this.position.x + this.offset , y: this.position.y + this.offset},
            bottom_left: {x: this.position.x, y: this.position.y + this.offset},
        }

        this.directions.horizontal = ''
        this.directions.vertical = ''
        this.velocity.horizontal_max = this.velocity.horizontal_max_default
        this.velocity.vertical_max = this.velocity.vertical_max_default

    }
}