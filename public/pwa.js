import { isStandalone } from "./src/client_utils.js"

if ('serviceWorker' in navigator && 'PushManager' in window) {
    const ask_mobile = document.getElementById("askMobile")

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(registration => {
          console.log('Service Worker enregistré avec succès.', registration)
        })
        .catch(error => {
          console.error(`Erreur lors de l'enregistrement du Service Worker :`, error)
        })
    })
  
    let deferredPrompt

    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault()
      deferredPrompt = event
      document.getElementById('button_install').style.display = 'block'
    });

    window.addEventListener('appinstalled', event => {
      button_install.style.display = 'none'
    })
  
    document.getElementById('button_install').addEventListener('click', () => {
      if (deferredPrompt) {
        deferredPrompt.prompt()
        
        deferredPrompt.userChoice.then(choiceResult => {
          if (choiceResult.outcome === 'accepted') {
            console.log('L\'utilisateur a accepté l\'installation.')
            button_install.style.display = 'none'
          } else {
            console.log('L\'utilisateur a refusé l\'installation.')
          }
          deferredPrompt = null
        })
      }
    })
}