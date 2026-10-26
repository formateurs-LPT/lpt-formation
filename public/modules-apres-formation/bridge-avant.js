// Chargé AVANT le script du module, quand il est ouvert depuis /mes-modules.
// Remet dans le stockage local du module l'état du collaborateur connecté
// (formats déjà faits, module acquis) tel qu'il est enregistré en base : un
// même téléphone peut ainsi servir à plusieurs collaborateurs sans mélanger
// leurs progressions.
(function () {
  var CLES = {
    'proximite': ['proximite_entrainement_formats', 'proximite_test_acquis'],
    'clariteens': ['clariteens_entrainement_formats', 'clariteens_test_acquis'],
    'zenprotect': ['zenprotect_entrainement_formats', 'zenprotect_test_acquis'],
    'traitements': ['traitements_entrainement_formats', 'traitements_test_acquis'],
    'progressif': ['progressif_convaincre_entrainement_formats', 'progressif_convaincre_test_acquis'],
    'troisieme-paire': ['troisieme_paire_entrainement_formats', 'troisieme_paire_test_acquis'],
    'transposition': ['transposition_entrainement_formats', 'transposition_test_acquis'],
    'granit': ['granit_entrainement_formats', 'granit_test_acquis'],
  }
  var params = new URLSearchParams(location.search)
  var cles = CLES[params.get('m')]
  if (!cles) return
  var faits = {}
  ;(params.get('faits') || '').split(',').forEach(function (f) {
    if (/^[abcd]$/.test(f)) faits[f] = true
  })
  try {
    localStorage.setItem(cles[0], JSON.stringify(faits))
    if (params.get('acquis') === '1') localStorage.setItem(cles[1], '1')
    else localStorage.removeItem(cles[1])
  } catch (e) {}
})()
