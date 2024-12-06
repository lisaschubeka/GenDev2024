import {GameOffer} from "./game"

export type StreamingPackageResponse = {
    total_matches: number
    covered_matches: number
    packages: {
        provider_id: number
        provider_name: string
        yearly_sub: boolean
        cost_cents: number
        games: GameOffer[]
    }[]
}

export type StreamingPackagesResponse = {
    streaming_packages: StreamingPackageResponse[]
}
