import { Cube } from "./cube.js"

export class TestEngine{
    constructor(ctx, screen){
        this.ctx = ctx
        this.screen = screen
        this.position = {x: 100, y: 100}

        this.main_cube = new Cube(this.ctx, this.screen, this.position)
        this.cubes = [
            new Cube(this.ctx, this.screen, {x: 200, y: 300}),
            // new Cube(this.ctx, this.screen, {x: 500, y: 500})
        ]

        this.last_delta_time = Date.now()
        this.current_delta_time = 0
    }

    update(keys, device_motion){
        this.height_screen_compensation = this.base_compensation * Math.abs(window.innerHeight - window.innerWidth) / this.screen.h
        this.current_delta_time = (Date.now() - this.last_delta_time)
        this.last_delta_time = Date.now()
        this.events(keys)
        this.main_cube.update(this.current_delta_time)
        this.draw()
    }
    
    events(keys){
        // HORIZONTAL //
        if (keys.left.isPressed){
            this.main_cube.directions.horizontal = 'l'
        } else if (keys.right.isPressed){
            this.main_cube.directions.horizontal = 'r'
        }
        // VERTICAL //
        if (keys.up.isPressed){
            this.main_cube.directions.vertical = 'u'
        } else if (keys.down.isPressed){
            this.main_cube.directions.vertical = 'd'
        }
    }

    draw(){
        // CUBES //
        for (const cube of this.cubes){
            cube.update(this.current_delta_time)
            cube.handleColliding(this.main_cube)
        }
        // CENTER GREEN POINT //
        // this.ctx.save()
        // this.ctx.beginPath()
        // this.ctx.fillStyle = "lime"
        // this.ctx.arc(
        //     this.screen.w / 2,
        //     this.screen.h / 2,
        //     10,
        //     0,
        //     2 * Math.PI
        // )
        // this.ctx.fill()
        // this.ctx.stroke()
        // this.ctx.restore()
    }
}