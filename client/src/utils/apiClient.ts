import axios, {AxiosInstance} from "axios"

class ApiClient {
    private client: AxiosInstance

    constructor(baseURL: string) {
        this.client = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
        })
    }

    get<T>(url: string, params?: unknown) {
        return this.client.get<T>(url, {params})
    }

    post<T>(url: string, data: unknown) {
        return this.client.post<T>(url, data)
    }
}

export const apiClient = new ApiClient("http://localhost:4000")

export function postprocessResponse<T>(data: T): T {
    if (data !== null && typeof data === "object") {
        if (Array.isArray(data)) {
            return data.map(item => postprocessResponse(item)) as T
        }

        return Object.keys(data).reduce((acc, key) => {
            const value = (data as Record<string, unknown>)[key]

            if (typeof value === "object" && value !== null) {
                (acc as Record<string, unknown>)[key] = postprocessResponse(value)
            } else {
                (acc as Record<string, unknown>)[key] = value
            }

            return acc
        }, {} as T)
    }

    return data
}