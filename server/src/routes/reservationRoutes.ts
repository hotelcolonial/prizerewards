import { Router } from "express";
import {
  getReservation,
  createReservation,
  getReservationsByUserId,
  deleteReservation,
  updateReservation,
} from "../controllers/reservationController";

const router = Router();

router.get("/", getReservation);
router.post("/", createReservation);
router.get("/:cognitoId/get", getReservationsByUserId);
router.delete("/delete/:reservationId", deleteReservation);
router.patch("/edit/:reservationId", updateReservation);

export default router;
