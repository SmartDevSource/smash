const get3dDistance = (vector1, vector2) =>{
    const vx = vector1.x - vector2.x
    const vy = vector1.y - vector2.y
    const vz = vector1.z - vector2.z
    return vx * vx + vy * vy + vz * vz
}

const getOppositeFlag = color=> {
    switch(color){
        case "blue_flag": return "red_flag"
        case "red_flag": return "blue_flag"
    }
}

module.exports = { get3dDistance, getOppositeFlag }