#!/usr/bin/env node
/**
 * Configure .env.local pour les collègues :
 * 1) vercel env pull (recommandé, si Vercel CLI + accès projet)
 * 2) sinon copie .env.example → .env.local + instructions
 */
import { copyFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envLocal = join(root, '.env.local')
const envExample = join(root, '.env.example')

function hasVercelCli() {
  try {
    execSync('vercel --version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function pullFromVercel() {
  console.log('⏳ Récupération des variables depuis Vercel (vercel env pull)…')
  execSync('vercel env pull .env.local --yes', { cwd: root, stdio: 'inherit' })
}

function copyExample() {
  if (!existsSync(envExample)) {
    console.error('❌ Fichier .env.example introuvable.')
    process.exit(1)
  }
  copyFileSync(envExample, envLocal)
  console.log('✅ .env.local créé à partir de .env.example')
}

console.log('\n🔧 Configuration environnement — lpt-formation\n')

if (existsSync(envLocal)) {
  console.log('ℹ️  .env.local existe déjà — rien à faire.')
  console.log('   (Supprime-le puis relance npm run setup pour régénérer.)\n')
  process.exit(0)
}

if (hasVercelCli()) {
  try {
    pullFromVercel()
    console.log('\n✅ Variables téléchargées depuis Vercel → .env.local')
    console.log('   Lance : npm install && npm run dev\n')
    process.exit(0)
  } catch {
    console.log('\n⚠️  vercel env pull a échoué (pas connecté ou pas d’accès au projet).\n')
  }
} else {
  console.log('ℹ️  Vercel CLI non installée → copie manuelle.\n')
  console.log('   Pour l’auto : npm i -g vercel && vercel login && vercel link\n')
}

copyExample()
console.log(`
⚠️  .env.local contient des valeurs factices.

Option A — Automatique (recommandé pour l’équipe) :
  1. Demander l’accès au projet Vercel (à un admin)
  2. npm i -g vercel
  3. vercel login
  4. vercel link   (dans ce dossier)
  5. npm run setup

Option B — Sans Vercel :
  Demander le fichier .env.local (ou les 4 valeurs) à un collègue via canal privé (Slack / 1Password),
  puis coller dans .env.local

Ensuite : npm install && npm run dev
`)
