const restrictInput = event =>{
    if (!/[0-9a-zA-Z]/i.test(event.key)) event.preventDefault()
}

const wobble = element => {
    if (!element.classList.contains("wobble")){
        element.classList.add("wobble")
        setTimeout(() => {
            element.classList.remove("wobble")
        }, 600)
    }
}