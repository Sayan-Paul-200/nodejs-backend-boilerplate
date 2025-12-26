import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/authorize";
import { Action } from "../iam/types";

const router = Router();

router.use(verifyJWT); // 1. Identify User

// 2. Protect Routes with IAM

// CREATE Product (Requires '8' bit)
router.post(
  "/", 
  authorize('inventory:products', Action.CREATE), 
  (req, res) => res.json({ msg: "Product Created" })
);

// READ Products (Requires '4' bit)
// Note: Even a 'member' can do this based on our config
router.get(
  "/", 
  authorize('inventory:products', Action.READ), 
  (req, res) => res.json({ msg: "List of Products" })
);

// DELETE Product (Requires '1' bit)
// Only Admin or Manager with full access
router.delete(
  "/:id", 
  authorize('inventory:products', Action.DELETE), 
  (req, res) => res.json({ msg: "Product Deleted" })
);

export default router;