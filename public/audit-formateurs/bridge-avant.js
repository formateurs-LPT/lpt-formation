// Chargé AVANT le script du module, quand il est ouvert depuis l'audit
// formateur. Remet dans le stockage local du module l'état du formateur
// connecté (formats déjà faits, module acquis) tel qu'il est enregistré en
// base : un même ordinateur peut ainsi servir à plusieurs formateurs sans
// mélanger leurs résultats.
(function () {
  var CLES = {
    'entreprise': ['entreprise_entrainement_formats', 'entreprise_test_acquis'],
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
