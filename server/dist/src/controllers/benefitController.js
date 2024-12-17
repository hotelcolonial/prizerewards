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
exports.deleteBenefit = exports.updateBenefit = exports.createBenefitByLevel = exports.getBenefits = exports.getBenefitsByLevelId = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getBenefitsByLevelId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { levelId } = req.params;
    try {
        const benefitsByLevel = yield prisma.benefit.findMany({
            where: {
                loyaltyLevelId: Number(levelId),
            },
        });
        res.json(benefitsByLevel);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error retrieving clients: ${error.message}` });
    }
});
exports.getBenefitsByLevelId = getBenefitsByLevelId;
const getBenefits = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const benefits = yield prisma.benefit.findMany({
            orderBy: {
                id: "asc",
            },
        }); // Sin filtros
        res.json(benefits);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error retrieving benefits: ${error.message}` });
    }
});
exports.getBenefits = getBenefits;
const createBenefitByLevel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { levelId } = req.params;
    const { title, subtitle } = req.body;
    try {
        const benefitByLevel = yield prisma.benefit.create({
            data: {
                title,
                subtitle,
                loyaltyLevelId: Number(levelId),
            },
        });
        res.json(benefitByLevel);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error creating benefit: ${error.message}` });
    }
});
exports.createBenefitByLevel = createBenefitByLevel;
const updateBenefit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { title, subtitle } = req.body;
    try {
        const updatedBenefit = yield prisma.benefit.update({
            where: {
                id: Number(id),
            },
            data: {
                title,
                subtitle,
            },
        });
        res.json(updatedBenefit);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error updating benefit: ${error.message}` });
    }
});
exports.updateBenefit = updateBenefit;
const deleteBenefit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const deletedBenefit = yield prisma.benefit.delete({
            where: {
                id: Number(id),
            },
        });
        res.json(deletedBenefit);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error deleting benefit: ${error.message}` });
    }
});
exports.deleteBenefit = deleteBenefit;
