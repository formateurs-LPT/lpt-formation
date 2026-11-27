// Atelier tunnel SAV — éditeur de cartes (de haut en bas), maquette réelle
// dans le téléphone, synchro carte ⇄ maquette, travail à deux en direct.
// Code issu de l'atelier prototypé dans un artefact claude.ai ; ici il
// tourne dans l'app formation avec les adaptateurs de src/lib/tunnelSavApi.js.
/* eslint-disable */

export const STYLES = ".tsav {\n  color-scheme: light;\n  --fond: #f4f6fb;\n  --papier: #ffffff;\n  --encre: #10132a;\n  --doux: #5d6480;\n  --pale: #9aa1b9;\n  --trait: #e3e7f1;\n  --trait-fort: #cfd5e4;\n  --bleu: #1a3dd1;\n  --cyan: #0a7c94;\n  --violet: #5b3fd6;\n  --rouge: #c4391d;\n  --vert: #12855a;\n  --ambre: #b86a00;\n  --f: \"Manrope\", system-ui, -apple-system, \"Segoe UI\", sans-serif;\n  --mono: \"JetBrains Mono\", ui-monospace, \"SF Mono\", Menlo, monospace;\n}\n\n.tsav { background: var(--fond); color: var(--encre); font: 500 14px/1.45 var(--f); -webkit-font-smoothing: antialiased; }\n.tsav button, .tsav input, .tsav select, .tsav textarea { font: inherit; color: inherit; }\n.tsav button:focus-visible, .tsav input:focus-visible, .tsav select:focus-visible, .tsav textarea:focus-visible { outline: 2px solid var(--bleu); outline-offset: 2px; }\n.tsav .app { height: 100%; display: flex; flex-direction: column; }\n.tsav .tete { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; padding-block: 12px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); background: var(--papier); border-bottom: 1px solid var(--trait); }\n.tsav .marque { display: flex; flex-direction: column; margin-right: 6px; }\n.tsav .marque b { font-size: 17px; font-weight: 800; letter-spacing: -.01em; }\n.tsav .marque span { font-size: 12px; color: var(--doux); }\n.tsav .tete select { max-width: 260px; }\n.tsav .tete select, .tsav .tete input { height: 36px; border-radius: 10px; border: 1px solid var(--trait-fort); background: var(--papier); padding: 0 10px; font-weight: 600; }\n.tsav .tete input { width: 200px; max-width: 100%; }\n.tsav .btn { height: 36px; border-radius: 10px; border: 1px solid var(--trait-fort); background: var(--papier); padding: 0 13px; font-weight: 700; font-size: 13px; cursor: pointer; white-space: nowrap; }\n.tsav .btn:hover { border-color: var(--pale); }\n.tsav .btn.plein { background: var(--bleu); border-color: var(--bleu); color: #fff; }\n.tsav .btn.danger { color: var(--rouge); }\n.tsav .btn.confirme { background: var(--rouge); border-color: var(--rouge); color: #fff; }\n.tsav .espace { flex: 1; }\n.tsav .presents { display: flex; align-items: center; gap: 6px; }\n.tsav .presents .lib { font-size: 12px; color: var(--doux); margin-right: 2px; }\n.tsav .pastille { height: 28px; min-width: 28px; padding: 0 9px; border-radius: 99px; display: inline-flex; align-items: center; font-size: 12px; font-weight: 800; color: #fff; background: var(--c); }\n.tsav .etat { font-size: 12px; color: var(--doux); }\n.tsav .etat.alerte { color: var(--rouge); }\n.tsav .corps { position: relative; flex: 1; min-height: 0; display: flex; }\n.tsav .plan { position: relative; flex: 1; overflow: hidden; cursor: grab; touch-action: none; background-color: var(--fond); background-image: radial-gradient(#cdd3e3 1.1px, transparent 1.1px); }\n.tsav .plan.glisse { cursor: grabbing; }\n.tsav .monde { position: absolute; left: 0; top: 0; transform-origin: 0 0; }\n.tsav .liens { position: absolute; left: 0; top: 0; overflow: visible; pointer-events: none; }\n.tsav .liens path { fill: none; stroke: #b3bbd0; stroke-width: 2; }\n.tsav .liens path.actif { stroke-width: 2.6; }\n.tsav .outils-plan { position: absolute; right: 14px; bottom: 14px; display: flex; align-items: center; gap: 4px; padding: 4px; border-radius: 12px; background: var(--papier); border: 1px solid var(--trait); box-shadow: 0 6px 18px -10px rgba(16,19,42,.35); }\n.tsav .outils-plan .btn { height: 30px; padding: 0 10px; border: 0; }\n.tsav .zoom { font: 700 12px var(--mono); color: var(--doux); min-width: 44px; text-align: center; }\n.tsav .astuce { position: absolute; left: 14px; bottom: 14px; margin: 0; font-size: 12px; color: var(--pale); pointer-events: none; }\n.tsav .compteur { position: absolute; left: 14px; top: 12px; margin: 0; padding: 5px 10px; border-radius: 99px; font-size: 12px; font-weight: 700; background: #e3f3ec; color: var(--vert); }\n.tsav .compteur.alerte { background: #fbeedb; color: var(--ambre); }\n.tsav .bandeau { position: absolute; left: 50%; top: 12px; transform: translateX(-50%); padding: 8px 14px; border-radius: 99px; background: var(--bleu); color: #fff; font-weight: 700; font-size: 13px; }\n.tsav .vide { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }\n.tsav .vide div { max-width: 340px; text-align: center; padding: 22px; border-radius: 18px; background: var(--papier); border: 1px dashed var(--trait-fort); pointer-events: auto; }\n.tsav .vide b { display: block; font-size: 16px; margin-bottom: 6px; }\n.tsav .vide p { margin: 0 0 14px; color: var(--doux); }\n.tsav .carte { position: absolute; border-radius: 14px; background: var(--papier); border: 1.5px solid var(--trait); box-shadow: 0 2px 8px rgba(16,19,42,.06); cursor: pointer; user-select: none; }\n.tsav .carte::before { content: \"\"; position: absolute; left: -1.5px; right: -1.5px; top: -1.5px; height: 5px; border-radius: 14px 14px 0 0; background: var(--c); }\n.tsav .carte.choisie { border-color: var(--c); box-shadow: 0 0 0 4px color-mix(in srgb, var(--c) 18%, transparent), 0 12px 28px -12px rgba(16,19,42,.3); }\n.tsav .carte.cible { outline: 2px dashed var(--bleu); outline-offset: 4px; cursor: copy; }\n.tsav .carte.autre { box-shadow: 0 0 0 3px var(--pc), 0 12px 28px -12px rgba(16,19,42,.3); }\n.tsav .carte .qui { position: absolute; right: 10px; top: -12px; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 800; color: #fff; background: var(--pc); }\n.tsav .ct-tete { height: 78px; padding: 13px 12px 0; box-sizing: border-box; cursor: move; }\n.tsav .ct-type { display: flex; align-items: center; gap: 6px; font: 700 10.5px var(--mono); letter-spacing: .07em; text-transform: uppercase; color: var(--c); }\n.tsav .ct-type i, .tsav .menu i, .tsav .p-tete i, .tsav .e-tete i { font-style: normal; width: 18px; height: 18px; border-radius: 6px; display: grid; place-items: center; background: color-mix(in srgb, var(--c) 14%, transparent); color: var(--c); font-size: 10.5px; }\n.tsav .ct-tete b { padding-right: 30px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 6px; font-size: 13.5px; font-weight: 700; line-height: 1.3; }\n.tsav .ct-tete b.vide-t { color: var(--pale); font-weight: 500; font-style: italic; }\n.tsav .ct-fin { height: 34px; padding: 0 12px; display: flex; align-items: center; border-top: 1px solid var(--trait); font-size: 11.5px; color: var(--doux); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.tsav .ct-sorties { height: 40px; display: flex; border-top: 1px solid var(--trait); }\n.tsav .ct-sortie { position: relative; flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center; gap: 4px; padding: 0 6px; }\n.tsav .ct-sortie + .ct-sortie { border-left: 1px solid var(--trait); }\n.tsav .ct-lib { min-width: 0; font-size: 12px; font-weight: 700; color: var(--doux); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.tsav .ct-plus { min-width: 0; border: 0; background: none; padding: 0; color: var(--bleu); font-size: 12px; font-weight: 800; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.tsav .ct-ic { flex: none; width: 20px; height: 20px; border-radius: 6px; border: 1px solid var(--trait-fort); background: var(--papier); color: var(--doux); font-size: 12px; line-height: 1; padding: 0; cursor: pointer; display: none; }\n.tsav .carte:hover .ct-ic, .tsav .carte.choisie .ct-ic { display: block; }\n@media (hover: none) {\n.tsav .carte.choisie .ct-ic { display: block; }\n }\n.tsav .port { position: absolute; left: 50%; bottom: -6px; margin-left: -5px; width: 10px; height: 10px; border-radius: 50%; background: var(--papier); border: 2px solid var(--pale); }\n.tsav .port.plein { background: var(--c); border-color: var(--c); }\n.tsav .panneau { width: 330px; flex: none; overflow: auto; background: var(--papier); border-left: 1px solid var(--trait); padding: 16px; display: grid; gap: 13px; align-content: start; }\n.tsav .p-tete { display: flex; justify-content: space-between; align-items: center; }\n.tsav .p-tete span { display: flex; align-items: center; gap: 8px; font: 700 11.5px var(--mono); letter-spacing: .07em; text-transform: uppercase; color: var(--c); }\n.tsav .aide { margin: 0; font-size: 12.5px; color: var(--doux); }\n.tsav .panneau label { display: grid; gap: 5px; font-size: 12px; font-weight: 700; color: var(--doux); }\n.tsav .panneau textarea, .tsav .panneau input:not([type]), .tsav .rep input { width: 100%; box-sizing: border-box; border-radius: 10px; border: 1px solid var(--trait-fort); background: var(--fond); padding: 8px 10px; font-size: 13.5px; font-weight: 500; color: var(--encre); resize: vertical; }\n.tsav .gr { display: grid; gap: 6px; }\n.tsav .gr > span { font-size: 12px; font-weight: 700; color: var(--doux); }\n.tsav .rep { display: flex; gap: 6px; align-items: center; }\n.tsav .x { flex: none; width: 26px; height: 26px; border-radius: 8px; border: 1px solid var(--trait-fort); background: var(--papier); color: var(--doux); cursor: pointer; font-size: 15px; line-height: 1; padding: 0; }\n.tsav .mini { height: 30px; border-radius: 9px; border: 1px solid var(--trait-fort); background: var(--papier); padding: 0 11px; font-size: 12px; font-weight: 700; cursor: pointer; justify-self: start; }\n.tsav .mini.danger { color: var(--rouge); }\n.tsav .mini.confirme { background: var(--rouge); border-color: var(--rouge); color: #fff; }\n.tsav .seg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }\n.tsav .seg button { min-height: 36px; border-radius: 9px; border: 1px solid var(--trait-fort); background: var(--papier); font-size: 11.5px; font-weight: 700; color: var(--doux); cursor: pointer; }\n.tsav .seg button[aria-pressed=\"true\"] { background: var(--rouge); border-color: var(--rouge); color: #fff; }\n.tsav .coche { display: flex !important; align-items: center; gap: 8px; font-weight: 600 !important; color: var(--encre) !important; font-size: 13px !important; }\n.tsav .p-bas { display: flex; gap: 8px; flex-wrap: wrap; padding-top: 10px; border-top: 1px solid var(--trait); }\n.tsav .menu { position: absolute; z-index: 6; width: 240px; padding: 6px; border-radius: 14px; background: var(--papier); border: 1px solid var(--trait); box-shadow: 0 20px 44px -14px rgba(16,19,42,.4); }\n.tsav .menu p { margin: 6px 8px 4px; font: 700 10.5px var(--mono); letter-spacing: .1em; text-transform: uppercase; color: var(--pale); }\n.tsav .menu button { display: flex; width: 100%; align-items: center; gap: 9px; padding: 9px 10px; border: 0; border-radius: 9px; background: none; font-size: 13.5px; font-weight: 600; text-align: left; cursor: pointer; }\n.tsav .menu button:hover { background: var(--fond); }\n.tsav .essai { position: absolute; inset: 0; z-index: 5; display: grid; place-items: center; background: rgba(16,19,42,.35); backdrop-filter: blur(4px); }\n.tsav .e-carte { width: min(400px, 92%); padding: 18px; border-radius: 22px; background: var(--fond); box-shadow: 0 30px 60px -20px rgba(16,19,42,.6); display: grid; gap: 11px; }\n.tsav .e-tete { display: flex; justify-content: space-between; align-items: center; }\n.tsav .e-tete span { display: flex; gap: 8px; align-items: center; font: 700 11px var(--mono); letter-spacing: .07em; text-transform: uppercase; color: var(--c); }\n.tsav .e-carte h4 { margin: 0; font-size: 20px; font-weight: 800; line-height: 1.25; text-wrap: balance; }\n.tsav .e-info { margin: 0; padding: 10px 12px; border-radius: 12px; background: var(--papier); font-size: 13.5px; color: var(--doux); }\n.tsav .e-rep { display: grid; gap: 8px; }\n.tsav .e-rep button { min-height: 50px; border: 0; border-radius: 16px; background: var(--papier); box-shadow: inset 0 0 0 1.5px var(--trait-fort); font-size: 15px; font-weight: 800; text-align: left; padding: 0 15px; cursor: pointer; }\n.tsav .e-rep button:first-child { background: var(--bleu); color: #fff; box-shadow: none; }\n.tsav .e-rep button:disabled { opacity: .45; cursor: not-allowed; }\n.tsav .e-fin { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; padding: 12px; border-radius: 12px; background: var(--papier); font-size: 13.5px; }\n.tsav .e-fin dt { color: var(--doux); }\n.tsav .e-fin dd { margin: 0; font-weight: 700; }\n.tsav .e-ok { margin: 0; font-weight: 800; color: var(--vert); }\n.tsav .e-bas { display: flex; gap: 8px; }\n.tsav .curseurs { position: absolute; left: 0; top: 0; pointer-events: none; }\n.tsav .curseur { position: absolute; z-index: 3; transition: left .08s linear, top .08s linear; }\n.tsav .curseur span { position: absolute; left: 16px; top: 16px; padding: 2px 8px; border-radius: 99px; background: var(--pc); color: #fff; font-size: 11.5px; font-weight: 800; white-space: nowrap; box-shadow: 0 4px 10px -4px rgba(16,19,42,.4); }\n.tsav .ct-dup { position: absolute; right: 8px; top: 12px; width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--trait-fort); background: var(--papier); color: var(--doux); font-size: 15px; line-height: 1; padding: 0; cursor: pointer; }\n.tsav .ct-dup:hover { color: var(--bleu); border-color: var(--bleu); }\n.tsav .tel-zone { flex: none; width: 300px; padding: 18px 16px; border-left: 1px solid var(--trait); background: linear-gradient(180deg, #eef1f8, #e4e8f2); display: flex; flex-direction: column; align-items: center; gap: 10px; overflow: auto; }\n.tsav .tel { width: 268px; height: 560px; flex: none; border-radius: 40px; background: #14161f; padding: 10px; box-shadow: 0 24px 50px -24px rgba(16,19,42,.6), inset 0 0 0 2px #2a2d38; }\n.tsav .tel-ecran { width: 100%; height: 100%; border-radius: 31px; overflow: hidden; background: #f6f7fb; display: flex; flex-direction: column; font-family: var(--f); color: #10132a; position: relative; }\n.tsav .tel-onglets { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; width: 268px; padding: 3px; border-radius: 12px; background: #dfe3ee; }\n.tsav .tel-onglets button { border: 0; border-radius: 9px; padding: 7px 4px; background: transparent; font-size: 11.5px; font-weight: 800; color: var(--doux); cursor: pointer; }\n.tsav .tel-onglets button[aria-selected=\"true\"] { background: var(--papier); color: var(--bleu); box-shadow: 0 1px 3px rgba(16,19,42,.12); }\n.tsav .tel-maq { position: relative; width: 268px; height: 568px; flex: none; overflow: hidden; border-radius: 40px; }\n.tsav .tel-maq iframe { position: absolute; left: 0; top: 0; width: 520px; height: 1000px; border: 0; transform-origin: 0 0; transform: scale(.7243) translate(-75px, -145px); background: transparent; }\n.tsav .tel-note { margin: 0; font-size: 11.5px; color: var(--doux); text-align: center; }\n.tsav .tl-statut { display: flex; justify-content: space-between; padding: 10px 20px 4px; font-size: 11px; font-weight: 800; }\n.tsav .tl-tete { display: flex; align-items: center; gap: 8px; padding: 6px 12px; }\n.tsav .tl-tete div { flex: 1; min-width: 0; }\n.tsav .tl-tete b { display: block; font-size: 13px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.tsav .tl-tete small { font-size: 10.5px; color: #6a7089; }\n.tsav .tl-rond { width: 28px; height: 28px; flex: none; border-radius: 50%; background: #fff; display: grid; place-items: center; font-size: 15px; box-shadow: 0 1px 3px rgba(16,19,42,.1); }\n.tsav .tl-prog { margin: 4px 14px 0; height: 4px; border-radius: 4px; background: #e1e5f0; overflow: hidden; }\n.tsav .tl-prog i { display: block; height: 100%; background: #1a3dd1; border-radius: 4px; transition: width .4s cubic-bezier(.2,.8,.2,1); }\n.tsav .tl-corps { flex: 1; min-height: 0; overflow: auto; padding: 14px 14px 12px; display: flex; flex-direction: column; gap: 10px; }\n.tsav .tl-sur { margin: 0; font-size: 9.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #1a3dd1; }\n.tsav .tel-ecran h5 { margin: 0; font-size: 18px; font-weight: 800; line-height: 1.2; letter-spacing: -.02em; text-wrap: balance; }\n.tsav .tl-reps { display: grid; gap: 7px; }\n.tsav .tl-reps button, .tsav .tl-cta { border: 0; border-radius: 14px; min-height: 42px; padding: 0 12px; background: #fff; box-shadow: inset 0 0 0 1.5px #dfe3ef; font: 800 12.5px var(--f); color: #10132a; text-align: left; cursor: pointer; }\n.tsav .tl-reps button:first-child, .tsav .tl-cta { background: #1a3dd1; color: #fff; box-shadow: 0 10px 18px -12px rgba(26,61,209,.8); }\n.tsav .tl-cta { width: 100%; text-align: center; }\n.tsav .tl-manque { opacity: .6; }\n.tsav .tl-pied { margin-top: auto; }\n.tsav .tl-aide { border-radius: 12px; background: #f3f6ff; box-shadow: inset 0 0 0 1.5px #d9e1fb; font-size: 11.5px; }\n.tsav .tl-aide summary { list-style: none; display: flex; align-items: center; gap: 7px; padding: 8px 10px; font-weight: 800; color: #1a3dd1; cursor: pointer; }\n.tsav .tl-aide summary::-webkit-details-marker { display: none; }\n.tsav .tl-aide summary span { width: 18px; height: 18px; border-radius: 50%; background: #1a3dd1; color: #fff; display: grid; place-items: center; font-size: 10px; }\n.tsav .tl-aide p { margin: 0; padding: 0 10px 10px; color: #3b4157; line-height: 1.4; }\n.tsav .tl-fin { padding: 14px; border-radius: 18px; color: #fff; display: grid; gap: 5px; }\n.tsav .tl-fin span { font-size: 9.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; opacity: .85; }\n.tsav .tl-fin b { font-size: 17px; font-weight: 800; line-height: 1.2; }\n.tsav .tl-fin small { font-size: 11px; opacity: .92; }\n.tsav .tl-raz { background: linear-gradient(135deg, #1a3dd1, #3355e8); }\n.tsav .tl-ok { background: linear-gradient(135deg, #12855a, #1aa673); }\n.tsav .tl-derog { background: linear-gradient(135deg, #b86a00, #d98a1c); }\n.tsav .tl-puces { display: flex; flex-wrap: wrap; gap: 5px; }\n.tsav .tl-puces span { padding: 4px 8px; border-radius: 99px; background: #fbeedb; color: #7a4a06; font-size: 10.5px; font-weight: 800; }\n.tsav .tl-puces span.g { background: #e3f3ec; color: #0e5c3f; }\n.tsav .tl-msg { margin: 0; padding: 10px; border-radius: 12px; background: #fff; font-size: 11.5px; line-height: 1.4; color: #3b4157; }\n.tsav .tl-vide { margin: auto; padding: 20px; text-align: center; font-size: 12px; color: #6a7089; }\n.tsav .btn[aria-pressed=\"false\"] { color: var(--doux); }\n.tsav .carte.synchro { border-color: #f59e0b; box-shadow: 0 0 0 4px rgba(245,158,11,.35), 0 0 30px 6px rgba(245,158,11,.45); animation: synchro 1.6s ease-in-out infinite; }\n.tsav .carte.synchro::after { content: \"Maquette ici\"; position: absolute; left: 10px; top: -12px; padding: 2px 8px; border-radius: 99px; background: #f59e0b; color: #fff; font-size: 11px; font-weight: 800; }\n@keyframes synchro { 50% { box-shadow: 0 0 0 7px rgba(245,158,11,.18), 0 0 40px 10px rgba(245,158,11,.3); } }\n@media (prefers-reduced-motion: reduce) {\n.tsav .carte.synchro { animation: none; }\n }\n.tsav .lien-maq { margin: 0; font-size: 12.5px; color: var(--doux); }\n.tsav .lien-maq.ok { color: var(--vert); }\n.tsav .ct-lie { position: absolute; right: 42px; top: 16px; font-size: 13px; }\n@media (max-width: 760px) {\n.tsav .panneau { position: absolute; right: 0; top: 0; bottom: 0; z-index: 4; width: 88%; box-shadow: -20px 0 40px -20px rgba(16,19,42,.35); }\n.tsav .astuce { display: none; }\n\n}\n@media (prefers-reduced-motion: reduce) {\n.tsav * { transition: none !important; }\n }\n\n\n.tsav { position: fixed; inset: 0; z-index: 1000; background: var(--fond); color: var(--encre); font: 500 14px/1.45 var(--f); -webkit-font-smoothing: antialiased; }\n.tsav .app { height: 100%; }\n.tsav *, .tsav *::before, .tsav *::after { box-sizing: border-box; }\n.tsav [hidden] { display: none !important; }\n.tsav .btn.retour { background: var(--encre); border-color: var(--encre); color: #fff; }\n"

