
export type Game = {
    id: Number,
    team_home: string,
    team_away: string,
    starts_at: Date,
    tournament_name: string,
}

export type GameOffer = Game & {
    live : boolean
    highlights: boolean
}
