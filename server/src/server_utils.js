const rndBetween = (min, max) => (Math.random() * max) + min

const getDistance = (v1, v2) =>{
    const vx = v1.x - v2.x
    const vy = v1.y - v2.y
    return vx * vx + vy * vy
}

const getAngleTo = (v1, v2) => {
    return Math.atan2(v1.y - v2.y, v1.x - v2.x) + Math.PI
}

const getPythagoreanDistance = (v1, v2) => {
    return Math.sqrt(Math.pow(v2.x - v1.x,2) + Math.pow(v2.y - v1.y, 2))
}

const getDistanceToLine = ({first_point, second_point, vector}) => {
    const x_min = Math.min(first_point.x, second_point.x)
    const x_max = Math.max(first_point.x, second_point.x)
    const y_min = Math.min(first_point.y, second_point.y)
    const y_max = Math.max(first_point.y, second_point.y)

    let distance = null,
        points = {}

    if (vector.x >= x_min && vector.x <= x_max){
        const scale = ((vector.x - x_min) / (x_max - x_min))
        const diff_y = second_point.y > first_point.y ? 0 : (y_max - y_min)
        const y_prop = y_min + scale * (second_point.y - first_point.y) + diff_y
        points = {x: vector.x, y: y_prop}
        distance = getDistance(
            {x: vector.x, y: (vector.y)}, 
            points
        )
    } else if (x_min == x_max && vector.y >= y_min && vector.y <= y_max){
        points = {x: x_min, y: vector.y}
        distance = getDistance(
            {x: vector.x, y: (vector.y)},
            points
        )
    }

    return {distance: distance, points: points}
}

module.exports = { rndBetween, getDistance, getPythagoreanDistance, 
                   getDistanceToLine, getAngleTo }