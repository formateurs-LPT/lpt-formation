// Chargé APRÈS le script du module, quand il est ouvert depuis /mes-modules.
// Masque le bouton « Prompt pour Paul » (réservé aux formateurs) et prévient
// la page parente quand un format d'entraînement est terminé pour la 1re fois
// ou qu'un test est passé, pour qu'elle l'enregistre en base.
(function () {
  var params = new URLSearchParams(location.search)
  var moduleId = params.get('m')
  if (!moduleId || window.parent === window) return

  function envoyer(message) {
    message.source = 'lpt-module'
    message.module = moduleId
    window.parent.postMessage(message, location.origin)
  }

  var btnPrompt = document.getElementById('btnPromptPaul')
  if (btnPrompt) btnPrompt.style.display = 'none'

  // Safari iOS n'applique :active (retour visuel au toucher) que si la page
  // écoute les touchers.
  document.addEventListener('touchstart', function () {}, { passive: true })

  if (typeof marquerFormatFait === 'function' && typeof getFormatsFaits === 'function') {
    var marquerOrigine = marquerFormatFait
    marquerFormatFait = function (cle) {
      var dejaFait = !!getFormatsFaits()[cle]
      marquerOrigine(cle)
      if (!dejaFait) envoyer({ type: 'format', format: cle })
    }
  }

  if (typeof afficherResultat === 'function') {
    var resultatOrigine = afficherResultat
    afficherResultat = function () {
      resultatOrigine()
      var score = reponsesDonnees.filter(function (r) { return r.correct }).length
      envoyer({
        type: 'test',
        score: score,
        total: TOTAL_QUESTIONS,
        details: reponsesDonnees.map(function (r) { return { libelle: r.libelle, correct: !!r.correct } }),
      })
    }
  }
})()
