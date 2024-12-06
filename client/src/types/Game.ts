export type Game = {
    id: number
    team_home: string
    team_away: string
    starts_at: string
    tournament_name: string
}


export type GameOffer = Game & {
    live : boolean
    highlights: boolean
}