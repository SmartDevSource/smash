import { Cube } from "./cube.js"
import { Joystick } from "./joystick.js"

export class GameEngine{
    constructor(ctx, screen, is_mobile){
        this.ctx = ctx
        this.screen = screen
        this.position = {x: 100, y: 100}
        this.joystick = new Joystick(this.ctx, this.screen, is_mobile)
        this.force_divider = 20

        this.main_cube = new Cube(this.ctx, this.screen, this.position)
        this.cubes = [
            new Cube(this.ctx, this.screen, {x: 200, y: 300}),
            new Cube(this.ctx, this.screen, {x: 500, y: 500}),
            new Cube(this.ctx, this.screen, {x: 300, y: 100}),
            new Cube(this.ctx, this.screen, {x: 900, y: 400}),
        ]

        this.last_delta_time = Date.now()
        this.current_delta_time = 0
    }

    update(keys){
        this.height_screen_compensation = this.base_compensation * Math.abs(window.innerHeight - window.innerWidth) / this.screen.h
        this.current_delta_time = (Date.now() - this.last_delta_time)
        this.last_delta_time = Date.now()
        this.events(keys)
        this.main_cube.update(this.current_delta_time)
        this.draw()
        this.joystick.update()
    }
    
    events(keys){
        if (this.joystick.params.is_picked){
            const horizontal_force = (this.joystick.position.x - this.joystick.initial_position.x) / this.force_divider
            const vertical_force = (this.joystick.position.y - this.joystick.initial_position.y) / this.force_divider

            const abs_horizontal = Math.abs(horizontal_force)
            const abs_vertical = Math.abs(vertical_force)

            this.main_cube.velocity.horizontal_max = abs_horizontal
            this.main_cube.velocity.vertical_max = abs_vertical
            
            switch(true){
                case horizontal_force < 0:
                    this.main_cube.directions.horizontal = 'l'
                break
                case horizontal_force > 0:
                    this.main_cube.directions.horizontal = 'r'
                break
            }
            switch(true){
                case vertical_force < 0:
                    this.main_cube.directions.vertical = 'u'
                break
                case vertical_force > 0:
                    this.main_cube.directions.vertical = 'd'
                break
            }
        }
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
    }
}