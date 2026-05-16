import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import { initPostHog } from './utils/posthog.js'
import { initAnalytics } from './utils/analytics.js'
import PostHogErrorBoundary from './components/PostHogErrorBoundary.jsx'

initPostHog();
initAnalytics();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 60,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <PostHogErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </PostHogErrorBoundary>,
)
