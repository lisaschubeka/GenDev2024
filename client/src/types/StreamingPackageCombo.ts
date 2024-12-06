import {GameOffer} from "./Game.ts"

export type StreamingPackageCombo = {
    total_matches: number
    covered_matches: number
    packages: Package[]
}

export type Package = {
    provider_id: number
    provider_name: string
    yearly_sub: boolean
    cost_cents: number
    games: GameOffer[]
}

export type StreamingPackageCombos = {
    streaming_packages: StreamingPackageCombo[]
}

export type StreamingPackage = {
    id: Number,
    name: string,
    monthly_price_cents: Number,
    monthly_price_yearly_subscription_in_cents: Number
}
