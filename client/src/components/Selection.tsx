import Select from "react-select"
import {useQuery} from "react-query"
import makeAnimated from 'react-select/animated'
import {teamService} from "../utils/teamService.ts"
import {useState} from "react"
import {useNavigate} from "react-router-dom"

interface TeamOption {
    label: string
    value: string
}

const animatedComponents = makeAnimated()

function Selection() {
    const navigate = useNavigate()
    const [selectedTeams, setSelectedTeams] = useState([])
    const [showWarning, setShowWarning] = useState(false)

    const handleChange = (e) => {
        setSelectedTeams(Array.isArray(e) ? e.map(x => x.label) : [])
    }

    const { isLoading, isError, data } = useQuery({
        queryKey: ['allTeams'],
        queryFn: teamService.getAllTeams,
    })

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
                Error: Failed to fetch teams.
            </div>
        )
    }

    const options: TeamOption[] = data
        ? data.map((team: string) => ({
            label: team,
            value: team.toLowerCase().replace(/\s+/g, ""),
        }))
        : []

    const handleButtonClick = async () => {

        if (selectedTeams.length === 0) {
            setShowWarning(true) // Show the warning
            setTimeout(() => setShowWarning(false), 3000) // Automatically hide after 3 seconds
            return
        }

        try {
            const response = await teamService.postStreamingOffersForTeams(selectedTeams)
            // Redirect to /result with the data
            navigate('/result', { state: {streamingPackagesResults: response, games: selectedTeams }})
        } catch (error) {
            console.error("Failed to fetch streaming offers:", error)
            alert("Failed to fetch streaming offers. Please try again.")
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center font-mono">
            <div className="w-11/12 sm:w-1/2 bg-gray-800 p-6 rounded-lg shadow-lg retro-border">
                <h1 className="text-2xl mb-4 text-center text-yellow-500">Streaming Package Finder</h1>

                {isLoading ? (
                    <p className="text-yellow-500 text-center">Loading teams...</p>
                ) : isError ? (
                    <p className="text-red-500 text-center">
                        { "Failed to load football teams."}
                    </p>
                ) : (
                    <>
                        <Select
                            options={options}
                            isMulti
                            onChange={handleChange}
                            components={animatedComponents}
                            placeholder="Search or Select Football Teams..."
                            className="text-gray-900"
                            classNamePrefix="react-select"
                        />
                        <button
                            onClick={handleButtonClick}
                            className="mt-4 w-full bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg shadow-lg font-bold hover:bg-yellow-600"
                        >
                            Get Streaming Offers
                        </button>

                        {showWarning && (
                            <div className="fixed top-10 left-1/2 transform -translate-x-1/2 w-3/4 max-w-md bg-red-500 text-white border border-red-700 rounded-lg shadow-lg p-4 font-mono text-center z-50">
                                ⚠️ Please select at least one team.
                            </div>
                        )}

                    </>
                )}
            </div>
        </div>
    )
}

export default Selection
