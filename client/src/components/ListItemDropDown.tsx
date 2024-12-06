import { useState } from "react"
import { ResultsListItemProps } from "./ResultsListItem.tsx"
import { Game } from "../types/Game.ts"
import { getProviderImage } from "../utils/assetsHelper.ts"
import {CheckCircleIcon, ChevronDownIcon, XCircleIcon} from "@heroicons/react/24/outline"
import {Package} from "../types/StreamingPackageCombo.ts"

export function ListItemDropDown({ streamingPackage, allGamesFromSelectedTeams }: ResultsListItemProps) {
    const [expandedTournaments, setExpandedTournaments] = useState<Record<string, boolean>>({})

    const gamesGroupedByTournament = allGamesFromSelectedTeams.reduce<Record<string, Game[]>>(
        (groups, game) => {
            if (!groups[game.tournament_name]) {
                groups[game.tournament_name] = []
            }
            groups[game.tournament_name].push(game)
            return groups
        },
        {}
    )

    const toggleTournament = (tournamentName: string) => {
        setExpandedTournaments((prev) => ({
            ...prev,
            [tournamentName]: !prev[tournamentName],
        }))
    }

    const getProviderStatusForTournament = (pkg: Package, games: Game[], live: boolean) => {
        const totalGames = games.length
        const availableGames = pkg.games.filter((pkgGame) =>
             games.some((game) => game.id === pkgGame.id) && (live? pkgGame.live : pkgGame.highlights)
        ).length

        if (availableGames === totalGames) {
            return <CheckCircleIcon className="w-11 h-11 text-green-500" />
        } else if (availableGames > 0) {
            return <CheckCircleIcon className="w-11 h-11 text-yellow-500" />
        } else {
            return <XCircleIcon className="w-11 h-11 text-red-500" />
        }
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center">
                <div className="w-1/2">
                </div>
                <div className="flex space-x-2 w-1/2 justify-evenly">
                    {streamingPackage.packages.map((pkg) => (
                        <div key={pkg.provider_id} className="">
                            <img
                                src={getProviderImage(pkg.provider_id)}
                                alt={`Provider ${pkg.provider_id}`}
                                className="w-12 h-12 object-contain ml-4 rounded-md shadow-md retro-border"
                            />
                            <p className="text-xs font-medium text-center mt-2">{
                                pkg.provider_name.replace(" - ", "-").length > 9
                                ? pkg.provider_name.replace(" - ", "-").substring(0, 9) + "..."
                                : pkg.provider_name.replace(" - ", "-")}</p>

                            <div className="flex items-center space-x-5">
                                <p className="inline-block text-xs font-medium text-white py-1 rounded-full">
                                    Live
                                </p>
                                <p className="inline-block text-xs font-medium text-white py-1 rounded-full">Highl.</p>
                            </div>
                        </div>
                    ))}
                </div>
                <ChevronDownIcon color="white"
                                 className={`invisible w-4 right-3 transform transition-transform "rotate-180"`}/>

            </div>


            {Object.entries(gamesGroupedByTournament).map(([tournamentName, games]) => (
                <div key={tournamentName} className="my-1 border-b py-2">
                    <div
                        className="flex justify-between items-center cursor-pointer relative"
                        onClick={() => toggleTournament(tournamentName)}
                    >
                        <h3 className="text-lg font-bold w-1/2">{tournamentName}</h3>

                        <div className="flex w-1/2 justify-evenly">
                        {streamingPackage.packages.map((pkg) => {
                            return (
                                <div key={pkg.provider_id} className="flex space-x-2">
                                    {getProviderStatusForTournament(pkg, games, true)}
                                    {getProviderStatusForTournament(pkg, games, false)}
                                </div>
                            )
                        })}
                        </div>
                        <ChevronDownIcon color="white"
                                         className={`w-4 right-3 transform transition-transform ${expandedTournaments[tournamentName] ? "rotate-180" : ""}`}/>

                    </div>

                    {expandedTournaments[tournamentName] && (
                        <div className="mt-4">
                            <div className="flex flex-col space-y-2">
                                {games.map((game) => (
                                    <div key={game.id} className="flex justify-between items-center pb-2 border-b border-gray-600 last:border-none">
                                        <div className="w-1/2">
                                            <GameInfo game={game} />
                                        </div>

                                        <div className="flex w-1/2 justify-evenly">
                                            {streamingPackage.packages.map((pkg) => (
                                                <div key={pkg.provider_id} className="flex items-center space-x-2">
                                                    {pkg.games.some(
                                                        (pkgGame) =>
                                                            pkgGame.id === game.id && pkgGame.live
                                                    ) ? (
                                                        <CheckCircleIcon className="w-11 h-11 text-green-500" />
                                                    ) : (
                                                        <XCircleIcon className="w-11 h-11 text-red-500" />
                                                    )}
                                                    {pkg.games.some(
                                                        (pkgGame) =>
                                                            pkgGame.id === game.id && pkgGame.highlights
                                                    ) ? (
                                                        <CheckCircleIcon className="w-11 h-11 text-green-500" />
                                                    ) : (
                                                        <XCircleIcon className="w-11 h-11 text-red-500" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <ChevronDownIcon color="white"
                                                         className={`invisible w-4 right-3 transform transition-transform "rotate-180"`}/>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

type GameInfoProps = {
    game: Game
}

export function GameInfo({ game }: GameInfoProps) {
    return (
        <div>
            <p className="text-sm font-medium">
                {game.team_home} vs {game.team_away}
            </p>
            <p className="text-xs text-gray-500">
                {new Date(game.starts_at).toLocaleString()}
            </p>
        </div>
    )
}
