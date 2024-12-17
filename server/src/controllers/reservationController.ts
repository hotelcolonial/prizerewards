import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Función auxiliar para actualizar puntos y nivel de lealtad
const updateUserPointsAndLevel = async (
  userCognitoId: string
): Promise<void> => {
  // Calcular los puntos totales del usuario
  const totalPoints = await prisma.reservation.aggregate({
    _sum: {
      points: true,
    },
    where: {
      userCognitoId: userCognitoId,
    },
  });

  const userPoints = totalPoints._sum.points || 0;

  // Obtener los niveles de lealtad ordenados por puntos requeridos
  const loyaltyLevels = await prisma.loyaltyLevel.findMany({
    orderBy: { pointsRequirement: "asc" }, // Ordenar por puntos requeridos de menor a mayor
  });

  console.log("Loyalty levels: " + loyaltyLevels);
  // Determinar el nivel actual o siguiente
  const newLevel = loyaltyLevels.find(
    (level, index) =>
      userPoints >= level.pointsRequirement && // Cumple con los puntos del nivel actual
      (index === loyaltyLevels.length - 1 ||
        userPoints < loyaltyLevels[index + 1].pointsRequirement) // No cumple con el siguiente nivel
  );

  console.log("User Points:", userPoints);
  console.log("New Level:", newLevel);

  // Actualizar puntos y nivel del usuario
  await prisma.user.update({
    where: { cognitoId: userCognitoId },
    data: {
      points: userPoints,
      loyaltyLevelId: newLevel?.id || 1, // Nivel predeterminado si no cumple ningún requisito
    },
  });
};

// Crear una reserva
export const createReservation = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    checkinDate,
    checkoutDate,
    points,
    typeRoomId,
    userCognitoId,
    nights,
  } = req.body;

  try {
    // Crear la nueva reserva
    const newReservation = await prisma.reservation.create({
      data: {
        checkinDate,
        checkoutDate,
        points,
        typeRoomId,
        userCognitoId,
        nights,
      },
    });

    // Actualizar puntos y nivel del usuario
    await updateUserPointsAndLevel(userCognitoId);

    res.status(201).json(newReservation);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error creating reservation: ${error.message}` });
  }
};

// Obtener todas las reservas
export const getReservation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const reservations = await prisma.reservation.findMany({
      include: { typeRoom: true, user: true },
      orderBy: { id: "asc" },
    });

    res.json(reservations);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving reservations: ${error.message}` });
  }
};

// Obtener reservas por usuario
export const getReservationsByUserId = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { cognitoId } = req.params;

  try {
    const reservationsById = await prisma.reservation.findMany({
      where: {
        userCognitoId: cognitoId,
      },
      include: {
        typeRoom: true,
      },
    });

    res.json(reservationsById);
  } catch (error: any) {
    res.status(500).json({
      message: `Error retrieving reservations by Id: ${error.message}`,
    });
  }
};

// Actualizar una reserva
export const updateReservation = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { reservationId } = req.params;
  const { checkinDate, checkoutDate, points, typeRoomId, nights } = req.body;

  try {
    // Obtener la reserva antes de actualizarla
    const reservation = await prisma.reservation.findUnique({
      where: {
        id: Number(reservationId),
      },
    });

    if (!reservation) {
      res.status(404).json({ message: "Reservation not found" });
      return;
    }

    // Actualizar la reserva
    const updatedReservation = await prisma.reservation.update({
      where: {
        id: Number(reservationId),
      },
      data: {
        checkinDate,
        checkoutDate,
        points,
        typeRoomId,
        nights,
      },
    });

    // Actualizar puntos y nivel del usuario
    await updateUserPointsAndLevel(reservation.userCognitoId);

    res.json(updatedReservation);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error updating reservation: ${error.message}` });
  }
};

// Eliminar una reserva
export const deleteReservation = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { reservationId } = req.params;

  try {
    // Obtener la reserva antes de eliminarla
    const reservation = await prisma.reservation.findUnique({
      where: {
        id: Number(reservationId),
      },
    });

    if (!reservation) {
      res.status(404).json({ message: "Reservation not found" });
      return;
    }

    // Eliminar la reserva
    const deletedReservation = await prisma.reservation.delete({
      where: {
        id: Number(reservationId),
      },
    });

    // Actualizar puntos y nivel del usuario
    await updateUserPointsAndLevel(reservation.userCognitoId);

    res.json(deletedReservation);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error deleting reservation: ${error.message}` });
  }
};
