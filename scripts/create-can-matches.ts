/**
 * Script pour créer 2 matchs de la CAN 2026 avec les joueurs
 * À exécuter avec: npx tsx scripts/create-can-matches.ts
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';

// Charger les variables d'environnement
config({ path: '.env.local' });

const MatchSchema = new mongoose.Schema({
  teamA: { type: String, required: true },
  teamB: { type: String, required: true },
  matchDate: { type: Date, required: true },
  players: [{
    name: { type: String, required: true },
    team: { type: String, enum: ['A', 'B'], required: true }
  }],
  finalScore: {
    teamA: Number,
    teamB: Number,
    bestScorer: String
  },
  isFinished: { type: Boolean, default: false }
}, { timestamps: true });

const Match = mongoose.models.Match || mongoose.model('Match', MatchSchema);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prono-nexa';

async function createCANMatches() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Match 1: Maroc vs Sénégal
    const match1 = await Match.create({
      teamA: 'Maroc',
      teamB: 'Sénégal',
      matchDate: new Date('2026-01-15T20:00:00Z'), // 15 janvier 2026 à 20h UTC
      players: [
        // Joueurs Maroc
        { name: 'Yassine Bounou', team: 'A' },
        { name: 'Achraf Hakimi', team: 'A' },
        { name: 'Nayef Aguerd', team: 'A' },
        { name: 'Romain Saïss', team: 'A' },
        { name: 'Sofyan Amrabat', team: 'A' },
        { name: 'Azzedine Ounahi', team: 'A' },
        { name: 'Hakim Ziyech', team: 'A' },
        { name: 'Youssef En-Nesyri', team: 'A' },
        { name: 'Sofiane Boufal', team: 'A' },
        { name: 'Amine Harit', team: 'A' },
        { name: 'Selim Amallah', team: 'A' },
        // Joueurs Sénégal
        { name: 'Édouard Mendy', team: 'B' },
        { name: 'Kalidou Koulibaly', team: 'B' },
        { name: 'Abdou Diallo', team: 'B' },
        { name: 'Youssouf Sabaly', team: 'B' },
        { name: 'Idrissa Gueye', team: 'B' },
        { name: 'Pape Matar Sarr', team: 'B' },
        { name: 'Ismaïla Sarr', team: 'B' },
        { name: 'Sadio Mané', team: 'B' },
        { name: 'Boulaye Dia', team: 'B' },
        { name: 'Iliman Ndiaye', team: 'B' },
        { name: 'Nicolas Jackson', team: 'B' },
      ],
      isFinished: false,
    });

    console.log('✅ Match 1 créé:', match1.teamA, 'vs', match1.teamB);

    // Match 2: Côte d\'Ivoire vs Nigeria
    const match2 = await Match.create({
      teamA: 'Côte d\'Ivoire',
      teamB: 'Nigeria',
      matchDate: new Date('2026-01-18T17:00:00Z'), // 18 janvier 2026 à 17h UTC
      players: [
        // Joueurs Côte d'Ivoire
        { name: 'Yahia Fofana', team: 'A' },
        { name: 'Serge Aurier', team: 'A' },
        { name: 'Willy Boly', team: 'A' },
        { name: 'Evan Ndicka', team: 'A' },
        { name: 'Ghislain Konan', team: 'A' },
        { name: 'Franck Kessié', team: 'A' },
        { name: 'Seko Fofana', team: 'A' },
        { name: 'Max Gradel', team: 'A' },
        { name: 'Sébastien Haller', team: 'A' },
        { name: 'Nicolas Pépé', team: 'A' },
        { name: 'Simon Adingra', team: 'A' },
        // Joueurs Nigeria
        { name: 'Stanley Nwabali', team: 'B' },
        { name: 'William Troost-Ekong', team: 'B' },
        { name: 'Calvin Bassey', team: 'B' },
        { name: 'Ola Aina', team: 'B' },
        { name: 'Zaidu Sanusi', team: 'B' },
        { name: 'Alex Iwobi', team: 'B' },
        { name: 'Frank Onyeka', team: 'B' },
        { name: 'Ademola Lookman', team: 'B' },
        { name: 'Victor Osimhen', team: 'B' },
        { name: 'Moses Simon', team: 'B' },
        { name: 'Kelechi Iheanacho', team: 'B' },
      ],
      isFinished: false,
    });

    console.log('✅ Match 2 créé:', match2.teamA, 'vs', match2.teamB);

    console.log('\n🎉 Les 2 matchs de la CAN 2026 ont été créés avec succès!');
    console.log('\nMatchs créés:');
    console.log(`1. ${match1.teamA} vs ${match1.teamB} - ${match1.matchDate.toLocaleString('fr-FR')}`);
    console.log(`2. ${match2.teamA} vs ${match2.teamB} - ${match2.matchDate.toLocaleString('fr-FR')}`);

    await mongoose.disconnect();
    console.log('\n✅ Déconnecté de MongoDB');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createCANMatches();
