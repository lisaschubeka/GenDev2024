export type StreamingPackage = {
    total_matches: number;
    covered_matches: number;
    packages: {
        // TODO mention it in the documentation, not a smart approach when the provider IRL changes
        // suffices for this project since the csv data is not changing
        provider_id: number;
        yearly_sub: boolean;
        cost_cents: number;
        games: number[];
    }[];
};

export type StreamingPackagesResponse = {
    streaming_packages: StreamingPackage[]; // Array of streaming packages
};
