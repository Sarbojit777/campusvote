const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const prisma = new PrismaClient();

function getEventStatus(event) {
  const now = new Date();
  if (event.resultsPublished) return 'results_published';
  if (now < event.startsAt) return 'upcoming';
  if (now >= event.startsAt && now <= event.endsAt) return 'active';
  return 'closed';
}

async function listEvents(req, res) {
  try {
    const { institutionId, isSuperAdmin } = req.admin;
    const where = isSuperAdmin ? {} : { institutionId };

    const events = await prisma.votingEvent.findMany({
      where,
      include: {
        _count: { select: { votes: true, candidates: true } },
        institution: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      status: getEventStatus(e),
      resultsPublished: e.resultsPublished,
      voteCount: e._count.votes,
      candidateCount: e._count.candidates,
      institutionName: e.institution.name,
    }));

    res.json(result);
  } catch (err) {
    console.error('admin listEvents error:', err);
    res.status(500).json({ error: true, message: 'Failed to fetch events', code: 'INTERNAL_ERROR' });
  }
}

async function createEvent(req, res) {
  try {
    const { sub: adminId, institutionId, isSuperAdmin } = req.admin;
    const { title, description, startsAt, endsAt, institutionId: bodyInstitutionId } = req.body;

    if (!title || !startsAt || !endsAt) {
      return res.status(400).json({ error: true, message: 'title, startsAt, endsAt are required', code: 'MISSING_FIELDS' });
    }

    const targetInstitutionId = isSuperAdmin ? bodyInstitutionId : institutionId;
    if (!targetInstitutionId) {
      return res.status(400).json({ error: true, message: 'institutionId is required', code: 'MISSING_FIELDS' });
    }

    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (end <= start) {
      return res.status(400).json({ error: true, message: 'endsAt must be after startsAt', code: 'INVALID_DATES' });
    }

    const event = await prisma.votingEvent.create({
      data: { title, description, startsAt: start, endsAt: end, institutionId: targetInstitutionId, createdBy: adminId },
    });

    res.status(201).json(event);
  } catch (err) {
    console.error('admin createEvent error:', err);
    res.status(500).json({ error: true, message: 'Failed to create event', code: 'INTERNAL_ERROR' });
  }
}