export const MARKUP = "<div class=\"app\">\n  <header class=\"tete\">\n    <button type=\"button\" class=\"btn retour\" data-a=\"quitter\">← Dashboard</button>\n    <div class=\"marque\"><b>Atelier tunnel SAV</b><span>Kevin et Quentin · les étapes de l'app SAV, écran par écran</span></div>\n    <select id=\"choix\" aria-label=\"Flux affiché\"></select>\n    <input id=\"nom\" aria-label=\"Nom du flux\" placeholder=\"Nom du flux (ex. Le client voit mal)\">\n    <button type=\"button\" class=\"btn\" data-a=\"nouveau\">+ Nouveau flux</button>\n    <button type=\"button\" class=\"btn plein\" data-a=\"tester\">▶ Tester le flux</button>\n    <button type=\"button\" class=\"btn\" data-a=\"tel\" id=\"btnTel\" aria-pressed=\"true\">📱 Aperçu</button>\n    <span class=\"espace\"></span>\n    <div class=\"presents\" id=\"presents\" aria-live=\"polite\"></div>\n    <span class=\"etat\" id=\"etat\" aria-live=\"polite\">Connexion…</span>\n    <button type=\"button\" class=\"btn danger\" data-a=\"supprimer\">Supprimer le flux</button>\n  </header>\n  <div class=\"corps\">\n    <div class=\"plan\" id=\"plan\">\n      <div class=\"monde\" id=\"monde\"><svg class=\"liens\" id=\"liens\" width=\"1\" height=\"1\"></svg></div>\n      <p class=\"compteur\" id=\"compteur\" hidden></p>\n      <div class=\"bandeau\" id=\"bandeau\" hidden>Clique la carte à relier · Échap pour annuler</div>\n      <div class=\"vide\" id=\"fluxVide\" hidden><div><b>Ce flux est vide</b><p>Choisis un autre flux dans la liste en haut à gauche, ou supprime celui-ci.</p></div></div>\n      <div class=\"vide\" id=\"vide\" hidden><div><b>Aucun flux pour l'instant</b><p>Crée le premier flux : une carte de départ apparaît, puis tu ajoutes les étapes dessous.</p><button type=\"button\" class=\"btn plein\" data-a=\"nouveau\">+ Nouveau flux</button></div></div>\n      <p class=\"astuce\">Glisser le fond pour se déplacer · glisser une carte pour la bouger · Ctrl + molette pour zoomer</p>\n      <div class=\"outils-plan\">\n        <button type=\"button\" class=\"btn\" data-a=\"moins\" aria-label=\"Dézoomer\">−</button><span class=\"zoom\" id=\"zoom\">80 %</span><button type=\"button\" class=\"btn\" data-a=\"plus\" aria-label=\"Zoomer\">+</button>\n        <button type=\"button\" class=\"btn\" data-a=\"centre\">Recentrer</button>\n      </div>\n    </div>\n    <section class=\"tel-zone\" id=\"telZone\" aria-label=\"Aperçu sur téléphone\">\n      <div class=\"tel-onglets\" role=\"tablist\">\n        <button type=\"button\" role=\"tab\" data-telvue=\"maq\" aria-selected=\"true\">Maquette actuelle</button>\n        <button type=\"button\" role=\"tab\" data-telvue=\"carte\" aria-selected=\"false\">Aperçu de la carte</button>\n      </div>\n      <div class=\"tel-maq\" id=\"telMaq\"></div>\n      <div class=\"tel\" id=\"telCarte\" hidden><div class=\"tel-ecran\" id=\"telEcran\"></div></div>\n      <p class=\"tel-note\" id=\"telNote\">La vraie maquette, utilisable telle quelle · commande de démo 0000000</p>\n      <button type=\"button\" class=\"mini\" id=\"maqRecharger\">Recharger la maquette</button>\n    </section>\n    <aside class=\"panneau\" id=\"panneau\" hidden></aside>\n    <div class=\"essai\" id=\"essai\" hidden></div>\n    <div class=\"menu\" id=\"menu\" hidden></div>\n  </div>\n</div>\n\n"

