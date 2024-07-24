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

const reverseColor = element => {
    if (!element.classList.contains("reverse_color")){
        element.classList.add("reverse_color")
        setTimeout(() => {
            element.classList.remove("reverse_color")
        }, 300)
    }
}

const getMyIp = async () => {
  return await fetch('https://api.ipify.org?format=json')
    .then(res => res.json())
    .then(data => data.ip)
}