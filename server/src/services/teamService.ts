import teamModel from "../models/teamModel"
import {Game, StreamingOffer} from "@prisma/client"
import {StreamingPackage, StreamingPackagesResponse} from "../types/response"


export const TeamService = {

    getStreamingOffersByTeam: async(teamName: string): Promise<{ streaming_packages: StreamingPackage[] }> => {
        const gamesOfTeam = await TeamService.getGamesByTeam(teamName)
        const streamingOffersOfTeam = TeamService.getStreamingOffersByGames(gamesOfTeam)
        const streamingOffersByProvider = TeamService.groupStreamingOfferByProvider(await streamingOffersOfTeam)
        const costOfStreamingPackages = await TeamService.getCostOfStreamingPackages()
        const fullAvailabilityCombination = TeamService.findFullAvailabilityCombination(
            gamesOfTeam,
            streamingOffersByProvider,
            await costOfStreamingPackages)

        if (fullAvailabilityCombination) {
            const totalCoveredMatches = TeamService.calculateTotalNumberOfMatches(fullAvailabilityCombination)
            const totalMatchesOfTeam = gamesOfTeam.length

            const packages = Array.from(fullAvailabilityCombination.entries()).map(([providerId, offers]) => {
                const costTuple = (costOfStreamingPackages).get(providerId)
                const cost_cents = Array.isArray(costTuple) && costTuple.length === 2 ? costTuple[0] : 0
                const yearly_sub = Array.isArray(costTuple) && costTuple.length === 2 ? costTuple[1] : false
                const games = offers.map((offer) => Number(offer.game_id))

                return {
                    provider_id: providerId,
                    yearly_sub,
                    cost_cents,
                    games,
                }
            })

            return {
                streaming_packages: [
                    {
                        total_matches: totalMatchesOfTeam,
                        covered_matches: totalCoveredMatches,
                        packages,
                    },
                ],
            }
        // else loop for if no combination of packages covers all games
        } else {
            console.log("in else")
            const partialCombinations = TeamService.findListOfPartialAvailabilityCombinations(
                gamesOfTeam,
                streamingOffersByProvider
            )

            const partialPackages = partialCombinations.map((combination : Map<number, StreamingOffer[]> | null) => {
                if (!combination) return null

                const totalCoveredMatches = Array.from(combination.values())
                    .flat()
                    .length

                const packages = Array.from(combination.entries()).map(([providerId, offers]) => {
                    const costTuple = costOfStreamingPackages.get(providerId)
                    const cost_cents = Array.isArray(costTuple) && costTuple.length === 2 ? costTuple[0] : 0
                    const yearly_sub = Array.isArray(costTuple) && costTuple.length === 2 ? costTuple[1] : false
                    const games = offers.map((offer) => Number(offer.game_id))

                    return {
                        provider_id: providerId,
                        yearly_sub,
                        cost_cents,
                        games,
                    }
                })

                return {
                    total_matches: gamesOfTeam.length,
                    covered_matches: totalCoveredMatches,
                    packages,
                }
            })

            return {
                streaming_packages: partialPackages.filter((pkg) => pkg !== null) as StreamingPackage[],
            }
        }
    },

    getGamesByTeam: async (teamName: string) => {
        return await teamModel.getGames(teamName)
    },

    getStreamingOffersByGames: async (games: Game[])
        : Promise<StreamingOffer[]> => {
        return await teamModel.getStreamingOffersByGames(games.map(game => game.id))
    },

    groupStreamingOfferByProvider: (streamingOffers: StreamingOffer[])
        :Map<number, StreamingOffer[]> => {
        const streamingOfferGroupByProvider = new Map<number, StreamingOffer[]>()
        for (const offer of streamingOffers) {
            const streamingPackageId = offer.streaming_package_id
            if (!streamingOfferGroupByProvider.has(streamingPackageId)) {
                streamingOfferGroupByProvider.set(streamingPackageId, [])
            }
            const gamesList = streamingOfferGroupByProvider.get(streamingPackageId)
            if (gamesList) {
                if (!gamesList.includes(offer)) {
                    gamesList.push(offer)
                }
            }
        }
        return streamingOfferGroupByProvider
    },

    getCostOfStreamingPackages : async (): Promise<Map<number, [number, boolean]>> => {
        const streamingPackages = await teamModel.getStreamingPackages()
        return new Map(
            streamingPackages.map((pkg) => [
                pkg.id?? 0,
                pkg.monthly_price_cents !== 0
                    ? [pkg.monthly_price_cents, false]
                    : [pkg.monthly_price_yearly_subscription_in_cents ?? 0, true],
            ])
        )
    },

    // This function follows the set cover greedy algorithm
    findFullAvailabilityCombination: (
        gamesToCover: Game[],
        streamingOffersGroupByProvider: Map<number, StreamingOffer[]>,
        streamingPackageCost: Map<number, [number, boolean]>
    ): Map<number, StreamingOffer[]> | null => {
        const selectedProviders = new Map<number, StreamingOffer[]>()
        const uncoveredGames = new Set(gamesToCover.map(game => game.id))
        while (uncoveredGames.size > 0) {
            let bestProvider: number | null = null
            let bestCostPerMatch = Infinity
            let bestOffer: StreamingOffer[] = []

            for (let [providerId, offers] of streamingOffersGroupByProvider) {
                const costTuple = streamingPackageCost.get(providerId as number) ?? Infinity
                const cost = Array.isArray(costTuple) && costTuple.length === 2 ?
                    costTuple[0] : Infinity
                const coveredGamesByProvider = offers.filter(offer =>
                    uncoveredGames.has(Number(offer.game_id))
                )

                if (coveredGamesByProvider.length > 0) {
                    const costPerMatch = cost / coveredGamesByProvider.length
                    if (costPerMatch < bestCostPerMatch) {
                        bestCostPerMatch = costPerMatch
                        bestProvider = providerId
                        bestOffer = coveredGamesByProvider
                    }
                }
            }
            console.log("Best Provider: " + bestProvider)

            if (bestProvider === null) {
                return null
            }

            selectedProviders.set(Number(bestProvider), bestOffer)

            for (let offer of bestOffer) {
                uncoveredGames.delete(Number(offer.game_id))
            }

            streamingOffersGroupByProvider.delete(bestProvider)
        }
        return selectedProviders
    },

    // This function follows the max coverage problem greedy algorithm
    findListOfPartialAvailabilityCombinations: (
        gamesToCover: Game[],
        streamingOffersGroupByProvider: Map<number, StreamingOffer[]>
    ): (Map<number, StreamingOffer[]> | null)[] => {
        const uncoveredGames = new Set(gamesToCover.map((game) => game.id))
        const allCombinations: { map: Map<number, StreamingOffer[]>, coveredGames: number }[] = []
        let iterations = 0

        while (uncoveredGames.size > 0 && iterations < 500) {
            iterations += 1
            const selectedProviders = new Map<number, StreamingOffer[]>()
            let tempUncoveredGames = new Set(uncoveredGames)

            while (tempUncoveredGames.size > 0) {
                let bestProvider: number | null = null
                let bestOffer: StreamingOffer[] = []
                let mostCoveredGames = 0

                for (const [providerId, offers] of streamingOffersGroupByProvider) {
                    const coveredGamesByProvider = offers.filter((offer) =>
                        tempUncoveredGames.has(Number(offer.game_id))
                    )

                    if (coveredGamesByProvider.length > mostCoveredGames) {
                        mostCoveredGames = coveredGamesByProvider.length
                        bestProvider = providerId
                        bestOffer = coveredGamesByProvider
                    }
                }

                if (bestProvider === null || bestOffer.length === 0) {
                    break
                }

                selectedProviders.set(Number(bestProvider), bestOffer)

                for (const offer of bestOffer) {
                    tempUncoveredGames.delete(Number(offer.game_id))
                }

                streamingOffersGroupByProvider.delete(bestProvider)
            }

            const coveredGames = gamesToCover.length - tempUncoveredGames.size

            if (selectedProviders.size > 0) {
                allCombinations.push({ map: selectedProviders, coveredGames })
            }
        }

        allCombinations.sort((a, b) => b.coveredGames - a.coveredGames)

        const uniqueCombinations = allCombinations.filter(
            (combination, index, self) =>
                self.findIndex((c) => c.coveredGames === combination.coveredGames) === index
        );

        return uniqueCombinations.map((combination) => combination.map);
    },


    calculateTotalNumberOfMatches: (
        selectedProviders: Map<number, StreamingOffer[]>
    ): number => {
        let totalMatches = 0
        for (const offers of selectedProviders.values()) {
            totalMatches += offers.length
        }
        return totalMatches
    }
}