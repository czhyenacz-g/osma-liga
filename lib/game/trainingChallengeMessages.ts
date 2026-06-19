// Public-facing copy for the homepage/lobby "training challenge" callout.
// Never mention bot/AI/robot here — the fictional club is the public framing.
export const trainingChallengeMessages = [
  '{clubName} hledají soupeře pro tréninkový zápas.',
  '{clubName} mají volné hřiště a čekají, kdo si troufne nastoupit.',
  '{clubName} vyvěsili výzvu na rychlý zápas.',
  '{clubName} shánějí soupeře, než výbor zavře kabiny.',
  '{clubName} už jsou na place. Chybí jen někdo proti nim.',
  '{clubName} hledají tým, který se nebojí okresního tempa.',
  '{clubName} svolávají přátelák. Míč je nafouknutý, rozhodčí snad dorazí.',
  '{clubName} mají tréninkový zápas bez soupeře. Zatím.',
  '{clubName} čekají u lajny. Kdo klikne první, jde hrát.',
  '{clubName} mají připravené dresy a podezřele dobrou náladu.',
];

// Safe fallback when the club name's grammatical number is unclear (singular/plural).
export const trainingChallengeFallbackMessage = 'Klub {clubName} hledá soupeře pro tréninkový zápas.';

export function pickTrainingChallengeMessage(clubName: string): string {
  const template = trainingChallengeMessages[Math.floor(Math.random() * trainingChallengeMessages.length)];
  return template.replace('{clubName}', clubName);
}
