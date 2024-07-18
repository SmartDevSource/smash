const restrictInput = event =>{
    if (!/[0-9a-zA-Z]/i.test(event.key)) event.preventDefault()
}

const wobble = element => {
    if (!element.classList.contains("single_wobble")){
        element.classList.add("single_wobble")
        setTimeout(() => {
            element.classList.remove("single_wobble")
        }, 600)
    }
}