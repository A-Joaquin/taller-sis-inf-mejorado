import { Router } from "express";
import {
  getBranches,
  registerBranch,
  deleteBranch,
  editBranch,
  addImageToBranches,
  getBranchImages,
  addTextToBranches,
  getBranchTexts,
  getBranch,
  deleteImageFromBranch,
  deleteTextFromBranch,
} from "../controllers/branches.controller.js";
import multer from "multer";
import crypto from "crypto"; // Importar el módulo crypto

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Usar crypto.randomBytes para un valor aleatorio seguro
    const uniqueSuffix = Date.now() + "-" + crypto.randomBytes(4).toString('hex'); // Generar un valor aleatorio seguro
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + "." + file.mimetype.split("/")[1]
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 8000000 // Compliant: 8MB
  }
});

export const uploadImage = upload.single("image");

const branchsRouter = Router();

branchsRouter.post("/", registerBranch);
branchsRouter.get("/", getBranches);
branchsRouter.get("/branch/:id", getBranch);
branchsRouter.delete("/:id", deleteBranch); // Eliminar sucursal por ID
branchsRouter.put("/:id", editBranch);
branchsRouter.patch("/add-image", uploadImage, addImageToBranches);
branchsRouter.patch("/branch-text", addTextToBranches);
branchsRouter.get("/:id/images", getBranchImages);
branchsRouter.get("/:id/texts", getBranchTexts);

// Rutas para eliminar imagen y texto de la sucursal
branchsRouter.delete("/:id/image/:imageId", deleteImageFromBranch); // Eliminar una imagen
branchsRouter.delete("/:id/text/:textId", deleteTextFromBranch); // Eliminar un texto

export default branchsRouter;
