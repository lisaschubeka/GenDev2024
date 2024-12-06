import {apiClient, postprocessResponse} from "./apiClient.ts";
import {StreamingPackageCombos} from "../types/StreamingPackageCombo.ts";
import {Game} from "../types/Game.ts";

export class teamService  {

    static async postStreamingOffersForTeams(teamNames: string[], priceLimit?: number)
        : Promise<StreamingPackageCombos> {
        const teamNameRequestData = {teamNames: teamNames, priceLimit: priceLimit};
        const response = await apiClient.post<StreamingPackageCombos>('api/streamingOffersByTeams', teamNameRequestData)
        return postprocessResponse<StreamingPackageCombos>(response.data)
    }

    static async getAllTeams(): Promise<string[]> {
        const response = await apiClient.get<string[]>('api/allTeams')
        return postprocessResponse<string[]>(response.data)
    }

    static async postTeamsForGames(teamNames: string[]): Promise<Game[]> {
        const teamNameRequestData = {teamNames: teamNames};
        const response = await apiClient.post<Game[]>('api/gamesForTeam', teamNameRequestData)
        return postprocessResponse<Game[]>(response.data)
    }
}