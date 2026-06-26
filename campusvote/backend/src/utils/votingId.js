function getInstitutionCode(name) {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .filter((w) => w.length > 2)
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function generateVotingId(institutionName) {
  const code = getInstitutionCode(institutionName);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 8; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CV-${code}-${random}`;
}

module.exports = { generateVotingId };