async function updateEvent(req, res) {
  try {
    const { institutionId, isSuperAdmin } = req.admin;
    const { eventId } = req.params;
    const { title, description, startsAt, endsAt } = req.body;

    const event = await prisma.votingEvent.findUnique({ where: { id: eventId } });
    if (!event || (!isSuperAdmin && event.institutionId !== institutionId)) {
      return res.status(404).json({ error: true, message: 'Event not found', code: 'NOT_FOUND' });
    }

    if (new Date() >= event.startsAt) {
      return res.status(400).json({ error: true, message: 'Cannot edit an event that has already started', code: 'EVENT_STARTED' });
    }

    const updated = await prisma.votingEvent.update({
      where: { id: eventId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(startsAt && { startsAt: new Date(startsAt) }),
        ...(endsAt && { endsAt: new Date(endsAt) }),
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('admin updateEvent error:', err);
    res.status(500).json({ error: true, message: 'Failed to update event', code: 'INTERNAL_ERROR' });
  }
}

async function deleteEvent(req, res) {
  try {
    const { institutionId, isSuperAdmin } = req.admin;
    const { eventId } = req.params;

    const event = await prisma.votingEvent.findUnique({
      where: { id: eventId },
      include: { _count: { select: { votes: true } } },
    });

    if (!event || (!isSuperAdmin && event.institutionId !== institutionId)) {
      return res.status(404).json({ error: true, message: 'Event not found', code: 'NOT_FOUND' });
    }

    if (event._count.votes > 0) {
      return res.status(400).json({ error: true, message: 'Cannot delete event with existing votes', code: 'HAS_VOTES' });
    }

    await prisma.votingEvent.delete({ where: { id: eventId } });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('admin deleteEvent error:', err);
    res.status(500).json({ error: true, message: 'Failed to delete event', code: 'INTERNAL_ERROR' });
  }
}

async function addCandidate(req, res) {
  try {
    const { institutionId, isSuperAdmin } = req.admin;
    const { eventId } = req.params;
    const { name, bio, position } = req.body;

    if (!name || !position) {
      return res.status(400).json({ error: true, message: 'name and position are required', code: 'MISSING_FIELDS' });
    }

    const event = await prisma.votingEvent.findUnique({ where: { id: eventId } });
    if (!event || (!isSuperAdmin && event.institutionId !== institutionId)) {
      return res.status(404).json({ error: true, message: 'Event not found', code: 'NOT_FOUND' });
    }

    let photoUrl = null;
    if (req.file) {
      photoUrl = `/uploads/photos/${req.file.filename}`;
    }

    const candidate = await prisma.candidate.create({
      data: { name, bio, position, photoUrl, votingEventId: eventId },
    });

    res.status(201).json(candidate);
  } catch (err) {
    console.error('admin addCandidate error:', err);
    res.status(500).json({ error: true, message: 'Failed to add candidate', code: 'INTERNAL_ERROR' });
  }
}

async function deleteCandidate(req, res) {
  try {
    const { institutionId, isSuperAdmin } = req.admin;
    const { eventId, candidateId } = req.params;

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { votingEvent: true },
    });

    if (!candidate || candidate.votingEventId !== eventId ||
        (!isSuperAdmin && candidate.votingEvent.institutionId !== institutionId)) {
      return res.status(404).json({ error: true, message: 'Candidate not found', code: 'NOT_FOUND' });
    }

    if (candidate.photoUrl) {
      const filePath = path.join(process.cwd(), candidate.photoUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.candidate.delete({ where: { id: candidateId } });
    res.json({ message: 'Candidate deleted' });
  } catch (err) {
    console.error('admin deleteCandidate error:', err);
    res.status(500).json({ error: true, message: 'Failed to delete candidate', code: 'INTERNAL_ERROR' });
  }
}

async function publishResults(req, res) {
  try {
    const { institutionId, isSuperAdmin } = req.admin;
    const { eventId } = req.params;

    const event = await prisma.votingEvent.findUnique({
      where: { id: eventId },
      include: { candidates: true },
    });

    if (!event || (!isSuperAdmin && event.institutionId !== institutionId)) {
      return res.status(404).json({ error: true, message: 'Event not found', code: 'NOT_FOUND' });
    }

    if (event.resultsPublished) {
      return res.status(400).json({ error: true, message: 'Results already published', code: 'ALREADY_PUBLISHED' });
    }

    if (new Date() <= event.endsAt) {
      return res.status(400).json({ error: true, message: 'Event has not ended yet', code: 'EVENT_NOT_ENDED' });
    }

    await prisma.votingEvent.update({
      where: { id: eventId },
      data: { resultsPublished: true },
    });

    res.json({ message: 'Results published' });
  } catch (err) {
    console.error('admin publishResults error:', err);
    res.status(500).json({ error: true, message: 'Failed to publish results', code: 'INTERNAL_ERROR' });
  }
}

async function getEventStats(req, res) {
  try {
    const { institutionId, isSuperAdmin } = req.admin;
    const { eventId } = req.params;

    const event = await prisma.votingEvent.findUnique({
      where: { id: eventId },
      include: { candidates: true, _count: { select: { votes: true } } },
    });

    if (!event || (!isSuperAdmin && event.institutionId !== institutionId)) {
      return res.status(404).json({ error: true, message: 'Event not found', code: 'NOT_FOUND' });
    }

    const voteCounts = await prisma.vote.groupBy({
      by: ['candidateId'],
      where: { votingEventId: eventId },
      _count: { candidateId: true },
    });

    const countMap = {};
    voteCounts.forEach((v) => (countMap[v.candidateId] = v._count.candidateId));
    const totalVotes = event._count.votes;

    const candidateStats = event.candidates.map((c) => ({
      id: c.id,
      name: c.name,
      position: c.position,
      photoUrl: c.photoUrl,
      voteCount: countMap[c.id] || 0,
      votePercent: totalVotes > 0 ? Math.round(((countMap[c.id] || 0) / totalVotes) * 100) : 0,
    }));

    const institutionUserCount = await prisma.user.count({ where: { institutionId: event.institutionId } });

    res.json({
      eventId,
      title: event.title,
      totalVotes,
      totalUsers: institutionUserCount,
      participationPercent: institutionUserCount > 0 ? Math.round((totalVotes / institutionUserCount) * 100) : 0,
      candidates: candidateStats,
    });
  } catch (err) {
    console.error('admin getEventStats error:', err);
    res.status(500).json({ error: true, message: 'Failed to fetch stats', code: 'INTERNAL_ERROR' });
  }
}

module.exports = { listEvents, createEvent, updateEvent, deleteEvent, addCandidate, deleteCandidate, publishResults, getEventStats };
