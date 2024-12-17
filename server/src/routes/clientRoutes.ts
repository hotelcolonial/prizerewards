import { Router } from "express";
import {
  getUsers,
  updateUserInfo,
  deleteUser,
  getUserByEmailOrPhone,
  getUserById,
  getUserStatistics,
  postUser,
} from "../controllers/clientsController";

const router = Router();

router.get("/", getUsers);
router.post("/", postUser);
router.get("/getstatistics", getUserStatistics);
router.get("/getuser/:cognitoId", getUserById);
router.get("/getuserbyemailphone", getUserByEmailOrPhone);
router.patch("/edit/:cognitoId", updateUserInfo);
router.delete("/delete/:cognitoId", deleteUser);

export default router;
