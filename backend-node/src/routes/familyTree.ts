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
      where: { userId },
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
    const { name, birthDate, deathDate, relationship, bio, photoUrl } = req.body;
    
    if (!name) {
      throw new AppError(400, 'Name is required');
    }
    
    const person = await prisma.person.create({
      data: {
        userId,
        name,
        birthDate: birthDate ? new Date(birthDate) : null,
        deathDate: deathDate ? new Date(deathDate) : null,
        relationship: relationship || null,
        bio: bio || null,
        photoUrl: photoUrl || null
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
    const { name, birthDate, deathDate, relationship, bio, photoUrl } = req.body;
    
    const existingPerson = await prisma.person.findFirst({
      where: { id: personId, userId }
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
        relationship: relationship !== undefined ? relationship : existingPerson.relationship,
        bio: bio !== undefined ? bio : existingPerson.bio,
        photoUrl: photoUrl !== undefined ? photoUrl : existingPerson.photoUrl
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
      where: { id: personId, userId }
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
      where: { id: personId, userId }
    });
    
    if (!person) {
      throw new AppError(404, 'Person not found');
    }
    
    const relatedPerson = await prisma.person.findFirst({
      where: { id: relatedPersonId, userId }
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
