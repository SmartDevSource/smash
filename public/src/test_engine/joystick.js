import { getAngleTo, getPythagoreanDistance } from "../misc_functions.js"

export class Joystick{
    constructor(ctx, screen, is_mobile){
        this.ctx = ctx
        this.screen = screen
        this.is_mobile = is_mobile

        this.position = {
            x: 120,
            y: this.screen.h - 120
        }

        this.initial_position = {...this.position}

        this.max_joystick_distance = 50

        this.mouse = {
            is_down: false,
            is_pressed: false,
            coords: {x: 0, y: 0}
        }

        this.joystick_radius = 30
        this.backcircle_radius = 100
        this.initListeners()
    }

    initListeners(){
        switch(this.is_mobile){
            case true:
                ontouchstart = e =>  this.getMouseCoords("touch_start", e)
                ontouchend = e =>  this.getMouseCoords("touch_end", e)
                ontouchmove = e => this.getMouseCoords("touch_move", e)
            break
            case false:
                onmousedown = e => this.getMouseCoords("mouse_down", e)
                onmousemove= e => this.getMouseCoords("mouse_move", e)
                onmouseup = e => this.getMouseCoords("mouse_up", e)
            break
        }
    }

    getMouseCoords(type, mouse_event){
        switch(type){
            case "mouse_move":
                if (this.mouse.is_down){
                    const coords_mouse = {
                        x: mouse_event.clientX * this.ctx.canvas.width / this.ctx.canvas.offsetWidth,
                        y: mouse_event.clientY * this.ctx.canvas.height / this.ctx.canvas.offsetHeight
                    }
                    this.mouse.coords = coords_mouse
                }
            break
            case "mouse_down":
                this.mouse.is_down = true
                this.mouse.is_pressed = true
                const coords_mouse = {
                    x: mouse_event.clientX * this.ctx.canvas.width / this.ctx.canvas.offsetWidth,
                    y: mouse_event.clientY * this.ctx.canvas.height / this.ctx.canvas.offsetHeight
                }
                this.mouse.coords = coords_mouse
            break
            case "mouse_up":
                this.mouse.is_down = false
            break
            case "touch_move":
                if (this.mouse.is_down){
                    const touch = mouse_event.touches[0]
                    const coords_touch = {
                        x: touch.clientX * this.ctx.canvas.width / this.ctx.canvas.offsetWidth,
                        y: touch.clientY * this.ctx.canvas.height / this.ctx.canvas.offsetHeight
                    }
                    this.mouse.coords = coords_touch
                }
            break
            case "touch_start":
                this.mouse.is_down = true
                this.mouse.is_pressed = true
                const touch = mouse_event.touches[0]
                const coords_touch = {
                    x: touch.clientX * this.ctx.canvas.width / this.ctx.canvas.offsetWidth,
                    y: touch.clientY * this.ctx.canvas.height / this.ctx.canvas.offsetHeight
                }
                this.mouse.coords = coords_touch
            break
            case "touch_end":
                this.mouse.is_down = false
            break
        }
    }

    update(){
        this.handleMouse()
        this.draw()
        this.mouse.is_pressed = false
    }

    handleMouse(){
        if (this.mouse.is_down){
            const angle_to_center = getAngleTo(this.mouse.coords, this.initial_position)
            const distance_to_center = getPythagoreanDistance(this.mouse.coords, this.initial_position)
            console.log("mouse_coords", this.mouse.coords)
            console.log("angle_to_center", angle_to_center)
            console.log("distance_to_center", distance_to_center)
            console.log()
        }
    }

    draw(){
        this.ctx.save()
        this.ctx.beginPath()
        this.ctx.globalAlpha = .3
        this.ctx.strokeStyle = "grey"
        this.ctx.lineWidth = 6
        this.ctx.fillStyle = "white"
        this.ctx.arc(
            this.position.x, 
            this.position.y,
            this.backcircle_radius,
            0, 
            Math.PI * 2)
        this.ctx.fill()
        this.ctx.stroke()
        this.ctx.closePath()
        this.ctx.restore()

        this.ctx.save()
        this.ctx.beginPath()
        this.ctx.strokeStyle = "grey"
        this.ctx.lineWidth = 6
        this.ctx.fillStyle = "white"
        this.ctx.arc(
            this.position.x, 
            this.position.y, 
            this.joystick_radius,
            0, 
            Math.PI * 2)
        this.ctx.stroke()
        this.ctx.fill()
        this.ctx.closePath()
        this.ctx.restore()
    }

}