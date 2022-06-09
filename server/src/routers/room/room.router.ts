import { Router } from "express";
import { connection } from "mongoose";
import { AuthState, AuthMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/getOptions", AuthMiddleware(AuthState.Authorized), async (_, res) => {
    let collections = await connection.db.listCollections().toArray();
    let notOptions = ["users", "rooms", "games"];
    let options: Array<string> = [];
    collections.forEach((value) => {
        if (!notOptions.includes(value.name)) {
            options.push(value.name);
        }
    });
    res.status(200).json(options);
});

export default router;