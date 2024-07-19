import { Ship } from "./ship.js"
import { Joystick } from "./joystick.js"

export class GameEngine{
    constructor(ctx, screen, is_mobile, init_data, images, audios){
        this.ctx = ctx
        this.screen = screen
        this.images = images
        this.audios = audios
        this.position = {x: 100, y: 100}
        this.angle = 0
        this.force_divider = 20

        this.joystick = new Joystick(this.ctx, this.screen, is_mobile)

        this.id = init_data.id
        this.username = init_data.username
        this.map_data = init_data.map_data
        this.background_image = this.images[init_data.map_data.name]

        this.main_ship = new Ship(this.ctx, this.screen, this.position, this.images)
        this.ships = [
            new Ship(this.ctx, this.screen, {x: 200, y: 300}, this.images),
            new Ship(this.ctx, this.screen, {x: 500, y: 500}, this.images),
            new Ship(this.ctx, this.screen, {x: 300, y: 100}, this.images),
            new Ship(this.ctx, this.screen, {x: 900, y: 400}, this.images),
        ]

        this.last_delta_time = Date.now()
        this.current_delta_time = 0
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

            const abs_horizontal = Math.abs(horizontal_force)
            const abs_vertical = Math.abs(vertical_force)

            this.main_ship.velocity.horizontal_max = abs_horizontal
            this.main_ship.velocity.vertical_max = abs_vertical
            
            switch(true){
                case horizontal_force < 0:
                    this.main_ship.directions.horizontal = 'l'
                break
                case horizontal_force > 0:
                    this.main_ship.directions.horizontal = 'r'
                break
            }
            switch(true){
                case vertical_force < 0:
                    this.main_ship.directions.vertical = 'u'
                break
                case vertical_force > 0:
                    this.main_ship.directions.vertical = 'd'
                break
            }
        }
        // HORIZONTAL //
        if (keys.left.isPressed){
            this.main_ship.directions.horizontal = 'l'
        } else if (keys.right.isPressed){
            this.main_ship.directions.horizontal = 'r'
        }
        // VERTICAL //
        if (keys.up.isPressed){
            this.main_ship.directions.vertical = 'u'
        } else if (keys.down.isPressed){
            this.main_ship.directions.vertical = 'd'
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
        for (const ship of this.ships){
            ship.update(this.current_delta_time)
            ship.handleColliding(this.main_ship)
        }
    }
}