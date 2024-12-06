import teamModel from "../models/teamModel"
import {StreamingPackageResponse} from "../types/response"
import {Game, StreamingOffer, StreamingPackage} from "@prisma/client"
import {GameOffer} from "../types/game"


export const TeamService = {

    getStreamingOffers: async (
        teamNames: string[],
        priceLimit: number = Infinity
    ): Promise<{ streaming_packages: StreamingPackageResponse[] }> => {
        const gamesOfTeam = await TeamService.getGamesByTeam(teamNames)
        const streamingOffersOfTeam = TeamService.getStreamingOffersByGames(gamesOfTeam)
        const streamingOffersByProvider = TeamService.groupStreamingOfferByProvider(await streamingOffersOfTeam)
        const streamingPackages = await TeamService.getStreamingPackages()
        const costOfStreamingPackages = await TeamService.getCostOfStreamingPackages(streamingPackages)

        let combinations: Map<number, StreamingOffer[]>[] | null

        if (priceLimit === Infinity) {
            const fullCombination = TeamService.findFullAvailabilityCombination(
                gamesOfTeam,
                streamingOffersByProvider,
                costOfStreamingPackages
            )
            if (fullCombination) {
                combinations = [fullCombination]
            } else {
                combinations = TeamService.findListOfPartialAvailabilityCombinations(
                    gamesOfTeam,
                    streamingOffersByProvider,
                    costOfStreamingPackages
                )
            }
        } else {
            const fullCombination = TeamService.findFullAvailabilityCombination(
                gamesOfTeam,
                streamingOffersByProvider,
                costOfStreamingPackages
            )

            const partialCombinations = TeamService.findListOfPartialAvailabilityCombinations(
                gamesOfTeam,
                streamingOffersByProvider,
                costOfStreamingPackages
            )

            combinations = [
                ...(fullCombination ? [fullCombination] : []),
                ...(partialCombinations ?? []),
            ].filter((combination) => {
                // Calculate total cost of each combination
                const totalCost = Array.from(combination.keys()).reduce((sum, providerId) => {
                    const costTuple = costOfStreamingPackages.get(providerId) ?? [Infinity, false]
                    return sum + costTuple[0]
                }, 0)
                return totalCost / 100 <= priceLimit
            })

            // Filter out duplicates of combinations
            const seen = new Set<string>()
            if (combinations) {
                combinations = combinations.filter((combination) => {
                    const providerIds = Array.from(combination.keys()).sort().join(',')
                    if (seen.has(providerIds)) {
                        return false
                    }
                    seen.add(providerIds)
                    return true
                })
            }
        }

        if (!combinations || combinations.length === 0) {
            return { streaming_packages: [] }
        }

        const packages = combinations
            .map((combination) => {
                const totalCoveredMatches = TeamService.calculateTotalNumberOfMatches(combination)

                const formattedPackages = TeamService.formatStreamingPackagesToJson(
                    combination,
                    costOfStreamingPackages,
                    gamesOfTeam,
                    streamingPackages
                )

                return {
                    total_matches: gamesOfTeam.length * 2, // Each game can have live and highlights
                    covered_matches: totalCoveredMatches,
                    packages: formattedPackages,
                }
            }) as StreamingPackageResponse[]

        return { streaming_packages: packages }
    },

    formatStreamingPackagesToJson: (
        combination: Map<number, StreamingOffer[]>,
        costOfStreamingPackages: Map<number, [number, boolean]>,
        gamesOfTeam: Game[],
        streamingPackages: StreamingPackage[]
    ): StreamingPackageResponse['packages'] => {
        return Array.from(combination.entries()).map(([providerId, offers]) => {
            const costTuple = costOfStreamingPackages.get(providerId)
            const cost_cents = Array.isArray(costTuple) && costTuple.length === 2 ? costTuple[0] : 0
            const yearly_sub = Array.isArray(costTuple) && costTuple.length === 2 ? costTuple[1] : false

            const games = offers.map((offer) => {
                const game = gamesOfTeam.find((g) => g.id === Number(offer.game_id))

                if (!game) {
                    throw new Error(`Game with ID ${offer.game_id} not found in gamesOfTeam`)
                }

                return {
                    ...game,
                    live: offer.live,
                    highlights: offer.highlights,
                } as GameOffer
            })

            const provider = streamingPackages.find((sp) => providerId == sp.id)

            return {
                provider_id: providerId,
                provider_name: provider ? provider.name : 'Unknown Provider',
                yearly_sub,
                cost_cents,
                games,
            }
        })
    },

    getGamesByTeam: async (teamName: string[]) => {
        return await teamModel.getGamesByTeam(teamName)
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

    getCostOfStreamingPackages : (streamingPackages: StreamingPackage[]): Map<number, [number, boolean]> => {
        return new Map(
            streamingPackages.map((pkg) => [
                pkg.id?? 0,
                pkg.monthly_price_cents !== null
                    ? [pkg.monthly_price_cents, false]
                    : [pkg.monthly_price_yearly_subscription_in_cents ?? 0, true],
            ])
        )
    },

    getStreamingPackages : async (): Promise<StreamingPackage[]> => {
        return await teamModel.getStreamingPackages()
    },

    // This function follows the greedy algorithm set cover problem
    findFullAvailabilityCombination: (
        gamesToCover: Game[],
        streamingOffersGroupByProvider: Map<number, StreamingOffer[]>,
        streamingPackageCost: Map<number, [number, boolean]>
    ): Map<number, StreamingOffer[]> | null => {
        const streamingOffersGroupByProviderCopy = new Map<number, StreamingOffer[]>(streamingOffersGroupByProvider)

        const uncoveredGames = new Set(
            gamesToCover.map((game) => [game.id, false, false])
        )

        const selectedProviders = new Map<number, StreamingOffer[]>()

        while (uncoveredGames.size > 0) {
            let bestProvider: number | null = null
            let bestCostPerMatch = Infinity
            let bestOffer: StreamingOffer[] = []

            for (let [providerId, offers] of streamingOffersGroupByProviderCopy) {
                const costTuple = streamingPackageCost.get(providerId) ?? [Infinity, false]
                const cost = Array.isArray(costTuple) && costTuple.length === 2
                    ? costTuple[0]
                    : Infinity

                let coveredGamesByProvider = 0
                offers.forEach((offer) => {
                    for (const game of uncoveredGames) {
                        const [gameId, liveCovered, highlightsCovered] = game
                        if (
                            gameId === offer.game_id &&
                            ((offer.live && !liveCovered) || (offer.highlights && !highlightsCovered))
                        ) {
                            coveredGamesByProvider++
                        }
                    }
                })

                if (coveredGamesByProvider > 0) {
                    const costPerMatch = cost / coveredGamesByProvider
                    if (costPerMatch < bestCostPerMatch) {
                        bestCostPerMatch = costPerMatch
                        bestProvider = providerId
                        bestOffer = offers
                    }
                }
            }

            if (bestProvider === null || bestOffer.length === 0) {
                return null
            }

            selectedProviders.set(Number(bestProvider), bestOffer)

            bestOffer.forEach((offer) => {
                for (const game of uncoveredGames) {
                    const [gameId, liveCovered, highlightsCovered] = game
                    if (gameId === offer.game_id) {
                        if (offer.live) game[1] = true
                        if (offer.highlights) game[2] = true
                    }
                }
            })

            for (const game of Array.from(uncoveredGames)) {
                const [gameId, liveCovered, highlightsCovered] = game
                if (liveCovered && highlightsCovered) {
                    uncoveredGames.delete(game)
                }
            }

            streamingOffersGroupByProviderCopy.delete(bestProvider)
        }

        for (const [providerId, offers] of Array.from(selectedProviders.entries())) {
            const tempProviders = new Map(selectedProviders)
            tempProviders.delete(providerId)

            const tempCoveredGames = new Set(
                gamesToCover.map((game) => [game.id, false, false])
            )

            for (const [tempProviderId, tempOffers] of tempProviders) {
                tempOffers.forEach((offer) => {
                    for (const game of tempCoveredGames) {
                        const [gameId, liveCovered, highlightsCovered] = game
                        if (gameId === offer.game_id) {
                            if (offer.live) game[1] = true
                            if (offer.highlights) game[2] = true
                        }
                    }
                })

                for (const game of Array.from(tempCoveredGames)) {
                    const [gameId, liveCovered, highlightsCovered] = game
                    if (liveCovered && highlightsCovered) {
                        tempCoveredGames.delete(game)
                    }
                }
            }

            if (tempCoveredGames.size === 0) {
                selectedProviders.delete(providerId)
            }
        }

        return selectedProviders
    },

    // This function implements the greedy algorithm of the max coverage problem
    findListOfPartialAvailabilityCombinations: (
        gamesToCover: Game[],
        streamingOffersGroupByProvider: Map<number, StreamingOffer[]>,
        streamingPackageCost: Map<number, [number, boolean]>
    ): (Map<number, StreamingOffer[]>)[] | null => {

        const uncoveredGames = new Set(
            gamesToCover.map((game) => [game.id, false, false]) // [gameId, liveCovered, highlightsCovered]
        )
        const allCombinations: { map: Map<number, StreamingOffer[]>, coveredGames: number }[] = []
        let iterations = 0

        while (uncoveredGames.size > 0 && iterations < streamingOffersGroupByProvider.size) {

            iterations += 1

            const streamingOffersGroupByProviderCopy = new Map<number, StreamingOffer[]>(streamingOffersGroupByProvider)
            const selectedProviders = new Map<number, StreamingOffer[]>()

            const tempUncoveredGames = new Set(uncoveredGames)

            const providerIds = Array.from(streamingOffersGroupByProviderCopy.keys())
            const ithProviderId = providerIds[iterations - 1]
            const ithProviderOffers = streamingOffersGroupByProviderCopy.get(ithProviderId)

            if (ithProviderOffers) {
                selectedProviders.set(ithProviderId, ithProviderOffers)

                ithProviderOffers.forEach((offer) => {
                    for (const game of tempUncoveredGames) {
                        const [gameId, liveCovered, highlightsCovered] = game
                        if (gameId === offer.game_id) {
                            if (offer.live) game[1] = true
                            if (offer.highlights) game[2] = true
                        }
                    }
                })

                for (const game of Array.from(tempUncoveredGames)) {
                    const [gameId, liveCovered, highlightsCovered] = game
                    if (liveCovered && highlightsCovered) {
                        tempUncoveredGames.delete(game)
                    }
                }
                streamingOffersGroupByProviderCopy.delete(ithProviderId)
            }


            while (tempUncoveredGames.size > 0) {
                let bestProvider: number | null = null
                let bestOffer: StreamingOffer[] = []
                let mostCoveredGames = 0
                let lowestCost = Infinity

                for (const [providerId, offers] of streamingOffersGroupByProviderCopy) {
                    let coveredGamesByProvider = 0

                    offers.forEach((offer) => {
                        for (const game of tempUncoveredGames) {
                            const [gameId, liveCovered, highlightsCovered] = game
                            if (
                                gameId === offer.game_id &&
                                ((offer.live && !liveCovered) || (offer.highlights && !highlightsCovered))
                            ) {
                                coveredGamesByProvider++
                            }
                        }
                    })

                    if (coveredGamesByProvider > 0) {
                        const costTuple = streamingPackageCost.get(providerId) ?? [Infinity, false]
                        const cost = costTuple[0]

                        if (
                            coveredGamesByProvider > mostCoveredGames ||
                            (coveredGamesByProvider === mostCoveredGames && cost < lowestCost)
                        ) {
                            mostCoveredGames = coveredGamesByProvider
                            lowestCost = cost
                            bestProvider = providerId
                            bestOffer = offers
                        }
                    }
                }

                if (bestProvider === null || bestOffer.length === 0) {
                    break
                }

                selectedProviders.set(Number(bestProvider), bestOffer)

                bestOffer.forEach((offer) => {
                    for (const game of tempUncoveredGames) {
                        const [gameId, liveCovered, highlightsCovered] = game
                        if (gameId === offer.game_id) {
                            if (offer.live) game[1] = true
                            if (offer.highlights) game[2] = true
                        }
                    }
                })

                for (const game of Array.from(tempUncoveredGames)) {
                    const [gameId, liveCovered, highlightsCovered] = game
                    if (liveCovered && highlightsCovered) {
                        tempUncoveredGames.delete(game)
                    }
                }

                streamingOffersGroupByProviderCopy.delete(bestProvider)
            }

            const coveredGames = gamesToCover.length - Array.from(tempUncoveredGames).length

            if (selectedProviders.size > 0) {
                allCombinations.push({ map: selectedProviders, coveredGames })
            }
        }

        allCombinations.sort((a, b) => {
            const aTotalCovered = Array.from(a.map.values()).flat().length
            const bTotalCovered = Array.from(b.map.values()).flat().length

            const aFullCoverage = Array.from(a.map.values())
                .flat()
                .reduce((count, offer) => {
                    const game = gamesToCover.find((g) => g.id === offer.game_id)
                    if (game && offer.live && offer.highlights) {
                        return count + 1
                    }
                    return count
                }, 0)

            const bFullCoverage = Array.from(b.map.values())
                .flat()
                .reduce((count, offer) => {
                    const game = gamesToCover.find((g) => g.id === offer.game_id)
                    if (game && offer.live && offer.highlights) {
                        return count + 1
                    }
                    return count
                }, 0)

            const aCost = Array.from(a.map.keys()).reduce((total, providerId) => {
                const costTuple = streamingPackageCost.get(providerId) ?? [Infinity, false]
                return total + costTuple[0]
            }, 0)

            const bCost = Array.from(b.map.keys()).reduce((total, providerId) => {
                const costTuple = streamingPackageCost.get(providerId) ?? [Infinity, false]
                return total + costTuple[0]
            }, 0)

            // Sorting logic:
            // 1. By total games covered (descending).
            // 2. By full coverage count (descending).
            // 3. By total cost (ascending).
            if (bTotalCovered !== aTotalCovered) {
                return bTotalCovered - aTotalCovered
            }
            if (bFullCoverage !== aFullCoverage) {
                return bFullCoverage - aFullCoverage
            }
            return aCost - bCost
        })

        return allCombinations
            .map((combination) => combination.map)
    },

    calculateTotalNumberOfMatches: (selectedProviders: Map<number, StreamingOffer[]>): number => {
        const countedMatches = new Set<string>()

        for (const offers of selectedProviders.values()) {
            for (const offer of offers) {
                if (offer.live) {
                    countedMatches.add(`${offer.game_id}l`)
                }
                if (offer.highlights) {
                    countedMatches.add(`${offer.game_id}h`)
                }
            }
        }
        return countedMatches.size
    },

    getAllTeams: async () => {
        return teamModel.getAllUniqueTeams()
    },
}