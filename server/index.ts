import express, { Express, Request, Response } from "express";
import {PrismaClient} from "@prisma/client";
import {loadData} from "./app/loadDataFromCSV";

const app: Express = express();
const port = 4000;

export const prisma = new PrismaClient();

app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
});

app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
    console.log('Loading data...');
    await loadData()
});


/*
Return query for team/s
{
    covers_all_matches: boolean // if yes streaming_packages length is 1.
    streaming_packages: [
        [
            {
                provider_name: string
                yearly_sub: boolean,
                cost_cents: number,
                leagues: [
                    {
                        name: string,
                        live: boolean,
                        highlights: boolean
                    }, ...

                ]
            }, ...
        ]
    ]
}

                games: [
                            {
                                id: string,
                                team_home: string,
                                team_away: string,
                                starts_at: string,
                                tournament_name: string
                                live: boolean
                                highlights: boolean
                    }, ...
                ]
*/
