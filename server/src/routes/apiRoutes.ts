import express from "express"
import { type Request, type Response } from 'express'
import {TeamService} from "../services/teamService"

export const apiRoutes = express.Router()

const { Validator } = require("express-json-validator-middleware")
const { validate } = new Validator()

export const teamNamesRequestSchema = {
    type: "object",
    properties: {
        teamNames: {
            type: "array",
            items: {
                type: "string",
            },
        },
        priceLimit: {
            type: "number",
        }
    },
    required: ["teamNames"],
}

export const gamesRequestSchema = {
    type: "object",
    properties: {
        ids: {
            type: "array",
            items: {
                type: "number",
            }
        }
    },
    required: ["ids"],
}

apiRoutes.post(
    "/streamingOffersByTeams",
    validate({ body: teamNamesRequestSchema }),
    async (req: Request, res: Response) => {
        try {
            const {teamNames, priceLimit} = req.body
            const streamProvidersAvailability = await TeamService.getStreamingOffers(
                teamNames,
                priceLimit)
            res.status(200).json(streamProvidersAvailability)
        } catch (error) {
            console.error("Error in /team route:", error)
            res.status(500).json({ error: "Server Error: " + "Failed to parse json" })
        }
    }
)

apiRoutes.get("/allTeams", async (req: Request, res: Response) => {
    try {
        const teams = await TeamService.getAllTeams()
        res.status(200).json(teams)
    } catch (error) {
        res.status(500).json({ error: "Server Error: " + error })
    }
})

apiRoutes.post("/gamesForTeam",
    validate({ body: teamNamesRequestSchema }),
    async (req: Request, res: Response) => {
    try {
        const {teamNames} = req.body
        const games = await TeamService.getGamesByTeam(teamNames)
        res.status(200).json(games)
    } catch (error) {
        res.status(500).json({ error: "Server Error: " + error })
    }
})