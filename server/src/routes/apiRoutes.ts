import express from "express"
import { type Request, type Response } from 'express';
import {TeamService} from "../services/teamService";

export const apiRoutes = express.Router()

const { Validator } = require("express-json-validator-middleware");
const { validate } = new Validator();

export const teamRequestSchema = {
    type: "object",
    properties: {
        teamName: {
            type: "string",
        },
    },
};

export type teamRequest = {
    teamName: string;
}

// Define the API route
apiRoutes.post(
    "/team",
    validate({ body: teamRequestSchema }), // Middleware to validate request body
    async (req: Request, res: Response) => {
        try {
            const {teamName} = req.body
            console.log(teamName);
            const streamProvidersAvailability = await TeamService.getStreamingOffersByTeam(teamName);
            res.status(200).json(streamProvidersAvailability);
        } catch (error) {
            console.error("Error in /team route:", error); // Log the error for debugging
            res.status(500).json({ error: "Server Error: " + "Failed to parse json" });
        }
    }
)