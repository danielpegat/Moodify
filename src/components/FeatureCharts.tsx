import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MoodAnalysis } from '../lib/types'

export function FeatureRadar({ analysis }: { analysis: MoodAnalysis }) {
  const a = analysis.averages
  const data = [
    { name: 'Valence', value: Math.round(a.valence * 100) },
    { name: 'Energy', value: Math.round(a.energy * 100) },
    { name: 'Dance', value: Math.round(a.danceability * 100) },
    { name: 'Acoustic', value: Math.round(a.acousticness * 100) },
    { name: 'Instrumental', value: Math.round(a.instrumentalness * 100) },
  ]

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#adb3b0" />
          <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#5a605e' }} />
          <Radar
            name="Profile"
            dataKey="value"
            stroke="#5e5e5e"
            fill="#5e5e5e"
            fillOpacity={0.25}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function EnergyMoodBars({ analysis }: { analysis: MoodAnalysis }) {
  const a = analysis.averages
  const rows = [
    { name: 'Mood (valence)', v: Math.min(100, Math.round(a.valence * 100)) },
    { name: 'Energy', v: Math.min(100, Math.round(a.energy * 100)) },
    { name: 'Tempo /2', v: Math.min(100, Math.round(a.tempo / 2)) },
  ]

  return (
    <div className="h-52 w-full border-l border-b border-outline/20 pl-2 pb-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dee4e0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#5a605e' }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} width={32} />
          <Tooltip
            contentStyle={{
              borderRadius: 0,
              border: '1px solid #dee4e0',
              fontSize: 12,
            }}
          />
          <Bar dataKey="v" fill="#5e5e5e" radius={0} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
