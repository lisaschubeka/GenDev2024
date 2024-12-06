import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom"
import Selection from "./components/Selection.tsx"
import { QueryClient, QueryClientProvider } from 'react-query'
import {Results} from "./components/Results.tsx"

const queryClient = new QueryClient()

const router = createBrowserRouter([
    {
        path: "/",
        element: <Selection/>,
    },
    {
        path: "/result",
        element: <Results/>
    }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
  </StrictMode>,
)


