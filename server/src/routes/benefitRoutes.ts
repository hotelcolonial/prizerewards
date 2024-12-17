import { Router } from "express";
import {
  createBenefitByLevel,
  deleteBenefit,
  getBenefits,
  getBenefitsByLevelId,
  updateBenefit,
} from "../controllers/benefitController";

const router = Router();

router.get("/get/:levelId", getBenefitsByLevelId);
router.get("/getall", getBenefits);
router.post("/createbenefitbylevel/:levelId", createBenefitByLevel);
router.patch("/updatebenefit/:id", updateBenefit);
router.delete("/deletebenefit/:id", deleteBenefit);

export default router;
