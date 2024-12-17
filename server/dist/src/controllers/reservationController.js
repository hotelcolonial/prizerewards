"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReservation = exports.updateReservation = exports.getReservationsByUserId = exports.getReservation = exports.createReservation = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Función auxiliar para actualizar puntos y nivel de lealtad
const updateUserPointsAndLevel = (userCognitoId) => __awaiter(void 0, void 0, void 0, function* () {
    // Calcular los puntos totales del usuario
    const totalPoints = yield prisma.reservation.aggregate({
        _sum: {
            points: true,
        },
        where: {
            userCognitoId: userCognitoId,
        },
    });
    const userPoints = totalPoints._sum.points || 0;
    // Obtener los niveles de lealtad ordenados por puntos requeridos
    const loyaltyLevels = yield prisma.loyaltyLevel.findMany({
        orderBy: { pointsRequirement: "asc" }, // Ordenar por puntos requeridos de menor a mayor
    });
    console.log("Loyalty levels: " + loyaltyLevels);
    // Determinar el nivel actual o siguiente
    const newLevel = loyaltyLevels.find((level, index) => userPoints >= level.pointsRequirement && // Cumple con los puntos del nivel actual
        (index === loyaltyLevels.length - 1 ||
            userPoints < loyaltyLevels[index + 1].pointsRequirement) // No cumple con el siguiente nivel
    );
    console.log("User Points:", userPoints);
    console.log("New Level:", newLevel);
    // Actualizar puntos y nivel del usuario
    yield prisma.user.update({
        where: { cognitoId: userCognitoId },
        data: {
            points: userPoints,
            loyaltyLevelId: (newLevel === null || newLevel === void 0 ? void 0 : newLevel.id) || 1, // Nivel predeterminado si no cumple ningún requisito
        },
    });
});
// Crear una reserva
const createReservation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { checkinDate, checkoutDate, points, typeRoomId, userCognitoId, nights, } = req.body;
    try {
        // Crear la nueva reserva
        const newReservation = yield prisma.reservation.create({
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
        yield updateUserPointsAndLevel(userCognitoId);
        res.status(201).json(newReservation);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error creating reservation: ${error.message}` });
    }
});
exports.createReservation = createReservation;
// Obtener todas las reservas
const getReservation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reservations = yield prisma.reservation.findMany({
            include: { typeRoom: true, user: true },
            orderBy: { id: "asc" },
        });
        res.json(reservations);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error retrieving reservations: ${error.message}` });
    }
});
exports.getReservation = getReservation;
// Obtener reservas por usuario
const getReservationsByUserId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { cognitoId } = req.params;
    try {
        const reservationsById = yield prisma.reservation.findMany({
            where: {
                userCognitoId: cognitoId,
            },
            include: {
                typeRoom: true,
            },
        });
        res.json(reservationsById);
    }
    catch (error) {
        res.status(500).json({
            message: `Error retrieving reservations by Id: ${error.message}`,
        });
    }
});
exports.getReservationsByUserId = getReservationsByUserId;
// Actualizar una reserva
const updateReservation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reservationId } = req.params;
    const { checkinDate, checkoutDate, points, typeRoomId, nights } = req.body;
    try {
        // Obtener la reserva antes de actualizarla
        const reservation = yield prisma.reservation.findUnique({
            where: {
                id: Number(reservationId),
            },
        });
        if (!reservation) {
            res.status(404).json({ message: "Reservation not found" });
            return;
        }
        // Actualizar la reserva
        const updatedReservation = yield prisma.reservation.update({
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
        yield updateUserPointsAndLevel(reservation.userCognitoId);
        res.json(updatedReservation);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error updating reservation: ${error.message}` });
    }
});
exports.updateReservation = updateReservation;
// Eliminar una reserva
const deleteReservation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reservationId } = req.params;
    try {
        // Obtener la reserva antes de eliminarla
        const reservation = yield prisma.reservation.findUnique({
            where: {
                id: Number(reservationId),
            },
        });
        if (!reservation) {
            res.status(404).json({ message: "Reservation not found" });
            return;
        }
        // Eliminar la reserva
        const deletedReservation = yield prisma.reservation.delete({
            where: {
                id: Number(reservationId),
            },
        });
        // Actualizar puntos y nivel del usuario
        yield updateUserPointsAndLevel(reservation.userCognitoId);
        res.json(deletedReservation);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error deleting reservation: ${error.message}` });
    }
});
exports.deleteReservation = deleteReservation;
