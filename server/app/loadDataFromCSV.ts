import fs from 'fs';
import csvParser from 'csv-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function loadCSV(filePath: string): Promise<unknown> {
    const data: any[] = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => data.push(row))
            .on('end', () => resolve(data))
            .on('error', (error) => reject(error));
    });
}

export async function loadData() {
    try {
        const streamingPackages = await loadCSV('server/csv/bc_streaming_package.csv');
        for (const p of streamingPackages) {
            await prisma.streamingPackage.create({
                data: {
                    id: Number(p.id),
                    name: p.name,
                    monthly_price_cents: Number(p.monthly_price_cents),
                    monthly_price_yearly_subscription_in_cents: Number(p.monthly_price_yearly_subscription_in_cents),
                },
            });
        }

        const games = await loadCSV('server/csv/bc_game.csv');
        for (const game of games) {
            await prisma.game.create({
                data: {
                    id: Number(game.id),
                    team_home: game.team_home,
                    team_away: game.team_away,
                    starts_at: new Date(game.starts_at),
                    tournament_name: game.tournament_name,
                },
            });
        }

        const streamingOffers = await loadCSV('server/csv/bc_streaming_offer.csv');
        for (const offer of streamingOffers) {
            await prisma.streamingOffer.create({
                data: {
                    game_id: Number(offer.game_id),
                    streaming_package_id: Number(offer.streaming_package_id),
                    live: offer.live === 'true',
                    highlights: offer.highlights === 'true',
                },
            });
        }

        console.log('Data loaded successfully');
    } catch (error) {
        console.error('Error loading data:', error);
    } finally {
        await prisma.$disconnect();
    }
}
