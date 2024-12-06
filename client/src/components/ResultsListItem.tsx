import { useState } from "react"
import { getProviderImage } from "../utils/assetsHelper.ts"
import { StreamingPackageCombo } from "../types/StreamingPackageCombo.ts"
import { ListItemDropDown } from "./ListItemDropDown.tsx"
import { Game } from "../types/Game.ts"
import { ChevronDownIcon } from "@heroicons/react/24/outline"

export type ResultsListItemProps = {
    streamingPackage: StreamingPackageCombo
    allGamesFromSelectedTeams: Game[]
}

function ResultsListItem({ streamingPackage, allGamesFromSelectedTeams }: ResultsListItemProps) {
    const [expanded, setExpanded] = useState(false)
    const [showModal, setShowModal] = useState(false)

    const calculateTotalCost = () => {
        const totalCents = streamingPackage.packages.reduce((sum, pkg) => sum + pkg.cost_cents, 0)
        return (totalCents / 100).toFixed(2)
    }

    const handleModalToggle = () => setShowModal(!showModal)

    return (
        <div className="flex flex-col bg-gray-800 p-6 rounded-lg shadow-lg retro-border">
            <div className="flex items-center justify-between">
                <div className="flex items-center justify-between space-x-6">
                    <div className="flex space-x-2">
                        {streamingPackage.packages.map((pkg) => (
                            <img
                                key={pkg.provider_id}
                                src={getProviderImage(pkg.provider_id)}
                                alt={`Provider ${pkg.provider_id}`}
                                className="w-12 h-12 object-contain rounded-md shadow-md"
                            />
                        ))}
                    </div>

                    <button
                        onClick={handleModalToggle}
                        className="px-2 py-2 text-sm font-bold text-gray-900 bg-blue-500 rounded shadow-md hover:bg-blue-600"
                    >
                        View Details
                    </button>
                </div>


                <div className="flex items-center space-x-4 pl-40">
                    <span className="font-bold text-2xl text-yellow-500">
                        €{calculateTotalCost()}
                    </span>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="px-4 py-2 text-sm font-bold text-gray-900 bg-yellow-500 rounded shadow-md hover:bg-yellow-600 retro-border"
                    >
                        <ChevronDownIcon
                            className={`w-5 transform transition-transform ${expanded ? "rotate-180" : ""}`}
                        />
                    </button>
                </div>
            </div>

            {expanded && (
                <ListItemDropDown streamingPackage={streamingPackage}
                                  allGamesFromSelectedTeams={allGamesFromSelectedTeams}/>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg retro-border">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Price Details</h2>
                        <ul className="text-gray-700 font-mono">
                            {streamingPackage.packages.map((pkg) => (
                                <li key={pkg.provider_id} className="flex items-center space-x-5 mb-2">
                                    <img
                                        key={pkg.provider_id}
                                        src={getProviderImage(pkg.provider_id)}
                                        alt={`Provider ${pkg.provider_id}`}
                                        className="w-12 h-12 object-contain rounded-md shadow-md"
                                    />
                                    <span className="font-bold">{pkg.provider_name}</span>:
                                    €{(pkg.cost_cents / 100).toFixed(2)}
                                    <p>{pkg.yearly_sub? "(Yearly subscription)" : ""}</p>
                                </li>

                            ))}
                        </ul>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleModalToggle}
                                className="px-4 py-2 text-sm font-bold text-gray-900 bg-red-500 rounded shadow-md hover:bg-red-600 retro-border"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ResultsListItem
