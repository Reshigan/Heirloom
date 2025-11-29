import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

router.get('/people', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    
    const people = await prisma.person.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ people });
  } catch (error) {
    next(error);
  }
});

router.post('/people', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const { name, birthDate, deathDate, relation, notes } = req.body;
    
    if (!name) {
      throw new AppError(400, 'Name is required');
    }
    
    const person = await prisma.person.create({
      data: {
        ownerId: userId,
        name,
        birthDate: birthDate ? new Date(birthDate) : null,
        deathDate: deathDate ? new Date(deathDate) : null,
        relation: relation || 'OTHER',
        notes: notes || null
      }
    });
    
    res.json({ person });
  } catch (error) {
    next(error);
  }
});

router.put('/people/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const personId = req.params.id;
    const { name, birthDate, deathDate, relation, notes } = req.body;
    
    const existingPerson = await prisma.person.findFirst({
      where: { id: personId, ownerId: userId }
    });
    
    if (!existingPerson) {
      throw new AppError(404, 'Person not found');
    }
    
    const person = await prisma.person.update({
      where: { id: personId },
      data: {
        name: name || existingPerson.name,
        birthDate: birthDate ? new Date(birthDate) : existingPerson.birthDate,
        deathDate: deathDate ? new Date(deathDate) : existingPerson.deathDate,
        relation: relation !== undefined ? relation : existingPerson.relation,
        notes: notes !== undefined ? notes : existingPerson.notes
      }
    });
    
    res.json({ person });
  } catch (error) {
    next(error);
  }
});

router.delete('/people/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const personId = req.params.id;
    
    const person = await prisma.person.findFirst({
      where: { id: personId, ownerId: userId }
    });
    
    if (!person) {
      throw new AppError(404, 'Person not found');
    }
    
    await prisma.person.delete({
      where: { id: personId }
    });
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/people/:id/relationships', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const personId = req.params.id;
    const { relatedPersonId, relationshipType } = req.body;
    
    if (!relatedPersonId || !relationshipType) {
      throw new AppError(400, 'relatedPersonId and relationshipType are required');
    }
    
    const person = await prisma.person.findFirst({
      where: { id: personId, ownerId: userId }
    });
    
    if (!person) {
      throw new AppError(404, 'Person not found');
    }
    
    const relatedPerson = await prisma.person.findFirst({
      where: { id: relatedPersonId, ownerId: userId }
    });
    
    if (!relatedPerson) {
      throw new AppError(404, 'Related person not found');
    }
    
    res.json({ 
      success: true,
      message: 'Relationship created',
      relationship: {
        personId,
        relatedPersonId,
        relationshipType
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
