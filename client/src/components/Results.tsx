import { useLocation, useNavigate } from "react-router-dom"
import { useState } from "react"
import { StreamingPackageCombos } from "../types/StreamingPackageCombo.ts"
import StreamingPackageListItem from "./ResultsListItem.tsx"
import { useQuery } from "react-query"
import { teamService } from "../utils/teamService.ts"

export function Results() {
    const location = useLocation()
    const navigate = useNavigate()
    const initialStreamingPackageCombos = location.state.streamingPackagesResults as StreamingPackageCombos
    const games = location.state.games as string[]

    const { isLoading, isError, data } = useQuery({
        queryKey: ['games', games],
        queryFn: () => teamService.postTeamsForGames(games),
    })

    const [isPopupOpen, setIsPopupOpen] = useState(false)
    const [priceLimit, setPriceLimit] = useState("")
    const [streamingPackageCombos, setStreamingPackageCombos] = useState(initialStreamingPackageCombos)
    const [filteredForCheap, setFilteredForCheap] = useState(false)

    const handleSubmit = async () => {
        const price = parseFloat(priceLimit)
        if (isNaN(price) || price <= 0) {
            alert("Please enter a valid price limit.")
            return
        }

        try {
            const response = await teamService.postStreamingOffersForTeams(games, price)
            setStreamingPackageCombos(response)
            setFilteredForCheap(true)
        } catch (error) {
            console.error("Error fetching offers:", error)
            alert("Failed to fetch offers. Please try again.")
        } finally {
            setIsPopupOpen(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-yellow-500">
                Loading...
            </div>
        )
    }

    if (isError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-500">
                Error: Failed to fetch games
            </div>
        )
    }

    const anyGamesCovered = streamingPackageCombos.streaming_packages.length !== 0

    const allGamesCovered = anyGamesCovered
        ? streamingPackageCombos.streaming_packages[0].total_matches <= streamingPackageCombos.streaming_packages[0].covered_matches
        : false

    const bestCombinationCost = anyGamesCovered
        ? streamingPackageCombos.streaming_packages[0].packages.reduce((total, pkg) => total + pkg.cost_cents, 0) / 100
        : 0

    return (
        <div className="bg-gray-900">
            <button
                onClick={() => navigate("/")}
                className="m-6 px-4 py-2 text-lg font-medium text-gray-900 bg-yellow-500 rounded shadow-md hover:bg-yellow-600 retro-border"
            >
                Back
            </button>
            <div
                className="min-h-screen pt-8 text-white flex flex-col justify-center items-center font-mono">
                <div className="min-w-fit bg-gray-800 p-6 rounded-lg shadow-lg retro-border m-5">
                    <h1 className="text-2xl mb-4 text-center text-yellow-500">
                        Streaming Provider Results
                    </h1>
                    {
                        anyGamesCovered &&
                        <div className="flex items-center justify-between mb-2">
                            <p className={`text-center text-lg font-semibold ${allGamesCovered ? "text-green-400" : "text-yellow-500"}`}>
                                {allGamesCovered ? "Nice! All games covered 🎉" :
                                    "We tried our best, not all games could be covered... but here are a list of providers ranked by availability."}
                            </p>
                            { filteredForCheap && allGamesCovered && (
                                <p className="pl-2">Showing other alternatives as well :)</p>
                            )
                            }
                            {allGamesCovered && !filteredForCheap && bestCombinationCost > 0 && (
                                <button
                                    onClick={() => setIsPopupOpen(true)}
                                    className="ml-4 px-3 py-1 text-sm font-medium text-gray-900 bg-red-500 rounded shadow-md hover:bg-red-600 retro-border"
                                >
                                    Too expensive?
                                </button>
                            )}
                        </div>
                    }

                    <div className="flex flex-col">
                        <p className="mr-2 mb-1">Showing results for: </p>
                        <ul className="flex flex-wrap">
                            {games.map((game) => (
                                <li key={game}>
                                    <div
                                        className="inline-block px-3 py-1 mb-2 mr-2 text-sm font-medium text-white bg-gray-600 rounded-full">
                                        {game}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <ul className="mt-4 space-y-4">
                        {!anyGamesCovered && <p className="text-start text-lg font-semibold text-yellow-500">
                            There are no streaming packages that cover any matches...</p>}
                        {anyGamesCovered && streamingPackageCombos.streaming_packages.map((_, index) => (
                            <li key={index} className="bg-gray-700 p-4 rounded-lg shadow-md retro-border">
                                <StreamingPackageListItem
                                    streamingPackage={streamingPackageCombos.streaming_packages[index]}
                                    allGamesFromSelectedTeams={data || []}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {isPopupOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full retro-border">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Set a Price Limit</h2>
                        <input
                            type="number"
                            value={priceLimit}
                            onChange={(e) => setPriceLimit(e.target.value)}
                            placeholder="Enter price limit (e.g., 50)"
                            className="w-full px-4 py-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setIsPopupOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-300 rounded hover:bg-gray-400 retro-border"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-4 py-2 text-sm font-medium text-gray-900 bg-yellow-500 rounded shadow-md hover:bg-yellow-600 retro-border"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
