import { isStandalone } from "./src/misc_functions.js"

if ('serviceWorker' in navigator && 'PushManager' in window) {
    const ask_mobile = document.getElementById("askMobile")

    if (!isStandalone()){
      ask_mobile.style.display = "block"
    } else {
      ask_mobile.style.display = "none"
    }
  
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
      document.getElementById('installButton').style.display = 'block'
    });

    window.addEventListener('appinstalled', event => {
        installButton.style.display = 'none'
    })
  
    document.getElementById('installButton').addEventListener('click', () => {
      if (deferredPrompt) {
        deferredPrompt.prompt()
        
        deferredPrompt.userChoice.then(choiceResult => {
          if (choiceResult.outcome === 'accepted') {
            console.log('L\'utilisateur a accepté l\'installation.')
            installButton.style.display = 'none'
          } else {
            console.log('L\'utilisateur a refusé l\'installation.')
          }
          deferredPrompt = null
        })
      }
    })
}