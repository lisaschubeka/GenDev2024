import express, { Express } from "express";
import { apiRoutes } from "./src/routes/apiRoutes";

const app: Express = express();
const port = 4000;

app.use(express.json());
app.use("/api", apiRoutes);

// Start the server
app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
    console.log("Loading data...");
});


/*
Return query for team/s
{
    streaming_packages: [
        {
            total_matches: number if these two fields equal the json length is 1
            covered_matches: number
            [
                {
                    provider_name: string // this should be id and create enum that matches in frontend and backend
                    yearly_sub: boolean,
                    cost_cents: number,
                    games: [number] (game_id)
                }, ...
            ]
        }, ...

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
