# GenDev Streaming Package Comparison Challenge

This challenge involves finding the best combination of streaming packages for a given team or multiple teams that
provides the most matches (live streams/highlights) at the lowest cost for users. I hope you like what I have
developed :)

# Video Demo

TODO

# Repository Structure

This repository is a mono-repository that combines both client- and server-side components.

### Client

The client-side services are built using [TypeScript](https://www.typescriptlang.org/), [React](https://react.dev/)
and [TailwindCSS](https://tailwindcss.com/).

- **React**: Contains the logic for the client-side services.
- **TailwindCSS**: Used for styling the client-side UI.

### Server

The server-side services are written using [TypeScript](https://www.typescriptlang.org/),
[ExpressJS](https://expressjs.com/), [Prisma](https://www.prisma.io/), and
[PostgreSQL](https://www.postgresql.org/).

- **ExpressJS**: Used for routing requests and validating the content of requests from the client
- **Prisma**: Prisma is an open source ORM that has an auto-generated and type-safe query builder. It contains the
  connection to the database in this project and defines the application model.
- **PostgreSQL**: Used for the database in this project.
- **Docker**: Allows the user to run the application in an isolated container.

# How to get started

1. Install and run [Docker Desktop](https://www.docker.com/).
2. Clone this repository and navigate in a terminal to the repository root.
3. Run `docker-compose up --build`
4. Open `http://localhost:5173` in a browser.

# Approach

The search for best combinations can be reduced to two classical questions in theoretical computer science called the
[set cover problem](https://math.mit.edu/~goemans/18434S06/setcover-tamara.pdf) and the
[maximum coverage problem](https://en.wikipedia.org/wiki/Maximum_coverage_problem).

The aim of the search is to first attempt to find a combination of packages that is the **cheapest** and **covers all
games** (both highlights and live streams) using the weighted greedy set cover algorithm. If no combination can be
found that covers all games, the **greedy max coverage algorithm** will be used to find combinations that **covers as
many matches** (both highlights and live streams) as possible, ranked.

### Modifications to both Algorithms

- Instead of finding subsets that aim to cover the entire "universe" of elements, we are finding subsets that aim to
  cover all the matches of teams selected by the users.

### Weighted Set Cover Problem

The problem of finding the cheapest combination of streaming packages can be reduced to the weighted set cover
problem. The games can be considered as the elements in this "universe" and the games offered by each streaming
package can be considered as subsets with overlap. Each game has a weight of $$priceOfStreamingPackage /
gamesCoveredByStreamingPackage$$

I have chosen to implement the **greedy algorithm of the set cover problem** due to the size of the dataset being
rather small, and therefore the chances of being stuck in local minima is quite limited.

The algorithm iteratively adds the streaming package with the lowest weight to the combination until no more streaming packages offer games that are not yet covered.

### Maximum Coverage Problem

The problem of trying to find a set of combinations that cover as many matches as possible can be reduced to the maximum coverage problem with some modifications. Instead of selecting at most $k$ subsets that cover as many elements as possible, streaming packages that cover the most games for a combination are iteratively selected until no more streaming packages offer games that are not yet covered.

For this problem I have also chosen to use the greedy algorithm of the maximum coverage problem. The reason is the 
same as the usage of the previous algorithm.

To offer the users a variety of options, I have used a simple approach to generate a ranked list of combinations, by number of matches covered. This approach iterates through all the streaming packages, and in each iteration adds the ith package to the ith combination and starts with the greedy algorithm from there to find the combination that covers as many games as possible.

# Further Improvements

- Implement searching of date ranges and leagues.
- Write unit tests for the set cover and maximum coverage algorithms to verify correctness and edge cases.

# TODOs

- Documentation - the algorithms first attempt to find one combination that covers everything, then if this fails
  tries to find a list of partial combinations
- FOLLOW THE APPROACH AND SEE IF TI WORKS

# Extra
- The additional stuff the challenge suggests to implement

# Done TODOs
- The algorithm currently does not distinguish between live and highlights
- Add details button to see monthly/yearly subscription
- Naming of variables
- Docker stuff (images don't add them directly and database)
- Check all TODOs in the code