// Notes « Modifs à faire » par tuile, onglet qui les réunit, et gestion des
// liens (délier, relier ailleurs, tuiles hors parcours) depuis le panneau.
const STYLES_MODIFS = `
.tsav .ct-note { margin-left: auto; padding: 1px 7px; border-radius: 99px; background: #fbeedb; color: #8a4f00; font: 800 10px var(--f); letter-spacing: 0; text-transform: none; }
.tsav .ct-orph { padding: 1px 7px; border-radius: 99px; background: #fde8e4; color: var(--rouge); font: 800 10px var(--f); letter-spacing: 0; text-transform: none; }
.tsav .carte.orpheline { border-style: dashed; }
.tsav .note-modif { display: grid; gap: 6px; padding: 10px; border-radius: 12px; background: #fff7e8; border: 1.5px solid #f3d29b; }
.tsav .note-modif > span { font-size: 12px; font-weight: 800; color: #8a4f00; }
.tsav .note-modif textarea { width: 100%; border-radius: 10px; border: 1px solid #f0c987; background: #fff; padding: 8px 10px; font-size: 13.5px; resize: vertical; }
.tsav .lien-ligne { display: grid; gap: 6px; padding: 8px; border-radius: 10px; border: 1px solid var(--trait); }
.tsav .lien-ligne p { margin: 0; font-size: 12.5px; color: var(--doux); }
.tsav .lien-ligne p b { color: var(--encre); }
.tsav .lien-ligne .rep { flex-wrap: wrap; }
.tsav .btn.modifs .nb { display: inline-grid; place-items: center; min-width: 20px; height: 20px; margin-left: 6px; padding: 0 5px; border-radius: 99px; background: #fbeedb; color: #8a4f00; font-size: 11px; }
.tsav .liste-modifs { width: min(620px, 94%); max-height: 82%; overflow: auto; }
.tsav .modif-item { display: grid; gap: 4px; text-align: left; padding: 11px 12px; border-radius: 12px; border: 1px solid var(--trait-fort); background: var(--papier); cursor: pointer; }
.tsav .modif-item:hover { border-color: var(--bleu); }
.tsav .modif-item small { font: 700 10.5px var(--mono); letter-spacing: .06em; text-transform: uppercase; color: var(--c); }
.tsav .modif-item b { font-size: 13.5px; }
.tsav .modif-item span { font-size: 13px; color: #6b3d00; white-space: pre-wrap; }
`

