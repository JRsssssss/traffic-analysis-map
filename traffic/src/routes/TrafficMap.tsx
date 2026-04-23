

import { createFileRoute } from '@tanstack/react-router'
import  TrafficDashboard  from '../components/TrafficDashboard'

export const Route = createFileRoute('/TrafficMap')({
  component: TrafficDashboard,
})