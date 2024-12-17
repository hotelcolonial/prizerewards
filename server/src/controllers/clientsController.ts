import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const postUser = async (req: Request, res: Response) => {
  try {
    const {
      email,
      cognitoId,
      name,
      birthdate,
      custom: {
        consentTimestamp,
        country,
        language,
        legalConsent,
        travelPreferenceId,
      },
    } = req.body;

    const newUser = await prisma.user.create({
      data: {
        email,
        cognitoId,
        name,
        dateOfBirth: new Date(birthdate),
        country,
        languageId: parseInt(language, 10),
        travelPreferenceId: parseInt(travelPreferenceId, 10),
        consentAccepted: legalConsent === "true",
        consentTimestamp: new Date(consentTimestamp),
        points: 0,
        loyaltyLevelId: 1,
      },
    });

    // Enviar respuesta exitosa
    res.status(201).json({
      message: "Usuario creado con éxito",
      user: newUser,
    });
  } catch (error) {
    console.error("Error al crear el usuario:", error);
    res.status(500).json({
      message: "Ocurrió un error al procesar el registro",
    });
  }
};

export const getUserStatistics = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { country, startDate, endDate, loyaltyLevelId } = req.query;

  try {
    // Construir los filtros dinámicos
    const filters: any = {};

    if (country) {
      filters.country = country;
    }

    if (startDate && endDate) {
      filters.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (loyaltyLevelId) {
      filters.loyaltyLevelId = Number(loyaltyLevelId);
    }

    // Obtener usuarios
    const users = await prisma.user.findMany({
      where: filters,
      select: {
        cognitoId: true,
        loyaltyLevelId: true,
        country: true,
        points: true,
      },
    });

    // Agrupar usuarios y sumar puntos
    const userGroupMap = new Map();
    users.forEach((user) => {
      const key = `${user.loyaltyLevelId}-${user.country}`;
      if (!userGroupMap.has(key)) {
        userGroupMap.set(key, {
          loyaltyLevelId: user.loyaltyLevelId,
          country: user.country,
          totalUsers: 0,
          totalPoints: 0,
          userCognitoIds: [],
        });
      }
      const group = userGroupMap.get(key);
      group.totalUsers += 1;
      group.totalPoints += user.points || 0;
      group.userCognitoIds.push(user.cognitoId);
    });

    // Obtener reservas de los usuarios
    const userCognitoIds = Array.from(userGroupMap.values())
      .flatMap((group) => group.userCognitoIds)
      .filter((id, index, self) => self.indexOf(id) === index); // Eliminar duplicados

    const reservations = await prisma.reservation.findMany({
      where: {
        userCognitoId: {
          in: userCognitoIds,
        },
      },
      select: {
        userCognitoId: true,
        nights: true,
      },
    });

    // Sumar noches por grupo
    reservations.forEach((reservation) => {
      const user = users.find((u) => u.cognitoId === reservation.userCognitoId);
      if (user) {
        const key = `${user.loyaltyLevelId}-${user.country}`;
        const group = userGroupMap.get(key);
        if (!group.totalNights) {
          group.totalNights = 0;
        }
        group.totalNights += reservation.nights || 0;
      }
    });

    // Obtener nombres de niveles de lealtad
    const loyaltyLevels = await prisma.loyaltyLevel.findMany();

    // Preparar los resultados desglosados
    const detailedStatistics = Array.from(userGroupMap.values()).map(
      (group) => ({
        loyaltyLevel: loyaltyLevels.find(
          (level) => level.id === group.loyaltyLevelId
        )?.levelName,
        country: group.country,
        totalUsers: group.totalUsers,
        totalPoints: group.totalPoints,
        totalNights: group.totalNights || 0,
      })
    );

    // Calcular totales globales
    const totalUsers = users.length;
    const totalPoints = users.reduce(
      (sum, user) => sum + (user.points || 0),
      0
    );
    const totalNights = reservations.reduce(
      (sum, reservation) => sum + (reservation.nights || 0),
      0
    );

    const overallStatistics = {
      totalUsers,
      totalPoints,
      totalNights,
    };

    // Calcular totales por nivel de lealtad
    const totalsByLoyaltyLevel = loyaltyLevels.map((level) => {
      const filteredUsers = users.filter(
        (user) => user.loyaltyLevelId === level.id
      );

      const filteredReservations = reservations.filter((reservation) =>
        filteredUsers.some(
          (user) => user.cognitoId === reservation.userCognitoId
        )
      );

      return {
        loyaltyLevel: level.levelName,
        totalUsers: filteredUsers.length,
        totalPoints: filteredUsers.reduce(
          (sum, user) => sum + (user.points || 0),
          0
        ),
        totalNights: filteredReservations.reduce(
          (sum, reservation) => sum + (reservation.nights || 0),
          0
        ),
      };
    });

    // Calcular totales por país
    const totalsByCountry = users.reduce((acc, user) => {
      const country = user.country || "Desconocido";
      if (!acc[country]) {
        acc[country] = {
          country,
          totalUsers: 0,
        };
      }
      acc[country].totalUsers += 1;
      return acc;
    }, {} as Record<string, { country: string; totalUsers: number }>);

    const countryStatistics = Object.values(totalsByCountry);

    // Responder con estadísticas detalladas, totales y por nivel
    res.json({
      detailedStatistics,
      overallStatistics,
      totalsByLoyaltyLevel,
      countryStatistics,
    });
  } catch (error: any) {
    res.status(500).json({
      message: `Error retrieving user statistics: ${error.message}`,
    });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      include: {
        language: true,
        loyaltyLevel: true,
        reservation: true,
        travelPreference: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    res.json(users);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving clients: ${error.message}` });
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { cognitoId } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { cognitoId: cognitoId },
      include: {
        language: true,
        loyaltyLevel: {
          include: {
            Benefit: true,
          },
        },
        reservation: true,
        travelPreference: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving user: ${error.message}` });
  }
};

export const getUserByEmailOrPhone = async (
  req: Request,
  res: Response
): Promise<void> => {
  const clientData = req.query.clientData as string; // Aseguramos que clientData sea una cadena
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            email: {
              contains: clientData,
              mode: "insensitive", // Búsqueda insensible a mayúsculas/minúsculas
            },
          },
        ],
      },
    });

    res.json(users); // Retorna la lista de usuarios encontrados
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving clients: ${error.message}` });
  }
};

export const updateUserInfo = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { cognitoId } = req.params;
  const {
    email,
    dateOfBirth,
    country,
    travelPreferenceId,
    languageId,
    loyaltyLevelId,
    name,
  } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: {
        cognitoId,
      },
      data: {
        email,
        dateOfBirth,
        country,
        travelPreferenceId,
        languageId,
        loyaltyLevelId,
        name,
      },
    });

    res.json(updatedUser);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error updating client: ${error.message}` });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { cognitoId } = req.params;

  console.log(cognitoId);

  try {
    const deletedUser = await prisma.user.delete({
      where: {
        cognitoId: cognitoId,
      },
    });

    res.json(deletedUser);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error deleting client: ${error.message}` });
  }
};
