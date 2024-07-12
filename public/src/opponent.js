export class Opponent{
    constructor(data){
        this.z_offset = 45
        this.username = data.username
        this.position = data.position
        this.position.z += this.z_offset
        this.angle = data.angle
        this.is_dead = false
        this.boost_damage = false
    }
    updateCoords(coords){
        this.position = coords.position
        this.position.z += this.z_offset
        this.angle = coords.angle
    }
}