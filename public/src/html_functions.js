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

const signOut = () => {
  fetch('/signout', { method:'POST' })
    .then(res => res.json())
    .then(data => {
    //   signin_page.style.display = "flex"
    //   logged_page.style.display = "none"
      console.log(data)
    })
}

// window.onload = function() {
//   fetch('/session_status', { method: 'GET'})
//     .then(res => res.json())
//     .then(data => {
//       console.log(data)
//     //   if (data.is_logged){
//     //     logged_page.style.display = "flex"
//     //   } else {
//     //     signin_page.style.display = "flex"
//     //   }
//     })
// }

const getMyIp = async () => {
  return await fetch('https://api.ipify.org?format=json')
    .then(res => res.json())
    .then(data => data.ip)
}