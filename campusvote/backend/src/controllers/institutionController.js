const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getInstitutions(req, res) {
  try {
    const institutions = await prisma.institution.findMany({
      select: { id: true, name: true, emailSuffix: true, logoUrl: true },
      orderBy: { name: 'asc' },
    });
    res.json(institutions);
  } catch (err) {
    console.error('getInstitutions error:', err);
    res.status(500).json({ error: true, message: 'Failed to fetch institutions', code: 'INTERNAL_ERROR' });
  }
}

module.exports = { getInstitutions };
