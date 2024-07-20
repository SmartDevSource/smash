const rndBetween = (min, max) => (Math.random() * max) + min

const getDistance = (v1, v2) =>{
    const vx = v1.x - v2.x
    const vy = v1.y - v2.y
    return vx * vx + vy * vy
}

module.exports = { rndBetween, getDistance }