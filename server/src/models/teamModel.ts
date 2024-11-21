import {Game, PrismaClient, StreamingOffer, StreamingPackage} from "@prisma/client";

const prisma = new PrismaClient();

const TeamModel = {
    getGames : async (team: string): Promise<Game[]> => {
        return prisma.game.findMany({
            where: {
                OR: [
                    { team_home: team },
                    { team_away: team },
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
    }
}

export default TeamModel
