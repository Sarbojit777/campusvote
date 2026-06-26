const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getEventStatus(event) {
  const now = new Date();
  if (event.resultsPublished) return 'results_published';
  if (now < event.startsAt) return 'upcoming';
  if (now >= event.startsAt && now <= event.endsAt) return 'active';
  return 'closed';
}

async function getEvents(req, res) {
  try {
    const { sub: userId, institutionId } = req.user;

    const events = await prisma.votingEvent.findMany({
      where: { institutionId },
      include: {
        candidates: true,
        votes: { where: { userId }, select: { candidateId: true } },
        _count: { select: { votes: true } },
      },
      orderBy: { startsAt: 'desc' },
    });

    const totalUsers = await prisma.user.count({ where: { institutionId } });

    const result = events.map((event) => {
      const status = getEventStatus(event);
      const userVote = event.votes[0] || null;
      const totalVotes = event._count.votes;
      const participation = totalUsers > 0 ? Math.round((totalVotes / totalUsers) * 100) : 0;

      const base = {
        id: event.id,
        title: event.title,
        description: event.description,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        status,
        hasVoted: !!userVote,
        votedCandidateId: userVote?.candidateId || null,
        totalVotes,
        participationPercent: participation,
        candidateCount: event.candidates.length,
      };

      if (status === 'results_published') {
        const voteCounts = {};
        event.candidates.forEach((c) => (voteCounts[c.id] = 0));
        // We need actual vote data for results — fetch separately
      }

      return base;
    });

    res.json(result);
  } catch (err) {
    console.error('getEvents error:', err);
    res.status(500).json({ error: true, message: 'Failed to fetch events', code: 'INTERNAL_ERROR' });
  }
}

async function getEventById(req, res) {
  try {
    const { sub: userId, institutionId } = req.user;
    const { eventId } = req.params;

    const event = await prisma.votingEvent.findUnique({
      where: { id: eventId },
      include: {
        candidates: true,
        votes: { where: { userId }, select: { candidateId: true } },
        _count: { select: { votes: true } },
      },
    });

    if (!event || event.institutionId !== institutionId) {
      return res.status(404).json({ error: true, message: 'Event not found', code: 'NOT_FOUND' });
    }

    const status = getEventStatus(event);
    const userVote = event.votes[0] || null;
    const totalVotes = event._count.votes;

    let candidatesData = event.candidates.map((c) => ({
      id: c.id,
      name: c.name,
      bio: c.bio,
      position: c.position,
      photoUrl: c.photoUrl,
    }));

    let winnerData = null;
    if (status === 'results_published') {
      const voteCounts = await prisma.vote.groupBy({
        by: ['candidateId'],
        where: { votingEventId: eventId },
        _count: { candidateId: true },
      });

      const countMap = {};
      voteCounts.forEach((v) => (countMap[v.candidateId] = v._count.candidateId));
      const maxVotes = Math.max(0, ...Object.values(countMap));

      candidatesData = candidatesData.map((c) => ({
        ...c,
        voteCount: countMap[c.id] || 0,
        votePercent: totalVotes > 0 ? Math.round(((countMap[c.id] || 0) / totalVotes) * 100) : 0,
        isWinner: (countMap[c.id] || 0) === maxVotes && maxVotes > 0,
      }));

      const winner = candidatesData.find((c) => c.isWinner);
      winnerData = winner
        ? { name: winner.name, photoUrl: winner.photoUrl, voteCount: winner.voteCount, votePercent: winner.votePercent }
        : null;
    }

    res.json({
      id: event.id,
      title: event.title,
      description: event.description,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      status,
      hasVoted: !!userVote,
      votedCandidateId: userVote?.candidateId || null,
      totalVotes,
      candidates: candidatesData,
      winner: winnerData,
    });
  } catch (err) {
    console.error('getEventById error:', err);
    res.status(500).json({ error: true, message: 'Failed to fetch event', code: 'INTERNAL_ERROR' });
  }
}

async function castVote(req, res) {
  try {
    const { sub: userId, institutionId } = req.user;
    const { eventId } = req.params;
    const { candidateId } = req.body;

    if (!candidateId) {
      return res.status(400).json({ error: true, message: 'candidateId is required', code: 'MISSING_FIELDS' });
    }

    const event = await prisma.votingEvent.findUnique({ where: { id: eventId } });
    if (!event || event.institutionId !== institutionId) {
      return res.status(404).json({ error: true, message: 'Event not found', code: 'NOT_FOUND' });
    }

    const now = new Date();
    if (now < event.startsAt || now > event.endsAt) {
      return res.status(400).json({ error: true, message: 'Voting is not currently active', code: 'VOTING_CLOSED' });
    }

    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate || candidate.votingEventId !== eventId) {
      return res.status(400).json({ error: true, message: 'Candidate not found in this event', code: 'INVALID_CANDIDATE' });
    }

    const existingVote = await prisma.vote.findUnique({
      where: { userId_votingEventId: { userId, votingEventId: eventId } },
    });
    if (existingVote) {
      return res.status(409).json({ error: true, message: 'You have already voted in this event', code: 'ALREADY_VOTED' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { votingId: true } });

    const vote = await prisma.vote.create({
      data: { userId, candidateId, votingEventId: eventId },
    });

    res.json({
      message: 'Vote cast successfully',
      receipt: {
        votingId: user.votingId,
        candidateId,
        eventTitle: event.title,
        timestamp: vote.castedAt,
      },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: true, message: 'You have already voted in this event', code: 'ALREADY_VOTED' });
    }
    console.error('castVote error:', err);
    res.status(500).json({ error: true, message: 'Failed to cast vote', code: 'INTERNAL_ERROR' });
  }
}

module.exports = { getEvents, getEventById, castVote };
