import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getBenefitsByLevelId = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { levelId } = req.params;
  try {
    const benefitsByLevel = await prisma.benefit.findMany({
      where: {
        loyaltyLevelId: Number(levelId),
      },
    });

    res.json(benefitsByLevel);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving clients: ${error.message}` });
  }
};

export const getBenefits = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const benefits = await prisma.benefit.findMany({
      orderBy: {
        id: "asc",
      },
    }); // Sin filtros
    res.json(benefits);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving benefits: ${error.message}` });
  }
};

export const createBenefitByLevel = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { levelId } = req.params;
  const { title, subtitle } = req.body;
  try {
    const benefitByLevel = await prisma.benefit.create({
      data: {
        title,
        subtitle,
        loyaltyLevelId: Number(levelId),
      },
    });

    res.json(benefitByLevel);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error creating benefit: ${error.message}` });
  }
};

export const updateBenefit = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { title, subtitle } = req.body;

  try {
    const updatedBenefit = await prisma.benefit.update({
      where: {
        id: Number(id),
      },
      data: {
        title,
        subtitle,
      },
    });

    res.json(updatedBenefit);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error updating benefit: ${error.message}` });
  }
};

export const deleteBenefit = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const deletedBenefit = await prisma.benefit.delete({
      where: {
        id: Number(id),
      },
    });

    res.json(deletedBenefit);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error deleting benefit: ${error.message}` });
  }
};