export function monterEditeur(racine, ctx) {
  racine.innerHTML = '<style>' + STYLES + STYLES_MODIFS + '</style>' + "<link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap\">" + MARKUP
  var ecoutes = []
  function ecouteDoc(type, fn, opt) { document.addEventListener(type, fn, opt); ecoutes.push([type, fn, opt]) }
  var claude = { use: ctx.use }

  var TYPES = {
    depart:   { nom: 'Départ', ic: '▶', coul: '#0a7c94', fin: false, aide: 'Le premier écran de l\'app pour ce flux (ex. fiche commande, bouton « Le client voit mal »).' },
    question: { nom: 'Question', ic: '?', coul: '#1a3dd1', fin: false, aide: 'L\'app pose une question au collaborateur SAV ; chaque réponse mène à l\'étape suivante.' },
    action:   { nom: 'Étape', ic: '✓', coul: '#5b3fd6', fin: false, aide: 'Un écran ou une action de l\'app (photo, essai, cases à cocher, saisie…), puis on passe à la suite.' },
    raz:      { nom: 'Fin · RAZ', ic: '↻', coul: '#c4391d', fin: true, aide: 'Fin du flux : l\'app ouvre une recommande avec ce motif.' },
    sanssav:  { nom: 'Fin · sans SAV', ic: '☺', coul: '#12855a', fin: true, aide: 'Fin du flux : l\'app clôt le dossier sans recommande.' },
    derog:    { nom: 'Fin · dérogation', ic: '!', coul: '#b86a00', fin: true, aide: 'Fin du flux : l\'app envoie une demande de dérogation ou affiche un refus.' }
  };
  var AJOUTABLES = ['question', 'action', 'raz', 'sanssav', 'derog'];
  var CHAMPS = [['correction', 'Correction'], ['pdm', 'Prises de mesures'], ['traitement', 'Traitement'], ['type', 'Type de verre'], ['monture', 'Monture']];
  var ELEMENTS = [['verres', 'Verres seuls'], ['monture', 'Monture seule'], ['equipement', 'Équipement complet']];
  var COULEURS_PERS = ['#1a3dd1', '#c4391d', '#12855a', '#5b3fd6', '#b86a00', '#0a7c94'];
  var L = 260, HT = 78, HS = 40;
  var $ = function (id) { return document.getElementById(id); };
  (function () { var f = document.createElement('iframe'); f.id = 'maqFrame'; f.title = 'Maquette actuelle de l\'app SAV'; $('telMaq').appendChild(f); })();
  (function () {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn modifs'; b.dataset.a = 'modifs'; b.id = 'btnModifs'; b.textContent = '✎ Modifs à faire';
    var t = document.querySelector('.tsav [data-a="tel"]'); t.parentNode.insertBefore(b, t.nextSibling);
    var l = document.createElement('div'); l.className = 'essai'; l.id = 'listeModifs'; l.hidden = true; $('essai').parentNode.appendChild(l);
  })();
  var plan = $('plan'), monde = $('monde'), svg = $('liens'), panneau = $('panneau'), menu = $('menu'), essai = $('essai'), listeModifs = $('listeModifs');
  var db = null, room = null, user = null, moi = null;
  var chargeCartes = false, tunnels = {}, cartes = {}, courant = null, sel = null, liaison = null, geste = null;
  var vue = { x: 60, y: 60, z: 0.8 };
  var sales = {}, minuteurs = {}, desabo = null, pairs = [], noms = {};

  function uid(p) { return p + Math.random().toString(36).slice(2, 9); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); }
  function etat(t, alerte) { var e = $('etat'); if (!e) return; e.textContent = t; e.className = 'etat' + (alerte ? ' alerte' : ''); }
  function sorties(c) { return c.type === 'question' ? (c.reponses || []) : c.type === 'depart' ? ['Commencer'] : c.type === 'action' ? ['Fait'] : []; }
  function hauteur(c) { return HT + (TYPES[c.type].fin ? 34 : HS); }
  function larg(c) { return c.type === 'question' ? Math.max(L, sorties(c).length * 140) : L; }
  function portX(c, i) { var n = Math.max(1, sorties(c).length); return c.x + larg(c) * (i + 0.5) / n; }
  function nouvelleCarte(type, x, y) {
    var c = { id: uid('c'), type: type, x: Math.round(x), y: Math.round(y), titre: '', texte: '', suites: [] };
    if (type === 'question') c.reponses = ['Oui', 'Non'];
    if (type === 'raz') { c.element = 'verres'; c.modif = {}; c.paie = ''; c.preuve = ''; }
    return c;
  }

  /* ---------- enregistrement : un document par carte ---------- */
  function chemin(cid) { return 'tunnels/' + courant + '/cases/' + cid; }
  function ecrire(c) {
    if (!db || !courant) return;
    var id = c.id; sales[id] = true; etat('Enregistrement…');
    clearTimeout(minuteurs[id]);
    minuteurs[id] = setTimeout(function () {
      var x = cartes[id]; if (!x) return;
      db.doc(chemin(id)).set(JSON.parse(JSON.stringify(x))).then(function () { delete sales[id]; if (!Object.keys(sales).length) etat('Enregistré'); })
        .catch(function () { etat('Une modification n\'a pas pu être enregistrée. Réessaie dans un instant.', true); });
    }, 200);
  }
  function effacer(cid) { if (db && courant) db.doc(chemin(cid)).delete().catch(function () {}); }
  function ecrireTunnel() { if (db && courant && tunnels[courant]) db.doc('tunnels/' + courant).set({ nom: tunnels[courant].nom, maj: new Date().toISOString() }).catch(function () { etat('Le nom n\'a pas pu être enregistré.', true); }); }

  /* ---------- vue ---------- */
  function appliquerVue() {
    monde.style.transform = 'translate(' + vue.x + 'px,' + vue.y + 'px) scale(' + vue.z + ')';
    plan.style.backgroundPosition = vue.x + 'px ' + vue.y + 'px';
    plan.style.backgroundSize = (22 * vue.z) + 'px ' + (22 * vue.z) + 'px';
    $('zoom').textContent = Math.round(vue.z * 100) + ' %';
  }
  function zoomer(f, cx, cy) {
    var r = plan.getBoundingClientRect(), mx = (cx == null ? r.left + r.width / 2 : cx) - r.left, my = (cy == null ? r.top + r.height / 2 : cy) - r.top;
    var z = Math.min(1.6, Math.max(0.3, vue.z * f));
    vue.x = mx - (mx - vue.x) * z / vue.z; vue.y = my - (my - vue.y) * z / vue.z; vue.z = z; appliquerVue();
  }
  function centrer() {
    var cs = Object.values(cartes), r = plan.getBoundingClientRect();
    if (!cs.length) { vue = { x: 60, y: 60, z: 0.8 }; appliquerVue(); return; }
    var minX = Math.min.apply(null, cs.map(function (c) { return c.x; })), maxX = Math.max.apply(null, cs.map(function (c) { return c.x + larg(c); }));
    var minY = Math.min.apply(null, cs.map(function (c) { return c.y; }));
    vue.z = Math.min(0.9, Math.max(0.35, (r.width - 80) / Math.max(1, maxX - minX)));
    vue.x = r.width / 2 - ((minX + maxX) / 2) * vue.z; vue.y = 50 - minY * vue.z; appliquerVue();
  }

  /* ---------- rendu ---------- */
  function resumeFin(c) {
    if (c.type === 'raz') {
      var el = (ELEMENTS.filter(function (e) { return e[0] === c.element; })[0] || ['', '—'])[1];
      var m = CHAMPS.filter(function (x) { return c.modif && c.modif[x[0]]; }).map(function (x) { return x[1].toLowerCase(); });
      return el + ' · ' + (m.length ? 'modifiable : ' + m.join(', ') : 'à l\'identique');
    }
    return c.texte || (c.type === 'sanssav' ? 'Dossier clos sans recommande' : 'Dérogation ou refus');
  }
  function quiSur(cid) { return pairs.filter(function (p) { return !p.isMe && p.presence && p.presence.carte === cid && p.presence.tunnel === courant; })[0]; }
  function couleurPers(p) { var k = 0, s = p.by || p.peer || ''; for (var i = 0; i < s.length; i++) k = (k * 31 + s.charCodeAt(i)) >>> 0; return COULEURS_PERS[k % COULEURS_PERS.length]; }
  function nomPers(p) { return (p.by && noms[p.by]) || 'Quelqu\'un'; }

  function dessiner() {
    $('choix').innerHTML = Object.keys(tunnels).sort(function (a, b) { return (tunnels[a].nom || '').localeCompare(tunnels[b].nom || ''); })
      .map(function (id) { return '<option value="' + esc(id) + '"' + (id === courant ? ' selected' : '') + '>' + esc(tunnels[id].nom || 'Sans nom') + '</option>'; }).join('');
    if (document.activeElement !== $('nom')) $('nom').value = courant && tunnels[courant] ? tunnels[courant].nom || '' : '';
    $('vide').hidden = !!courant;
    var fv = $('fluxVide'); if (fv) fv.hidden = !courant || Object.keys(cartes).length > 0 || !chargeCartes;
    monde.querySelectorAll('.carte').forEach(function (n) { n.remove(); });
    var manque = 0, entrants = entrees();
    Object.values(cartes).forEach(function (c) {
      if (!TYPES[c.type]) return;
      var T = TYPES[c.type], so = sorties(c), autre = quiSur(c.id), orph = c.type !== 'depart' && !entrants[c.id];
      var n = document.createElement('div');
      n.className = 'carte' + (sel === c.id ? ' choisie' : '') + (autre ? ' autre' : '') + (orph ? ' orpheline' : '') + (liaison && c.type !== 'depart' && c.id !== liaison.source ? ' cible' : '');
      n.dataset.id = c.id;
      n.style.cssText = 'left:' + c.x + 'px;top:' + c.y + 'px;width:' + larg(c) + 'px;height:' + hauteur(c) + 'px;--c:' + T.coul + (autre ? ';--pc:' + couleurPers(autre) : '');
      var vide = c.type === 'question' ? 'Question à écrire' : c.type === 'action' ? 'Étape à décrire' : c.type === 'depart' ? 'Écran de départ' : 'Titre de la fin';
      var h = (autre ? '<span class="qui">' + esc(nomPers(autre)) + '</span>' : '') +
        '<div class="ct-tete">' + (c.maq ? '<span class="ct-lie" title="Liée à la maquette">🔗</span>' : '') + '<button type="button" class="ct-dup" data-dup title="Dupliquer (⌘D)" aria-label="Dupliquer la carte">⧉</button>' + '<span class="ct-type"><i>' + T.ic + '</i>' + T.nom + (orph ? ' <span class="ct-orph">Hors parcours</span>' : '') + '<span class="ct-note"' + (aNote(c) ? '' : ' hidden') + '>✎ modif</span></span><b class="' + (c.titre ? '' : 'vide-t') + '">' + esc(c.titre || vide) + '</b></div>';
      if (T.fin) h += '<div class="ct-fin">' + esc(resumeFin(c)) + '</div>';
      if (so.length) {
        h += '<div class="ct-sorties">';
        so.forEach(function (lib, i) {
          var suite = c.suites && c.suites[i] && cartes[c.suites[i]];
          if (!suite) manque++;
          h += '<div class="ct-sortie">' + (suite
            ? '<span class="ct-lib">' + esc(lib) + '</span><button type="button" class="ct-ic" data-inserer="' + i + '" title="Insérer une carte ici">⊕</button><button type="button" class="ct-ic" data-delier="' + i + '" title="Retirer le lien">×</button>'
            : '<button type="button" class="ct-plus" data-plus="' + i + '" title="Ajouter la suite">+ ' + esc(lib) + '</button>') +
            '<span class="port' + (suite ? ' plein' : '') + '"></span></div>';
        });
        h += '</div>';
      }
      n.innerHTML = h;
      monde.appendChild(n);
    });
    var cp = $('compteur'); cp.hidden = !courant;
    cp.textContent = manque ? manque + ' sortie' + (manque > 1 ? 's' : '') + ' sans suite' : 'Toutes les sorties ont une suite';
    cp.className = 'compteur' + (manque ? ' alerte' : '');
    var nbOrph = Object.values(cartes).filter(function (c) { return TYPES[c.type] && c.type !== 'depart' && !entrants[c.id]; }).length;
    if (courant && nbOrph) cp.textContent += ' · ' + nbOrph + ' tuile' + (nbOrph > 1 ? 's' : '') + ' hors parcours';
    compterModifs();
    liens();
    remplirPanneau();
    rendreTel();
    if (synchro && synchro[0] === courant) allumer(synchro[1]);
  }
  function aNote(c) { return !!(c.modifs && c.modifs.trim()); }
  function entrees() { // id de tuile → [[tuile source, n° de sortie]]
    var e = {};
    Object.values(cartes).forEach(function (c) { (c.suites || []).forEach(function (s, i) { if (s && cartes[s] && i < sorties(c).length) (e[s] = e[s] || []).push([c, i]); }); });
    return e;
  }
  function nomCarte(c) { return c ? (c.titre || (TYPES[c.type] ? TYPES[c.type].nom : 'Tuile')) : '—'; }
  function compterModifs() {
    var b = $('btnModifs'); if (!b) return;
    var n = Object.values(cartes).filter(aNote).length;
    b.innerHTML = '✎ Modifs à faire' + (n ? '<span class="nb">' + n + '</span>' : '');
  }
  function afficherModifs() {
    var avec = Object.values(cartes).filter(function (c) { return TYPES[c.type] && aNote(c); })
      .sort(function (a, b) { return rangEtape(a.id) - rangEtape(b.id) || a.y - b.y || a.x - b.x; });
    var nomFlux = courant && tunnels[courant] ? tunnels[courant].nom || 'Sans nom' : '';
    var h = '<div class="e-carte liste-modifs"><div class="e-tete" style="--c:#b86a00"><span><i>✎</i>Modifs à faire · ' + esc(nomFlux) + '</span><button type="button" class="x" data-m-fermer aria-label="Fermer">×</button></div>';
    if (!avec.length) h += '<p class="e-info">Aucune note pour l\'instant. Clique une tuile et écris dans l\'encadré « Modifs à faire sur cette tuile ».</p>';
    else {
      h += '<p class="aide">' + avec.length + ' tuile' + (avec.length > 1 ? 's' : '') + ' à reprendre. Clique une note pour aller sur la tuile.</p>';
      h += avec.map(function (c) {
        var T = TYPES[c.type];
        return '<button type="button" class="modif-item" data-m-voir="' + esc(c.id) + '" style="--c:' + T.coul + '"><small>' + T.nom + '</small><b>' + esc(nomCarte(c)) + '</b><span>' + esc(c.modifs.trim()) + '</span></button>';
      }).join('');
      h += '<div class="e-bas"><button type="button" class="mini" data-m-copier>Copier toutes les notes</button></div>';
    }
    listeModifs.innerHTML = h + '</div>';
    listeModifs.hidden = false;
  }
  function allerA(c) {
    var r = plan.getBoundingClientRect(); vue.x = r.width / 2 - (c.x + larg(c) / 2) * vue.z; vue.y = r.height / 4 - c.y * vue.z; appliquerVue(); choisir(c.id);
  }
  listeModifs.addEventListener('click', function (e) {
    if (e.target === listeModifs) { listeModifs.hidden = true; return; }
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.mFermer != null) listeModifs.hidden = true;
    else if (b.dataset.mVoir) { var c = cartes[b.dataset.mVoir]; listeModifs.hidden = true; if (c) allerA(c); }
    else if (b.dataset.mCopier != null) {
      var txt = Object.values(cartes).filter(aNote).sort(function (a, b2) { return rangEtape(a.id) - rangEtape(b2.id); })
        .map(function (c) { return '• ' + nomCarte(c) + ' : ' + c.modifs.trim(); }).join('\n');
      var ok = function () { b.textContent = 'Copié'; setTimeout(function () { b.textContent = 'Copier toutes les notes'; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(ok, function () {});
    }
  });
  function liens() {
    var p = '';
    Object.values(cartes).forEach(function (c) {
      (c.suites || []).forEach(function (s, i) {
        var d = cartes[s]; if (!d || i >= sorties(c).length || !TYPES[c.type]) return;
        var x1 = portX(c, i), y1 = c.y + hauteur(c) + 5, x2 = d.x + larg(d) / 2, y2 = d.y - 5;
        var dy = Math.max(40, Math.abs(y2 - y1) / 2), actif = sel === c.id || sel === s;
        p += '<path d="M' + x1 + ',' + y1 + ' C' + x1 + ',' + (y1 + dy) + ' ' + x2 + ',' + (y2 - dy) + ' ' + x2 + ',' + y2 + '"' + (actif ? ' class="actif" style="stroke:' + TYPES[c.type].coul + '"' : '') + ' marker-end="url(#pointe)"/>';
      });
    });
    svg.innerHTML = '<defs><marker id="pointe" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#9aa1b9"/></marker></defs>' + p;
  }

  /* ---------- panneau d'édition ---------- */
  function remplirPanneau() {
    var c = sel && cartes[sel];
    if (!c) { panneau.hidden = true; return; }
    if (panneau.contains(document.activeElement) && panneau.dataset.id === c.id) return; // ne pas casser la saisie en cours
    panneau.hidden = false; panneau.dataset.id = c.id;
    var T = TYPES[c.type];
    var libT = c.type === 'question' ? 'Question affichée par l\'app' : c.type === 'action' ? 'Ce que fait l\'app à cette étape' : c.type === 'depart' ? 'Écran de départ dans l\'app' : c.type === 'raz' ? 'Motif de la RAZ' : 'Titre de la fin';
    var h = '<div class="p-tete" style="--c:' + T.coul + '"><span><i>' + T.ic + '</i>' + T.nom + '</span><button type="button" class="x" data-fermer aria-label="Fermer">×</button></div>' +
      '<p class="aide">' + T.aide + '</p>' +
      '<label>' + libT + '<textarea id="pTitre" data-champ="titre" rows="2">' + esc(c.titre) + '</textarea></label>' +
      '<label>' + (T.fin ? 'Message affiché dans l\'app' : 'Aide « Comment faire » dans l\'app (facultatif)') + '<textarea id="pTexte" data-champ="texte" rows="3">' + esc(c.texte) + '</textarea></label>';
    if (c.type === 'question') {
      h += '<div class="gr"><span>Réponses possibles</span>' + c.reponses.map(function (r, i) {
        return '<div class="rep"><input id="pRep' + i + '" data-rep="' + i + '" value="' + esc(r) + '" aria-label="Réponse ' + (i + 1) + '"><button type="button" class="x" data-suppr-rep="' + i + '" title="Supprimer cette réponse">×</button></div>';
      }).join('') + '<button type="button" class="mini" data-ajout-rep>+ Ajouter une réponse</button></div>';
    }
    if (c.type === 'raz') {
      h += '<div class="gr"><span>Élément recommandé</span><div class="seg">' + ELEMENTS.map(function (e) {
        return '<button type="button" data-element="' + e[0] + '" aria-pressed="' + (c.element === e[0]) + '">' + e[1] + '</button>';
      }).join('') + '</div></div>';
      h += '<div class="gr"><span>Modifiable (le reste reste à l\'identique)</span>' + CHAMPS.map(function (x) {
        return '<label class="coche"><input type="checkbox" id="pM' + x[0] + '" data-modif="' + x[0] + '"' + (c.modif && c.modif[x[0]] ? ' checked' : '') + '>' + x[1] + '</label>';
      }).join('') + '</div>';
      h += '<label>Le client paie<input id="pPaie" data-champ="paie" value="' + esc(c.paie) + '" placeholder="Ex. Gratuit · prix réel 30 € max"></label>';
      h += '<label>Preuve à fournir<input id="pPreuve" data-champ="preuve" value="' + esc(c.preuve) + '" placeholder="Ex. Photo du verre"></label>';
    }
    h += '<div class="note-modif"><span>✎ Modifs à faire sur cette tuile</span><textarea id="pModifs" data-champ="modifs" rows="3" placeholder="Vos suggestions pour cette tuile (ce qu\'il faut changer, ajouter, vérifier…)">' + esc(c.modifs) + '</textarea></div>';
    h += '<div class="gr" id="liensCarte"></div>';
    h += '<div class="gr" id="lienMaq"></div>';
    h += '<div class="p-bas">' + (c.type !== 'depart'
      ? '<button type="button" class="mini" data-dupliquer>Dupliquer</button><button type="button" class="mini danger" data-supprimer>Supprimer la carte</button>'
      : '<button type="button" class="mini" data-dupliquer>Dupliquer</button><span class="aide">La carte de départ ne se supprime pas.</span>') + '</div>';
    panneau.innerHTML = h;
    remplirLiens();
    remplirLienMaq();
  }
  function remplirLiens() {
    var z = $('liensCarte'), c = sel && cartes[sel]; if (!z || !c) return;
    var so = sorties(c), arrivees = c.type === 'depart' ? [] : (entrees()[c.id] || []), h = '';
    if (so.length) {
      h += '<span>Où mène cette tuile</span>' + so.map(function (lib, i) {
        var d = c.suites && c.suites[i] && cartes[c.suites[i]];
        return '<div class="lien-ligne"><p>« ' + esc(lib || '…') + ' » → ' + (d ? '<b>' + esc(nomCarte(d)) + '</b>' : '<i>pas de suite</i>') + '</p><div class="rep">' +
          (d ? '<button type="button" class="mini" data-l-aller="' + esc(d.id) + '">Voir</button><button type="button" class="mini danger" data-l-delier="' + i + '">Délier</button><button type="button" class="mini" data-l-relier="' + i + '">Relier à une autre tuile</button>'
             : '<button type="button" class="mini" data-l-creer="' + i + '">+ Nouvelle tuile</button><button type="button" class="mini" data-l-relier="' + i + '">Relier à une tuile existante</button>') +
          '</div></div>';
      }).join('');
    }
    if (c.type !== 'depart') {
      h += '<span>Qui arrive sur cette tuile</span>' + (arrivees.length ? arrivees.map(function (a) {
        return '<div class="lien-ligne"><p><b>' + esc(nomCarte(a[0])) + '</b> · « ' + esc(sorties(a[0])[a[1]] || '…') + ' »</p><div class="rep"><button type="button" class="mini" data-l-aller="' + esc(a[0].id) + '">Voir</button><button type="button" class="mini danger" data-e-delier="' + esc(a[0].id) + ':' + a[1] + '">Délier</button></div></div>';
      }).join('') : '<p class="aide">Aucune tuile ne mène ici : elle est hors parcours. Pour la raccrocher, ouvre la tuile d\'avant et choisis « Relier à une tuile existante ».</p>');
    }
    z.innerHTML = h;
  }
  function remplirLienMaq() {
    var z = $('lienMaq'), c = sel && cartes[sel]; if (!z || !c) return;
    var h = '<span>Écran de la maquette</span>';
    if (c.maq) h += '<p class="lien-maq ok">Liée à : <b>' + esc(c.maq.libelle || c.maq.sel) + '</b></p><div class="rep"><button type="button" class="mini" data-maq-voir>▶ Ouvrir dans le téléphone</button><button type="button" class="mini" data-maq-delier>Délier</button></div>';
    else h += '<p class="lien-maq">Pas encore liée. Clique l\'élément voulu dans la maquette du téléphone, puis :</p>';
    h += dernierClic ? '<button type="button" class="mini" data-maq-lier>🔗 Lier au dernier clic : « ' + esc(dernierClic.libelle || dernierClic.sel) + ' »</button>' : '<p class="aide">Aucun clic dans la maquette pour l\'instant.</p>';
    z.innerHTML = h;
  }
  function majCarte(c) {
    rendreTel();
    var n = monde.querySelector('.carte[data-id="' + c.id + '"]'); if (!n) return;
    var b = n.querySelector('.ct-tete b'); b.textContent = c.titre || '…'; b.className = c.titre ? '' : 'vide-t';
    var f = n.querySelector('.ct-fin'); if (f) f.textContent = resumeFin(c);
    var nt = n.querySelector('.ct-note'); if (nt) nt.hidden = !aNote(c);
    compterModifs();
    n.querySelectorAll('.ct-sortie').forEach(function (s, i) { var l = s.querySelector('.ct-lib, .ct-plus'); if (l) l.textContent = (l.classList.contains('ct-plus') ? '+ ' : '') + (sorties(c)[i] || ''); });
  }
  panneau.addEventListener('input', function (e) {
    var c = cartes[sel]; if (!c) return;
    var f = e.target;
    if (f.dataset.champ) c[f.dataset.champ] = f.value;
    else if (f.dataset.rep != null) c.reponses[+f.dataset.rep] = f.value;
    else return;
    majCarte(c); ecrire(c);
  });
  panneau.addEventListener('change', function (e) {
    var c = cartes[sel]; if (!c || !e.target.dataset.modif) return;
    c.modif = c.modif || {}; c.modif[e.target.dataset.modif] = e.target.checked; majCarte(c); ecrire(c);
  });
  panneau.addEventListener('click', function (e) {
    var c = cartes[sel], b = e.target.closest('button'); if (!c || !b) return;
    if (b.dataset.fermer != null) { choisir(null); return; }
    if (b.dataset.lAller) { var d = cartes[b.dataset.lAller]; if (d) allerA(d); return; }
    if (b.dataset.lDelier != null) { c.suites[+b.dataset.lDelier] = null; ecrire(c); panneau.dataset.id = ''; dessiner(); return; }
    if (b.dataset.lRelier != null) { liaison = { source: c.id, i: +b.dataset.lRelier }; $('bandeau').hidden = false; dessiner(); return; }
    if (b.dataset.lCreer != null) { ouvrirMenu(c.id, +b.dataset.lCreer, false, b); return; }
    if (b.dataset.eDelier) {
      var p = b.dataset.eDelier.split(':'), s = cartes[p[0]];
      if (s && s.suites) { s.suites[+p[1]] = null; ecrire(s); }
      panneau.dataset.id = ''; dessiner(); return;
    }
    if (b.dataset.maqLier != null && dernierClic) { c.maq = { sel: dernierClic.sel, chemin: dernierClic.chemin, libelle: dernierClic.libelle }; ecrire(c); remplirLienMaq(); synchro = [courant, c.id]; allumer(c.id); return; }
    if (b.dataset.maqDelier != null) { delete c.maq; c.maq = null; ecrire(c); remplirLienMaq(); return; }
    if (b.dataset.maqVoir != null && c.maq) { montrerMaq(); rejouer(c.maq.chemin || [c.maq.sel]); return; }
    if (b.dataset.ajoutRep != null) { c.reponses.push('Réponse ' + (c.reponses.length + 1)); ecrire(c); panneau.dataset.id = ''; dessiner(); return; }
    if (b.dataset.supprRep != null) { if (c.reponses.length <= 1) return; var i = +b.dataset.supprRep; c.reponses.splice(i, 1); (c.suites || []).splice(i, 1); ecrire(c); panneau.dataset.id = ''; dessiner(); return; }
    if (b.dataset.element) { c.element = b.dataset.element; ecrire(c); panneau.dataset.id = ''; dessiner(); return; }
    if (b.dataset.dupliquer != null) { dupliquer(c); return; }
    if (b.dataset.supprimer != null) {
      if (!b.classList.contains('confirme')) { b.classList.add('confirme'); b.textContent = 'Confirmer la suppression'; return; }
      Object.values(cartes).forEach(function (x) {
        if ((x.suites || []).indexOf(c.id) >= 0) { x.suites = x.suites.map(function (s) { return s === c.id ? null : s; }); ecrire(x); }
      });
      delete cartes[c.id]; effacer(c.id); choisir(null);
    }
  });
  function dupliquer(c) {
    if (!c) return;
    var d = JSON.parse(JSON.stringify(c)); d.id = uid('c'); d.x += larg(c) + 30; d.suites = [];
    if (d.type === 'depart') d.type = 'action'; // un seul départ par flux
    cartes[d.id] = d; ecrire(d); choisir(d.id);
  }
  function montrerMaq() { var t = document.querySelector('[data-telvue="maq"]'); if (t && t.getAttribute('aria-selected') !== 'true') t.click(); if ($('telZone').hidden) document.querySelector('[data-a="tel"]').click(); }
  function choisir(id) {
    var c0 = id && cartes[id];
    if (c0 && c0.maq && id !== sel && !$('telZone').hidden) { synchro = [courant, id]; rejouer(c0.maq.chemin || [c0.maq.sel]); }
    sel = id; panneau.dataset.id = '';
    if (room) room.presence({ tunnel: courant, carte: id }).catch(function () {});
    dessiner();
  }

  /* ---------- menu « + suite » ---------- */
  function ouvrirMenu(src, i, inserer, bouton) {
    var r = bouton.getBoundingClientRect(), rp = plan.parentNode.getBoundingClientRect();
    menu.innerHTML = '<p>' + (inserer ? 'Insérer une carte ici' : 'Ajouter la suite') + '</p>' +
      AJOUTABLES.filter(function (k) { return !inserer || !TYPES[k].fin; }).map(function (k) {
        return '<button type="button" data-creer="' + k + '" style="--c:' + TYPES[k].coul + '"><i>' + TYPES[k].ic + '</i>' + TYPES[k].nom + '</button>';
      }).join('') + (inserer ? '' : '<button type="button" data-relier style="--c:#5d6480"><i>↗</i>Relier à une carte existante</button>');
    menu.style.left = Math.max(8, Math.min(r.left - rp.left, rp.width - 250)) + 'px';
    menu.style.top = Math.max(8, Math.min(r.bottom - rp.top + 6, rp.height - 300)) + 'px';
    menu.dataset.source = src; menu.dataset.i = i; menu.dataset.inserer = inserer ? '1' : '';
    menu.hidden = false;
  }
  menu.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var src = cartes[menu.dataset.source], i = +menu.dataset.i, ins = !!menu.dataset.inserer;
    menu.hidden = true; if (!src) return;
    if (b.dataset.relier != null) { liaison = { source: src.id, i: i }; $('bandeau').hidden = false; dessiner(); return; }
    var c = nouvelleCarte(b.dataset.creer, portX(src, i) - L / 2, src.y + hauteur(src) + 90);
    src.suites = src.suites || [];
    if (ins) {
      c.suites[0] = src.suites[i];
      var vu = {}, bas = function (id) { var x = cartes[id]; if (!x || vu[id]) return; vu[id] = 1; x.y += HT + HS + 90; ecrire(x); (x.suites || []).forEach(bas); };
      bas(src.suites[i]);
    }
    src.suites[i] = c.id; cartes[c.id] = c;
    ecrire(src); ecrire(c); choisir(c.id);
    setTimeout(function () { var z = $('pTitre'); if (z) z.focus(); }, 30);
  });
  ecouteDoc('pointerdown', function (e) { if (!menu.hidden && !e.target.closest('.menu') && !e.target.closest('[data-plus],[data-inserer]')) menu.hidden = true; });
  ecouteDoc('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'd' || e.key === 'D') && sel && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) { e.preventDefault(); dupliquer(cartes[sel]); return; }
    if (e.key !== 'Escape') return;
    menu.hidden = true;
    if (liaison) { liaison = null; $('bandeau').hidden = true; dessiner(); }
    else if (!listeModifs.hidden) listeModifs.hidden = true;
    else if (!essai.hidden) essai.hidden = true;
  });

  /* ---------- plan : déplacer la vue, déplacer les cartes ---------- */
  plan.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || e.target.closest('button') || e.target.closest('.outils-plan') || e.target.closest('.vide div')) return;
    var n = e.target.closest('.carte');
    if (n) { var c = cartes[n.dataset.id]; geste = { n: n, c: c, x: e.clientX, y: e.clientY, cx: c.x, cy: c.y, bouge: false }; }
    else { geste = { x: e.clientX, y: e.clientY, vx: vue.x, vy: vue.y, bouge: false }; plan.classList.add('glisse'); }
    try { plan.setPointerCapture(e.pointerId); } catch (er) {}
  });
  plan.addEventListener('pointermove', function (e) {
    envoyerCurseur(e);
    if (!geste) return;
    var dx = e.clientX - geste.x, dy = e.clientY - geste.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) geste.bouge = true;
    if (!geste.bouge) return;
    if (geste.c) {
      geste.c.x = Math.round(geste.cx + dx / vue.z); geste.c.y = Math.round(geste.cy + dy / vue.z);
      geste.n.style.left = geste.c.x + 'px'; geste.n.style.top = geste.c.y + 'px'; liens();
    } else { vue.x = geste.vx + dx; vue.y = geste.vy + dy; appliquerVue(); }
  });
  function finGeste() {
    var g = geste; geste = null; dernierEnvoi = 0; plan.classList.remove('glisse'); if (!g) return;
    if (g.c && g.bouge) { ecrire(g.c); return; }
    if (g.c) {
      if (liaison) {
        var s = cartes[liaison.source];
        if (s && g.c.type !== 'depart' && g.c.id !== s.id) { s.suites = s.suites || []; s.suites[liaison.i] = g.c.id; ecrire(s); }
        liaison = null; $('bandeau').hidden = true; dessiner();
      } else choisir(g.c.id);
      return;
    }
    if (!g.bouge && sel) choisir(null);
  }
  plan.addEventListener('pointerup', finGeste);
  plan.addEventListener('pointercancel', finGeste);
  plan.addEventListener('click', function (e) {
    var b = e.target.closest('button'), n = e.target.closest('.carte'); if (!b || !n) return;
    var c = cartes[n.dataset.id];
    if (b.dataset.plus != null) ouvrirMenu(c.id, +b.dataset.plus, false, b);
    else if (b.dataset.inserer != null) ouvrirMenu(c.id, +b.dataset.inserer, true, b);
    else if (b.dataset.delier != null) { c.suites[+b.dataset.delier] = null; ecrire(c); dessiner(); }
    else if (b.dataset.dup != null) dupliquer(c);
  });
  plan.addEventListener('wheel', function (e) {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) zoomer(Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
    else { vue.x -= e.deltaX; vue.y -= e.deltaY; appliquerVue(); }
  }, { passive: false });

  /* ---------- barre ---------- */
  ecouteDoc('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b) return;
    var a = b.dataset.a;
    if (a === 'quitter') { if (ctx.onQuitter) ctx.onQuitter(); return; }
    if (a === 'moins') zoomer(1 / 1.2);
    if (a === 'plus') zoomer(1.2);
    if (a === 'centre') centrer();
    if (a === 'nouveau') creerTunnel();
    if (a === 'tester' && courant) tester();
    if (a === 'modifs' && courant) afficherModifs();
    if (a === 'tel') { var z = $('telZone'); z.hidden = !z.hidden; b.setAttribute('aria-pressed', z.hidden ? 'false' : 'true'); try { localStorage.setItem('atelier-tel', z.hidden ? '0' : '1'); } catch (er) {} }
    if (a === 'supprimer' && courant) {
      if (!b.classList.contains('confirme')) { b.classList.add('confirme'); b.textContent = 'Confirmer ?'; setTimeout(function () { b.classList.remove('confirme'); b.textContent = 'Supprimer le flux'; }, 3000); return; }
      b.classList.remove('confirme'); b.textContent = 'Supprimer le flux';
      var vieux = courant, ids = Object.keys(cartes);
      delete tunnels[vieux];
      if (db) { ids.forEach(function (cid) { db.doc('tunnels/' + vieux + '/cases/' + cid).delete().catch(function () {}); }); db.doc('tunnels/' + vieux).delete().catch(function () {}); }
      ouvrir(premierFlux());
    }
  });
  function creerTunnel() {
    var id = uid('t');
    tunnels[id] = { nom: 'Nouveau flux' };
    ouvrir(id, true);
    ecrireTunnel();
    var d = nouvelleCarte('depart', 0, 0); d.titre = ''; cartes[d.id] = d; ecrire(d);
    choisir(d.id); centrer();
    setTimeout(function () { $('nom').focus(); $('nom').select(); }, 30);
  }
  var nomEnCours = false;
  $('nom').addEventListener('input', function () { if (!courant) return; nomEnCours = true; tunnels[courant].nom = $('nom').value; clearTimeout(minuteurs.nom); minuteurs.nom = setTimeout(function () { ecrireTunnel(); nomEnCours = false; }, 500); });
  $('nom').addEventListener('change', dessiner);
  $('choix').addEventListener('change', function () { ouvrir($('choix').value); });

  function premierFlux() { return Object.keys(tunnels).sort(function (a, b) { return (tunnels[a].nom || '').localeCompare(tunnels[b].nom || '', 'fr', { numeric: true }); })[0] || null; }
  /* ---------- ouvrir un tunnel : abonnement à ses cartes ---------- */
  function ouvrir(id, nouveau) {
    if (desabo) { desabo(); desabo = null; }
    courant = id; cartes = {}; sel = null; sales = {}; chargeCartes = false;
    if (room) room.presence({ tunnel: courant, carte: null }).catch(function () {});
    dessiner();
    if (!id || !db) return;
    var premier = !nouveau;
    desabo = db.collection('tunnels/' + id + '/cases').onSnapshot(function (snap) {
      if (courant !== id) return;
      var recu = {};
      snap.docs.forEach(function (d) { recu[d.id] = JSON.parse(JSON.stringify(d.data())); });
      Object.keys(recu).forEach(function (cid) {
        if (sales[cid] || (geste && geste.c && geste.c.id === cid)) return; // on garde sa propre modification en cours
        cartes[cid] = recu[cid];
      });
      Object.keys(cartes).forEach(function (cid) { if (!recu[cid] && !sales[cid]) delete cartes[cid]; });
      chargeCartes = true;
      if (!geste) dessiner();
      if (premier && !snap.metadata.fromCache) { premier = false; centrer(); }
    }, function () { etat('Les cartes ne répondent pas. Vérifie ta connexion.', true); });
  }

  /* ---------- tester comme un SAV ---------- */
  var parcours = [];
  function tester() {
    var dep = Object.values(cartes).filter(function (c) { return c.type === 'depart'; })[0];
    if (!dep) return;
    parcours = []; essai.hidden = false; etape(dep);
  }
  function etape(c, depuis) {
    if (depuis) parcours.push(depuis);
    var T = TYPES[c.type];
    var h = '<div class="e-tete" style="--c:' + T.coul + '"><span><i>' + T.ic + '</i>' + T.nom + '</span><button type="button" class="x" data-e-fermer aria-label="Fermer">×</button></div>' +
      '<h4>' + esc(c.titre || '(sans titre)') + '</h4>' + (c.texte ? '<p class="e-info">' + esc(c.texte).replace(/\n/g, '<br>') + '</p>' : '');
    if (T.fin) {
      if (c.type === 'raz') {
        var p = resumeFin(c).split(' · ');
        h += '<dl class="e-fin"><dt>Élément</dt><dd>' + esc(p[0]) + '</dd><dt>Modifiable</dt><dd>' + esc(p[1]) + '</dd>' + (c.paie ? '<dt>Client paie</dt><dd>' + esc(c.paie) + '</dd>' : '') + (c.preuve ? '<dt>Preuve</dt><dd>' + esc(c.preuve) + '</dd>' : '') + '</dl>';
      }
      h += '<p class="e-ok">Fin du flux.</p>';
    } else {
      h += '<div class="e-rep">' + sorties(c).map(function (lib, i) {
        var ok = c.suites && c.suites[i] && cartes[c.suites[i]];
        return '<button type="button" data-e-suite="' + i + '"' + (ok ? '' : ' disabled') + '>' + esc(lib) + (ok ? '' : ' · suite à créer') + '</button>';
      }).join('') + '</div>';
    }
    h += '<div class="e-bas">' + (parcours.length ? '<button type="button" class="mini" data-e-retour>← Revenir</button>' : '') + '<button type="button" class="mini" data-e-voir>Voir cette carte</button></div>';
    essai.innerHTML = '<div class="e-carte" data-id="' + c.id + '">' + h + '</div>';
  }
  essai.addEventListener('click', function (e) {
    if (e.target === essai) { essai.hidden = true; return; }
    var b = e.target.closest('button'), n = essai.querySelector('.e-carte'); if (!b || !n) return;
    var c = cartes[n.dataset.id]; if (!c) { essai.hidden = true; return; }
    if (b.dataset.eFermer != null) essai.hidden = true;
    else if (b.dataset.eSuite != null) etape(cartes[c.suites[+b.dataset.eSuite]], c.id);
    else if (b.dataset.eRetour != null) etape(cartes[parcours.pop()]);
    else if (b.dataset.eVoir != null) {
      essai.hidden = true;
      var r = plan.getBoundingClientRect(); vue.x = r.width / 2 - (c.x + larg(c) / 2) * vue.z; vue.y = r.height / 4 - c.y * vue.z; appliquerVue(); choisir(c.id);
    }
  });

  /* ---------- aperçu téléphone ---------- */
  function depart() { return Object.values(cartes).filter(function (c) { return c.type === 'depart'; })[0]; }
  function rangEtape(id) { // profondeur depuis le départ
    var d = depart(); if (!d) return 0;
    var vu = {}, file = [[d.id, 0]];
    while (file.length) { var x = file.shift(), c = cartes[x[0]]; if (!c || vu[x[0]]) continue; vu[x[0]] = 1; if (x[0] === id) return x[1]; (c.suites || []).forEach(function (s) { if (s) file.push([s, x[1] + 1]); }); }
    return 0;
  }
  function rendreTel() {
    var ecran = $('telEcran'); if (!ecran) return;
    var c = (sel && cartes[sel]) || depart();
    var nomFlux = courant && tunnels[courant] ? tunnels[courant].nom || 'Flux' : 'Flux';
    if (!c) { ecran.innerHTML = '<div class="tl-vide">Crée un flux pour voir l\'écran ici.</div>'; return; }
    var T = TYPES[c.type], r = rangEtape(c.id);
    var h = '<div class="tl-statut"><span>9:41</span><span>●●● ▮</span></div>' +
      '<div class="tl-tete"><span class="tl-rond">‹</span><div><b>' + esc(nomFlux) + '</b><small>' + (T.fin ? 'Résultat' : 'Étape ' + (r + 1)) + '</small></div><span class="tl-rond">×</span></div>' +
      '<div class="tl-prog"><i style="width:' + (T.fin ? 100 : Math.min(92, 12 + r * 16)) + '%"></i></div><div class="tl-corps">';
    var titre = esc(c.titre || (c.type === 'question' ? 'Question à écrire' : c.type === 'action' ? 'Étape à décrire' : c.type === 'depart' ? 'Écran de départ' : 'Titre de la fin'));
    var aideTxt = c.texte ? '<details class="tl-aide"><summary><span>?</span>Comment faire</summary><p>' + esc(c.texte).replace(/\n/g, '<br>') + '</p></details>' : '';
    if (c.type === 'question') {
      h += '<p class="tl-sur">' + esc(T.nom) + '</p><h5>' + titre + '</h5><div class="tl-reps">' +
        sorties(c).map(function (lib, i) { return '<button type="button" data-tel-suite="' + i + '">' + esc(lib || '…') + '</button>'; }).join('') + '</div>' + aideTxt;
    } else if (c.type === 'action' || c.type === 'depart') {
      h += '<p class="tl-sur">' + (c.type === 'depart' ? 'Départ' : 'À faire') + '</p><h5>' + titre + '</h5>' + aideTxt +
        '<div class="tl-pied"><button type="button" class="tl-cta" data-tel-suite="0">' + (c.type === 'depart' ? 'Commencer' : 'Continuer') + '</button></div>';
    } else {
      var cls = c.type === 'raz' ? 'tl-raz' : c.type === 'sanssav' ? 'tl-ok' : 'tl-derog';
      var lib = c.type === 'raz' ? 'Ce qui sera recommandé' : c.type === 'sanssav' ? 'Conforme' : 'Dérogation';
      h += '<div class="tl-fin ' + cls + '"><span>' + lib + '</span><b>' + titre + '</b>' +
        (c.type === 'raz' ? '<small>' + esc(resumeFin(c)) + '</small>' : '') + '</div>';
      if (c.type === 'raz' && (c.paie || c.preuve)) h += '<div class="tl-puces">' + (c.paie ? '<span>Client paie · ' + esc(c.paie) + '</span>' : '<span class="g">Gratuit pour le client</span>') + (c.preuve ? '<span>À fournir · ' + esc(c.preuve) + '</span>' : '') + '</div>';
      if (c.texte) h += '<p class="tl-msg">' + esc(c.texte).replace(/\n/g, '<br>') + '</p>';
      h += '<div class="tl-pied"><button type="button" class="tl-cta">' + (c.type === 'raz' ? 'Ouvrir le SAV' : c.type === 'sanssav' ? 'Terminer' : 'Envoyer la demande') + '</button></div>';
    }
    ecran.innerHTML = h + '</div>';
  }
  $('telZone').addEventListener('click', function (e) {
    var b = e.target.closest('[data-telvue]');
    if (b) {
      var maq = b.dataset.telvue === 'maq';
      document.querySelectorAll('[data-telvue]').forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      $('telMaq').hidden = !maq; $('telCarte').hidden = maq; $('maqRecharger').hidden = !maq;
      $('telNote').textContent = maq ? 'La vraie maquette, utilisable telle quelle · commande de démo 0000000' : 'Aperçu approximatif de la carte sélectionnée · touche une réponse pour avancer';
      return;
    }
    if (e.target.closest('#maqRecharger')) chargerMaq();
  });
  $('telEcran').addEventListener('click', function (e) {
    var b = e.target.closest('[data-tel-suite]'); if (!b) return;
    var c = (sel && cartes[sel]) || depart(); if (!c) return;
    var s = c.suites && c.suites[+b.dataset.telSuite];
    if (s && cartes[s]) choisir(s);
    else { b.classList.add('tl-manque'); b.textContent = b.textContent.replace(/ · suite à créer$/, '') + ' · suite à créer'; }
  });
  try { if (localStorage.getItem('atelier-tel') === '0' || (localStorage.getItem('atelier-tel') == null && window.innerWidth < 1100)) { $('telZone').hidden = true; $('btnTel').setAttribute('aria-pressed', 'false'); } } catch (er) { if (window.innerWidth < 1100) $('telZone').hidden = true; }



  /* ---------- maquette intégrée dans la page (pas de fichier joint) ---------- */
  // La maquette est rangée dans la base (collection « maquette », en morceaux) : la page publiée ne contient que du code.
  // En ligne, la maquette répond à /maquette-sav/ ; en local (next dev), à /maquette-sav/index.html
  var adresseMaq = null
  function chargerMaq() {
    if (adresseMaq) { $('maqFrame').src = adresseMaq + '?v=' + Date.now(); return; }
    fetch('/maquette-sav/', { method: 'HEAD', cache: 'no-store' })
      .then(function (r) { adresseMaq = r.ok ? '/maquette-sav/' : '/maquette-sav/index.html'; })
      .catch(function () { adresseMaq = '/maquette-sav/index.html'; })
      .then(function () { var f = $('maqFrame'); if (f) f.src = adresseMaq + '?v=' + Date.now(); });
  }

  /* ---------- lien carte ⇄ maquette ---------- */
  var histoMaq = [], dernierClic = null, rejeu = false, jetonClic = 0;
  function cssEsc(v) { return String(v).replace(/["\\]/g, '\\$&'); }
  function selecteur(el, doc) { // sélecteur stable de l'élément cliqué
    var cible = el.closest('button, a, label, input, select, summary, [data-acf], [data-nav], [data-q], [data-dossier], [role="tab"], [id]') || el;
    if (cible.id) return '#' + cible.id;
    var sel = cible.tagName.toLowerCase();
    [].forEach.call(cible.attributes, function (a) { if (/^data-/.test(a.name) && a.value.length < 60) sel += '[' + a.name + '="' + cssEsc(a.value) + '"]'; });
    if (doc.querySelectorAll(sel).length > 1) {
      var anc = cible.parentElement && cible.parentElement.closest('[id]');
      if (anc) sel = '#' + anc.id + ' ' + sel;
      var lst = doc.querySelectorAll(sel);
      if (lst.length > 1) { var t = (cible.textContent || '').trim().slice(0, 40); sel += '::texte(' + t + ')'; }
    }
    return sel;
  }
  function trouver(doc, sel) {
    var m = sel.match(/^(.*)::texte\((.*)\)$/);
    if (!m) { try { return doc.querySelector(sel); } catch (e) { return null; } }
    var l; try { l = doc.querySelectorAll(m[1]); } catch (e) { return null; }
    return [].filter.call(l, function (x) { return (x.textContent || '').trim().slice(0, 40) === m[2]; })[0] || null;
  }
  function carteLiee(sel) {
    return Object.values(cartes).filter(function (c) { return c.maq && c.maq.sel === sel; })[0];
  }
  function rejouer(chemin) {
    var f = $('maqFrame'); rejeu = true;
    f.addEventListener('load', function suite() {
      f.removeEventListener('load', suite);
      var doc = f.contentDocument, i = 0;
      (function pas() {
        if (i >= chemin.length) { rejeu = false; return; }
        var etape = chemin[i++], v = etape.match(/^=([^=]+)=(.*)$/);
        if (v) { var inp = doc && doc.getElementById(v[1]); if (inp) { inp.value = v[2]; inp.dispatchEvent(new Event('input', { bubbles: true })); } }
        else { var el = doc && trouver(doc, etape); if (el) el.click(); }
        setTimeout(pas, 140);
      })();
    });
    chargerMaq();
  }
  /* ---------- synchro maquette → cartes ---------- */
  // Associe l'écran affiché dans la maquette à une carte des flux transcrits (ids du générateur).
  var Q_VISION = { ordo: 'al_02', fronto: 'al_04', origine: 'al_05', trait: 'al_07', traitBe: 'al_08', pdm: 'al_11', vue: 'al_14', essai: 'al_17', examen: 'al_22' };
  var MOTIFS_CASSE = { 'inad-monture': ['se_06', 'se_12', 'se_21'], 'casse-monture-ajust': ['se_07', 'se_13', 'se_22'], 'casse-monture-client': ['se_08', 'se_14', 'se_23'], 'defaut-monture': ['se_09', 'se_15', 'se_24'] };
  var VERRES_CASSE = { 'verres-casses-ajust': 'se_18', 'verres-chauffe-ajust': 'se_19', 'verres-rayes-ajust': 'se_20' };
  var dernierMotif = null, synchro = null;
  function visible(el) { return !!el && !el.hidden && !el.closest('[hidden]'); }
  function reperer(doc) {
    var fl = doc.getElementById('aFlow');
    if (fl && fl.classList.contains('on')) {
      var cause = doc.getElementById('ficheCause'), lib = cause && cause.querySelector('.cause-lib');
      if (lib) {
        var t = lib.textContent, tout = cause.textContent;
        if (/Conforme/.test(t)) return ['tunnel_voitmal', 'al_16'];
        if (/Aucune erreur/.test(t)) return ['tunnel_voitmal', 'al_20'];
        if (/RAZ justifiée/.test(t)) return ['tunnel_voitmal', /Erreur examen de vue/.test(tout) ? 'al_23' : /Erreur ordonnance/.test(tout) ? 'al_24' : 'al_19'];
      }
      var cur = doc.querySelector('#ficheEtapes .t-encours');
      if (!cur) return null;
      var po = cur.querySelector('.photo-oblig');
      if (po) return ['tunnel_voitmal', /verre/i.test(po.textContent) && !/fronto/i.test(po.textContent) ? 'al_10' : 'al_06'];
      var qs = [].map.call(cur.querySelectorAll('button[data-q]'), function (b) { return b.dataset.q; });
      var q = qs[qs.length - 1];
      if (q === 'examen' && !cur.querySelector('button[data-q="examen"][data-v="idem"]')) return ['tunnel_voitmal', 'al_21'];
      if (q && Q_VISION[q]) return ['tunnel_voitmal', Q_VISION[q]];
      if (cur.querySelector('input[data-q="galbe"]')) return ['tunnel_voitmal', 'al_13'];
      return null;
    }
    var e2 = doc.getElementById('savEtape2');
    if (visible(e2) && e2.classList.contains('mode-mat')) {
      var coches = [].map.call(doc.querySelectorAll('#listeMotifs input:checked'), function (c) { return c.id.replace('motif-', ''); });
      var m = coches.indexOf(dernierMotif) >= 0 ? dernierMotif : coches[coches.length - 1];
      if (!m) return ['tunnel_casse', 'se_02'];
      if (VERRES_CASSE[m]) return ['tunnel_casse', VERRES_CASSE[m]];
      var bloc = doc.querySelector('#resumeRaz .essai-bloc'), etapeEssai = bloc ? (bloc.classList.contains('ok') ? 1 : bloc.classList.contains('ko') ? 2 : 0) : 0;
      if (m === 'saisie-monture') {
        var choix = doc.querySelector('#motif-saisie-monture') && doc.querySelector('#motif-saisie-monture').closest('li').querySelector('.seg-btns button[aria-pressed="true"]');
        if (!choix) return ['tunnel_casse', 'se_05'];
        var taille = choix.dataset.i === '2';
        return ['tunnel_casse', (taille ? ['se_10', 'se_16', 'se_25'] : ['se_11', 'se_17', 'se_26'])[etapeEssai]];
      }
      if (MOTIFS_CASSE[m]) return ['tunnel_casse', MOTIFS_CASSE[m][etapeEssai]];
      return ['tunnel_casse', 'se_02'];
    }
    if (doc.getElementById('ouvrirFlow') && visible(doc.getElementById('ouvrirFlow'))) return ['tunnel_voitmal', 'al_01'];
    return null;
  }
  function allumer(cid) {
    monde.querySelectorAll('.carte.synchro').forEach(function (n) { n.classList.remove('synchro'); });
    var n = cid && monde.querySelector('.carte[data-id="' + cid + '"]'), c = cid && cartes[cid];
    if (!n || !c) return;
    n.classList.add('synchro');
    var r = plan.getBoundingClientRect(), x = vue.x + c.x * vue.z, y = vue.y + c.y * vue.z;
    if (x < 20 || y < 20 || x + larg(c) * vue.z > r.width - 20 || y + hauteur(c) * vue.z > r.height - 20) {
      vue.x = r.width / 2 - (c.x + larg(c) / 2) * vue.z; vue.y = r.height / 3 - c.y * vue.z; appliquerVue();
    }
  }
  function synchroniser() {
    var f = $('maqFrame'), doc;
    try { doc = f.contentDocument; } catch (e) { return; }
    if (!doc) return;
    var r = reperer(doc);
    if (!r) { synchro = null; allumer(null); return; }
    synchro = r;
    if (tunnels[r[0]] && courant !== r[0]) { ouvrir(r[0]); return; } // la carte s'allumera au chargement du flux
    allumer(r[1]);
  }
  $('maqFrame').addEventListener('load', function () {
    var doc; try { doc = this.contentDocument; } catch (e) { return; }
    if (!doc) return;
    histoMaq = [];
    doc.addEventListener('click', function (e) {
      var cb = e.target.closest && e.target.closest('#listeMotifs input');
      if (cb) dernierMotif = cb.id.replace('motif-', '');
      var sel = selecteur(e.target, doc);
      // un champ de saisie rempli avant le clic : on mémorise sa valeur dans le chemin
      [].forEach.call(doc.querySelectorAll('input[type="text"][id], input[type="tel"][id], input:not([type])[id]'), function (inp) {
        if (inp.value && histoMaq.indexOf('=' + inp.id + '=' + inp.value) < 0) histoMaq.push('=' + inp.id + '=' + inp.value);
      });
      histoMaq.push(sel);
      var nl = e.target.closest('button, a, label, [data-acf]') || e.target, lib = (nl.innerText || nl.textContent || '').split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean).join(' · ').slice(0, 60);
      dernierClic = { sel: sel, chemin: histoMaq.slice(), libelle: lib };
      if (sel && panneau.querySelector('#lienMaq')) remplirLienMaq();
      var jeton = ++jetonClic;
      if (rejeu) return;
      var lie = carteLiee(sel);
      if (lie) { synchro = [courant, lie.id]; allumer(lie.id); return; }
      setTimeout(function () { if (jeton === jetonClic) synchroniser(); }, 80);
    }, true);
    doc.addEventListener('change', function () { var j = jetonClic; setTimeout(function () { if (j === jetonClic) synchroniser(); }, 80); }, true);
  });

  /* ---------- en direct : curseurs et cartes déplacées par les autres ---------- */
  var dernierEnvoi = 0, calqueCurseurs = document.createElement('div');
  calqueCurseurs.className = 'curseurs'; monde.appendChild(calqueCurseurs);
  function envoyerCurseur(e) {
    if (!room || !courant) return;
    var now = Date.now(); if (now - dernierEnvoi < 60) return; dernierEnvoi = now;
    var r = plan.getBoundingClientRect();
    var pos = { x: Math.round((e.clientX - r.left - vue.x) / vue.z), y: Math.round((e.clientY - r.top - vue.y) / vue.z) };
    var drag = geste && geste.c && geste.bouge ? { id: geste.c.id, x: geste.c.x, y: geste.c.y } : null;
    room.presence({ tunnel: courant, carte: sel, curseur: pos, drag: drag }).catch(function () {});
  }
  plan.addEventListener('pointerleave', function () { if (room && courant) room.presence({ tunnel: courant, carte: sel, curseur: null, drag: null }).catch(function () {}); });
  function majDirect() {
    var h = '', bouge = false;
    pairs.forEach(function (p) {
      if (p.isMe || p.kind === 'agent' || !p.presence || p.presence.tunnel !== courant) return;
      var cu = p.presence.curseur, col = couleurPers(p);
      if (cu) h += '<div class="curseur" style="left:' + cu.x + 'px;top:' + cu.y + 'px;--pc:' + col + '"><svg width="18" height="20" viewBox="0 0 18 20" aria-hidden="true"><path d="M1 1l15 8-7 2-3 7z" fill="' + col + '" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg><span>' + esc(nomPers(p)) + '</span></div>';
      var d = p.presence.drag, c = d && cartes[d.id];
      if (c && !sales[d.id] && (c.x !== d.x || c.y !== d.y)) { c.x = d.x; c.y = d.y; var n = monde.querySelector('.carte[data-id="' + d.id + '"]'); if (n) { n.style.left = c.x + 'px'; n.style.top = c.y + 'px'; } bouge = true; }
    });
    calqueCurseurs.innerHTML = h;
    monde.appendChild(calqueCurseurs);
    if (bouge) liens();
  }

  /* ---------- qui est là ---------- */
  function majPresents() {
    var ids = pairs.map(function (p) { return p.by; }).filter(Boolean);
    var fin = function () {
      var vus = {}, h = '';
      pairs.forEach(function (p) {
        var k = p.by || p.peer; if (vus[k] || p.kind === 'agent') return; vus[k] = 1;
        h += '<span class="pastille" style="--c:' + couleurPers(p) + '" title="' + esc(nomPers(p)) + (p.isMe ? ' (toi)' : '') + '">' + esc(p.isMe ? 'Toi' : nomPers(p)) + '</span>';
      });
      $('presents').innerHTML = h ? '<span class="lib">Ici :</span>' + h : '';
      if (!geste) dessiner();
    };
    if (user && ids.length) user.profiles(ids).then(function (ps) { ids.forEach(function (id) { var n = ps[id] && ps[id].name; if (n) noms[id] = n.split(' ')[0]; }); fin(); }).catch(fin);
    else fin();
  }

  chargerMaq();
  /* ---------- démarrage ---------- */
  appliquerVue(); dessiner();
  var attente = setTimeout(function () { etat('L\'atelier ne répond pas encore. Vérifie ta connexion.', true); }, 10000);
  claude.use('db').then(function (d) {
    clearTimeout(attente);
    if (!d) { etat('La base de l\'atelier ne répond pas.', true); return; }
    db = d; etat('Connexion…');
    var premier = true;
    db.collection('tunnels').onSnapshot(function (snap) {
      var recu = {};
      snap.docs.forEach(function (doc) { recu[doc.id] = JSON.parse(JSON.stringify(doc.data())); });
      Object.keys(recu).forEach(function (id) { if (!(id === courant && nomEnCours)) tunnels[id] = recu[id]; });
      Object.keys(tunnels).forEach(function (id) { if (!recu[id] && id !== courant) delete tunnels[id]; });
      if (!snap.metadata.fromCache) etat(Object.keys(tunnels).length ? 'Enregistré en ligne' : 'Aucun tunnel pour l\'instant');
      if (premier && !snap.metadata.fromCache) { premier = false; if (!courant) { ouvrir(premierFlux()); return; } }
      if (courant && !recu[courant] && !snap.metadata.fromCache && !Object.keys(sales).length) { ouvrir(premierFlux()); return; }
      dessiner();
    }, function () { etat('Les tunnels ne répondent pas. Vérifie ta connexion.', true); });
  });
  claude.use('user').then(function (u) { user = u; if (pairs.length) majPresents(); });
  claude.use('room').then(function (r) {
    if (!r) return;
    room = r;
    room.presence({ tunnel: courant, carte: sel }).catch(function () {});
    var signature = '';
    room.onPeers(function (ch) {
      pairs = ch.peers.slice();
      var sig = pairs.map(function (p) { return (p.by || p.peer) + ':' + (p.presence && p.presence.tunnel) + ':' + (p.presence && p.presence.carte); }).sort().join('|');
      if (sig !== signature) { signature = sig; majPresents(); }
      majDirect();
    });
  });

  return function demonter() {
    ecoutes.forEach(function (e) { document.removeEventListener(e[0], e[1], e[2]) })
    racine.innerHTML = ''
  }
}
