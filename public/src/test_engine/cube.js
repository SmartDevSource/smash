import { getAngleTo, getDistance, getDistanceTo } from "../misc_functions.js"

export class Cube{
    constructor(ctx, screen, position){
        this.ctx = ctx
        this.screen = screen
        this.half_screen = {x: screen.w / 2, y: screen.h / 2}
        this.position = position

        this.offset = 20
        this.base_compensation = 15
        this.height_screen_compensation = 0
        this.rib_length = 30
        this.line_width = 2
        this.line_color = "white"
        this.plane_width = 2
        this.plane_color = "lime"

        this.collide_distance = 1100
        this.bounce_offset = .15
        this.mass = 1

        this.velocity = {
            vertical: 0,
            horizontal: 0,
            max: 5,
            step: .006
        }

        this.box_struct = {
            top_left: {x: this.position.x, y: this.position.y},
            top_right: {x: this.position.x + this.offset, y: this.position.y},
            bottom_right: {x: this.position.x + this.offset, y: this.position.y + this.offset},
            bottom_left: {x: this.position.x, y: this.position.y + this.offset},
        }

        this.current_delta_time = 0
        this.directions = {horizontal: '', vertical: ''}
    }

    update(current_delta_time){
        this.current_delta_time = current_delta_time
        this.height_screen_compensation = this.base_compensation * Math.abs(window.innerHeight - window.innerWidth) / this.screen.h
        this.move()
        this.draw()
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
           y: (this.box_struct.top_left.y + (distance_to_center.x < this.rib_length ? distance_to_center.y : this.rib_length) * Math.sin(angle_to_center))
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

       this.ctx.save()
       this.ctx.beginPath()
       this.ctx.strokeStyle = this.line_color
       this.ctx.lineWidth = this.line_width
       // TOP LEFT RIB //
       this.ctx.moveTo(this.box_struct.top_left.x, this.box_struct.top_left.y)
       this.ctx.lineTo(top_left_rib.x, top_left_rib.y)
       // TOP RIGHT RIB //
       this.ctx.moveTo(this.box_struct.top_right.x, this.box_struct.top_right.y)
       this.ctx.lineTo(top_right_rib.x, top_right_rib.y)
       // BOTTOM RIGHT RIB //
       this.ctx.moveTo(this.box_struct.bottom_right.x, this.box_struct.bottom_right.y)
       this.ctx.lineTo(bottom_right_rib.x, bottom_right_rib.y)
       // BOTTOM LEFT RIB //
       this.ctx.moveTo(this.box_struct.bottom_left.x, this.box_struct.bottom_left.y)
       this.ctx.lineTo(bottom_left_rib.x, bottom_left_rib.y)

       ////////////////////// RIBS JOINTS //////////////////////
       // TOP LEFT => RIGHT //
       this.ctx.moveTo(top_left_rib.x, top_left_rib.y)
       this.ctx.lineTo(top_right_rib.x, top_right_rib.y)
       // // TOP RIGHT TO BOTTOM RIGHT //
       this.ctx.moveTo(top_right_rib.x, top_right_rib.y)
       this.ctx.lineTo(bottom_right_rib.x, bottom_right_rib.y)
       // // BOTTOM RIGHT TO BOTTOM LEFT//
       this.ctx.moveTo(bottom_right_rib.x, bottom_right_rib.y)
       this.ctx.lineTo(bottom_left_rib.x, bottom_left_rib.y)
       // // BOTTOM LEFT TO TOP LEFT//
       this.ctx.moveTo(bottom_left_rib.x, bottom_left_rib.y)
       this.ctx.lineTo(top_left_rib.x, top_left_rib.y)
   
       this.ctx.stroke()
       this.ctx.restore()

       // FILL BOX//
    //    this.ctx.save()
    //    this.ctx.fillStyle = "white"
    //    this.ctx.fillRect(
    //        this.position.x,
    //        this.position.y,
    //        this.offset,
    //        this.offset + this.height_screen_compensation
    //    )
    //    this.ctx.restore()
       // STROKE BOX //
       this.ctx.save()
       this.ctx.beginPath()
       this.ctx.lineWidth = this.line_width
       this.ctx.strokeStyle = "white"
       this.ctx.strokeRect(
           this.position.x,
           this.position.y,
           this.offset,
           this.offset + this.height_screen_compensation
       )
       this.ctx.stroke()
       this.ctx.restore()
    }

    move(){
        switch(this.directions.horizontal){
            case 'l':
                if (this.velocity.horizontal > -this.velocity.max)
                    this.velocity.horizontal -= this.velocity.step * this.current_delta_time
                if (this.velocity.horizontal < -this.velocity.max)
                    this.velocity.horizontal = -this.velocity.max
            break
            case 'r':
                if (this.velocity.horizontal < this.velocity.max)
                    this.velocity.horizontal += this.velocity.step * this.current_delta_time
                if (this.velocity.horizontal > this.velocity.max)
                    this.velocity.horizontal = this.velocity.max
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
                if (this.velocity.vertical > -this.velocity.max)
                    this.velocity.vertical -= this.velocity.step * this.current_delta_time
                if (this.velocity.vertical < -this.velocity.max)
                    this.velocity.vertical = -this.velocity.max
            break
            case 'd':
                if (this.velocity.vertical < this.velocity.max)
                    this.velocity.vertical += this.velocity.step * this.current_delta_time
                if (this.velocity.vertical > this.velocity.max)
                    this.velocity.vertical = this.velocity.max
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
            bottom_right: {x: this.position.x + this.offset , y: this.position.y + this.offset + this.height_screen_compensation},
            bottom_left: {x: this.position.x, y: this.position.y + this.offset + this.height_screen_compensation},
        }

        this.directions.horizontal = ''
        this.directions.vertical = ''
    }
}