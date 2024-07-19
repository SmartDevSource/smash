const { getOppositeFlag } = require('./server_misc_functions.js')

class Player{
    constructor(id, username, position){
        this.id = id
        this.username = username
        this.position = position
    }
}

module.exports = Player