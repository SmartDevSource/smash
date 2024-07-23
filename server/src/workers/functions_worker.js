const { parentPort } = require('worker_threads')
const { getDistanceToLine } = require('../server_misc_functions.js')

parentPort.on('message', data => {
    switch(data.header){
        case "lines_colliders":
            const intersect = handleLinesColliders(
                data.lines_colliders, 
                data.position, 
                data.offset,
                data.line_distance_collider
            )
            parentPort.postMessage({
                header: "lines_colliders", 
                intersect: intersect
            })
        break
    }
})

const handleLinesColliders = (lines_colliders, position, offset, line_distance_collider) => {
    let intersect = false
    for (const line of lines_colliders){
        const line_coords = getDistanceToLine({
            first_point: line.points.a,
            second_point: line.points.b,
            vector: {
                x: position.x + (offset / 2),
                y: position.y + (offset / 2),
            }
        })
        if (line_coords.distance && line_coords.distance < line_distance_collider){
            intersect = true
        }
    }
    return intersect
}