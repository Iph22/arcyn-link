import express from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth';
import { Team } from '@prisma/client';

const router = express.Router();

// Get all teams with member counts
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const teams = await Promise.all([
      prisma.user.count({ where: { team: Team.ARCYN_X } }),
      prisma.user.count({ where: { team: Team.MODULEX } }),
      prisma.user.count({ where: { team: Team.NEXALAB } })
    ]);

    const teamData = [
      {
        id: 'ARCYN_X',
        name: 'Arcyn.x',
        description: 'Core development team',
        memberCount: teams[0],
        color: '#06b6d4' // cyan
      },
      {
        id: 'MODULEX',
        name: 'Modulex',
        description: 'Modular solutions team',
        memberCount: teams[1],
        color: '#8b5cf6' // violet
      },
      {
        id: 'NEXALAB',
        name: 'Nexalab',
        description: 'Research and innovation lab',
        memberCount: teams[2],
        color: '#10b981' // emerald
      }
    ];

    res.json({ teams: teamData });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get team members
router.get('/:teamId/members', async (req: AuthenticatedRequest, res) => {
  try {
    const { teamId } = req.params;
    
    if (!Object.values(Team).includes(teamId as Team)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    const members = await prisma.user.findMany({
      where: { team: teamId as Team },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        createdAt: true
      },
      orderBy: { username: 'asc' }
    });

    res.json({ members });
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user's team info
router.get('/me', async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    
    const teamMembers = await prisma.user.findMany({
      where: { team: user.team as Team },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        createdAt: true
      },
      orderBy: { username: 'asc' }
    });

    const teamInfo = {
      id: user.team,
      name: user.team === 'ARCYN_X' ? 'Arcyn.x' : 
            user.team === 'MODULEX' ? 'Modulex' : 'Nexalab',
      description: user.team === 'ARCYN_X' ? 'Core development team' :
                   user.team === 'MODULEX' ? 'Modular solutions team' : 'Research and innovation lab',
      memberCount: teamMembers.length,
      members: teamMembers
    };

    res.json({ team: teamInfo });
  } catch (error) {
    console.error('Get my team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
