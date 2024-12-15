import {Game, PrismaClient, StreamingOffer, StreamingPackage} from "@prisma/client";

const prisma = new PrismaClient();

const TeamModel = {
    getGamesByTeam : async (teams: string[]): Promise<Game[]> => {
        return prisma.game.findMany({
            where: {
                OR: [
                    { team_home: {in: teams} },
                    { team_away: {in: teams} },
                ]
            }
        });
    },

    getStreamingOffersByGames : async (gameIds: number[])
        : Promise<StreamingOffer[]> => {
        return prisma.streamingOffer.findMany({
            where: {
                game_id: {
                    in: gameIds
                },
            },
        });
    },

    getStreamingPackages : async() : Promise<StreamingPackage[]> => {
        return prisma.streamingPackage.findMany()
    },

    getAllUniqueTeams: async (): Promise<string[]> => {
        // Query all unique team names from team_home and team_away
        const teamHomes = await prisma.game.findMany({
            select: {
                team_home: true
            }
        })

        const teamAways = await prisma.game.findMany({
            select: {
                team_away: true
            }
        });

        const uniqueTeams = new Set([
            ...teamHomes.map(game => game.team_home),
            ...teamAways.map(game => game.team_away)
        ])

        return Array.from(uniqueTeams);
    },
}

export default TeamModel
