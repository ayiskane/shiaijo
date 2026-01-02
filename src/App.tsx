import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
// import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Toaster, toast } from 'sonner'

// Renbu Dojo Logo SVG Component - Orange fill with black strokes
// Shiaijo Logo - Minimalist frame style with Renbu logo behind
const ShiaijoLogo = ({ size = 48, glow = false }: { size?: number; glow?: boolean }) => (
  <img 
    src="/shiaijo-logo.png" 
    alt="試合場 Shiaijo"
    style={{ 
      height: size,
      width: 'auto',
      filter: glow ? 'drop-shadow(0 0 20px rgba(249, 115, 22, 0.3))' : undefined
    }}
  />
)


import { 
  Users, Settings, Trophy, Play, Pause, RotateCcw, 
  Plus, Trash2, Upload, Search, Filter, X, Edit2,
  Menu, Swords, UserPlus, Home,
  CheckCircle2, Table, History, RefreshCw,
  ArrowLeftRight, Award, ChevronLeft, Undo2, ChevronDown, ChevronUp, Heart, Clock,
  Eye, Shield, Lock
} from 'lucide-react'

// Types
interface Member {
  id: string
  firstName: string
  lastName: string
  group: string
  isGuest: boolean
  guestDojo?: string
  isParticipating: boolean
}

interface Group {
  id: string
  name: string
  isNonBogu: boolean
}

interface Match {
  id: string
  groupId: string
  player1Id: string
  player2Id: string
  player1Score: number[]  // Score IDs: 1=Men, 2=Kote, 3=Do, 4=Tsuki, 5=Hansoku (opponent got 2)
  player2Score: number[]
  player1Hansoku: number  // Count of hansoku for player 1
  player2Hansoku: number  // Count of hansoku for player 2
  winner: string | null
  status: 'pending' | 'in_progress' | 'completed'
  court: 'A' | 'B'
  isHantei: boolean
  matchType: 'sanbon' | 'ippon'  // sanbon = first to 2, ippon = first to 1
  timerDuration: number  // in seconds
  actualDuration?: number  // recorded when match completes
  orderIndex: number
  round: number  // Round number (1 = initial round robin, 2+ = tiebreakers/playoffs)
}

interface Tournament {
  id: string
  name: string
  date: string
  month: string
  year: number
  status: 'setup' | 'in_progress' | 'completed'
  matches: Match[]
  groups: string[]
  groupOrder: string[]
  timerOptions: number[]  // Available timer durations in seconds
  defaultTimerDuration: number  // Default timer duration
}

interface TournamentHistory {
  id: string
  name: string
  date: string
  month: string
  year: number
  results: {
    groupId: string
    groupName: string
    isNonBogu: boolean
    standings: {
      rank: number
      playerName: string
      points: number
      wins: number
      losses: number
      draws: number
    }[]
  }[]
}

interface PlayerStanding {
  playerId: string
  playerName: string
  points: number
  wins: number
  draws: number
  losses: number
  gamesLeft: number
  ipponsScored: number
  ipponsAgainst: number
  results: Map<string, 'W' | 'L' | 'D' | null>
}

interface VolunteerSignup {
  id: string
  tournamentId: string
  tournamentName: string
  date: string
  hours: number
  minutes: number
  description: string
  isShiaiSignup: boolean
  shiaiRole?: 'courtkeeper' | 'general'
}

interface Volunteer {
  id: string
  firstName: string
  lastName: string
  phone?: string
  relatedMemberIds: string[]
  signups: VolunteerSignup[]
}

interface AppState {
  members: Member[]
  courtASelectedMatch: string | null  // Override queue with this match
  courtBSelectedMatch: string | null
  courtAGroupOrder: string[]  // Custom group order for Court A queue
  courtBGroupOrder: string[]  // Custom group order for Court B queue
  sharedGroups: string[]  // Groups that run on both courts simultaneously
  groups: Group[]
  guestRegistry: Member[]
  currentTournament: Tournament | null
  currentMatchIndexA: number
  currentMatchIndexB: number
  activeCourt: 'A' | 'B'
  timerSecondsA: number
  timerSecondsB: number
  timerRunningA: boolean
  timerRunningB: boolean
  timerTarget: number
  history: TournamentHistory[]
  lastUpdated?: number
  useFirstNamesOnly: boolean
  adminPassword: string
  courtkeeperPassword: string
  volunteers: Volunteer[]
}

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9)

// Helper to format member display name
const formatDisplayName = (member: Member, allMembers: Member[], useFirstNamesOnly: boolean): string => {
  if (!useFirstNamesOnly) {
    return `${member.lastName}, ${member.firstName}`
  }
  
  // Check if there are multiple people with the same first name
  const sameFirstName = allMembers.filter(m => 
    m.firstName.toLowerCase() === member.firstName.toLowerCase() && m.id !== member.id
  )
  
  if (sameFirstName.length > 0) {
    // Add last name initial for disambiguation
    return `${member.firstName} ${member.lastName[0]}.`
  }
  
  return member.firstName
}


// Test data generation


const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Generate round robin with rest optimization
const generateRoundRobinWithRest = (playerIds: string[]): [string, string][] => {
  if (playerIds.length < 2) return []
  
  const players = [...playerIds]
  if (players.length % 2 !== 0) {
    players.push('BYE')
  }
  
  const n = players.length
  const rounds: [string, string][][] = []
  
  for (let round = 0; round < n - 1; round++) {
    const roundMatches: [string, string][] = []
    for (let i = 0; i < n / 2; i++) {
      const p1 = players[i]
      const p2 = players[n - 1 - i]
      if (p1 !== 'BYE' && p2 !== 'BYE') {
        roundMatches.push([p1, p2])
      }
    }
    rounds.push(roundMatches)
    const last = players.pop()!
    players.splice(1, 0, last)
  }
  
  const allMatches: [string, string][] = []
  const lastPlayed: Map<string, number> = new Map()
  const flatMatches = rounds.flat()
  const used = new Set<number>()
  
  while (allMatches.length < flatMatches.length) {
    let bestMatch = -1
    let bestScore = -1
    
    for (let i = 0; i < flatMatches.length; i++) {
      if (used.has(i)) continue
      const [p1, p2] = flatMatches[i]
      const p1Last = lastPlayed.get(p1) ?? -10
      const p2Last = lastPlayed.get(p2) ?? -10
      const minRest = Math.min(allMatches.length - p1Last, allMatches.length - p2Last)
      
      if (minRest > bestScore) {
        bestScore = minRest
        bestMatch = i
      }
    }
    
    if (bestMatch === -1) break
    
    used.add(bestMatch)
    const [p1, p2] = flatMatches[bestMatch]
    lastPlayed.set(p1, allMatches.length)
    lastPlayed.set(p2, allMatches.length)
    allMatches.push([p1, p2])
  }
  
  return allMatches
}

// Calculate standings for a group
const calculateStandings = (
  groupId: string,
  matches: Match[],
  members: Member[],
  useFirstNamesOnly: boolean = false
): PlayerStanding[] => {
  const groupMatches = matches.filter(m => m.groupId === groupId && m.status === 'completed')
  const allGroupMatches = matches.filter(m => m.groupId === groupId)
  const groupMembers = members.filter(m => m.group === groupId && m.isParticipating)
  
  const standings: Map<string, PlayerStanding> = new Map()
  
  groupMembers.forEach(member => {
    // Count pending/in_progress matches for this player
    const pendingMatches = allGroupMatches.filter(m => 
      m.status !== 'completed' && (m.player1Id === member.id || m.player2Id === member.id)
    )
    
    standings.set(member.id, {
      playerId: member.id,
      playerName: formatDisplayName(member, groupMembers, useFirstNamesOnly),
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gamesLeft: pendingMatches.length,
      ipponsScored: 0,
      ipponsAgainst: 0,
      results: new Map(),
    })
  })
  
  groupMatches.forEach(match => {
    const p1Standing = standings.get(match.player1Id)
    const p2Standing = standings.get(match.player2Id)
    
    if (!p1Standing || !p2Standing) return
    
    const p1Ippons = match.player1Score.length
    const p2Ippons = match.player2Score.length
    
    p1Standing.ipponsScored += p1Ippons
    p1Standing.ipponsAgainst += p2Ippons
    p2Standing.ipponsScored += p2Ippons
    p2Standing.ipponsAgainst += p1Ippons
    
    if (match.winner === 'player1') {
      p1Standing.points += 2
      p1Standing.wins += 1
      p2Standing.losses += 1
      p1Standing.results.set(match.player2Id, 'W')
      p2Standing.results.set(match.player1Id, 'L')
    } else if (match.winner === 'player2') {
      p2Standing.points += 2
      p2Standing.wins += 1
      p1Standing.losses += 1
      p1Standing.results.set(match.player2Id, 'L')
      p2Standing.results.set(match.player1Id, 'W')
    } else if (match.winner === 'draw') {
      p1Standing.points += 1
      p2Standing.points += 1
      p1Standing.draws += 1
      p2Standing.draws += 1
      p1Standing.results.set(match.player2Id, 'D')
      p2Standing.results.set(match.player1Id, 'D')
    }
  })
  
  return Array.from(standings.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.wins !== a.wins) return b.wins - a.wins
    return b.ipponsScored - a.ipponsScored
  })
}

// Generate next round matches for a group when current round is complete
// This handles tiebreakers and playoff rounds automatically
const generateNextRoundMatchesForGroup = (
  groupId: string,
  tournament: Tournament,
  members: Member[],
  getGroupById: (id: string) => Group | undefined
): Match[] => {
  const groupMatches = tournament.matches.filter(m => m.groupId === groupId)
  if (groupMatches.length === 0) return []
  
  // Find current max round
  const currentRound = Math.max(...groupMatches.map(m => m.round || 1))
  
  // Check if all matches in current round are completed
  const currentRoundMatches = groupMatches.filter(m => (m.round || 1) === currentRound)
  const pendingInCurrentRound = currentRoundMatches.filter(m => m.status !== 'completed')
  
  if (pendingInCurrentRound.length > 0) {
    return [] // Current round not complete yet
  }
  
  // Calculate standings using all completed matches
  const standings = calculateStandings(groupId, tournament.matches, members)
  
  if (standings.length < 2) return []
  
  // Check if there's a clear winner (top player has more points than 2nd)
  const topPoints = standings[0].points
  const tiedAtTop = standings.filter(s => s.points === topPoints)
  
  if (tiedAtTop.length === 1) {
    // Clear winner - no more matches needed for this group
    return []
  }
  
  // We have ties at the top - need tiebreaker matches
  const tiedPlayerIds = tiedAtTop.map(s => s.playerId)
  
  // Check if all tied players have already played each other in tiebreaker rounds
  // If so, use ippon differential, then head-to-head
  const tiebreakerMatches = groupMatches.filter(m => 
    (m.round || 1) > 1 && 
    tiedPlayerIds.includes(m.player1Id) && 
    tiedPlayerIds.includes(m.player2Id)
  )
  
  // Generate matches between tied players who haven't played in THIS specific tiebreaker round
  const newRound = currentRound + 1
  const newMatches: Match[] = []
  
  // Get group info for match settings
  const group = getGroupById(groupId)
  const isHantei = group?.isNonBogu || false
  
  // Find court assignment from existing matches
  const existingCourt = groupMatches[0]?.court || 'A'
  
  // Find max orderIndex in tournament
  const maxOrderIndex = Math.max(...tournament.matches.map(m => m.orderIndex), 0)
  let orderIndex = maxOrderIndex + 1
  
  // Generate round-robin among tied players using rest optimization
  const matchPairs = generateRoundRobinWithRest(tiedPlayerIds)
  
  // Filter out pairs that have already played in a tiebreaker round
  const playedPairs = new Set<string>()
  tiebreakerMatches.forEach(m => {
    playedPairs.add([m.player1Id, m.player2Id].sort().join('-'))
  })
  
  const newPairs = matchPairs.filter(([p1, p2]) => {
    const pairKey = [p1, p2].sort().join('-')
    return !playedPairs.has(pairKey)
  })
  
  if (newPairs.length === 0) {
    // All tied players have played each other in tiebreakers
    // At this point, we need sudden death - just pick first two
    if (tiedPlayerIds.length >= 2) {
      newMatches.push({
        id: generateId(),
        groupId,
        player1Id: tiedPlayerIds[0],
        player2Id: tiedPlayerIds[1],
        player1Score: [],
        player2Score: [],
        player1Hansoku: 0,
        player2Hansoku: 0,
        winner: null,
        status: 'pending',
        court: existingCourt,
        isHantei,
        matchType: 'ippon', // Sudden death = ippon
        timerDuration: 180,
        orderIndex: orderIndex++,
        round: newRound,
      })
    }
  } else {
    // Create new tiebreaker matches
    newPairs.forEach(([p1, p2]) => {
      newMatches.push({
        id: generateId(),
        groupId,
        player1Id: p1,
        player2Id: p2,
        player1Score: [],
        player2Score: [],
        player1Hansoku: 0,
        player2Hansoku: 0,
        winner: null,
        status: 'pending',
        court: existingCourt,
        isHantei,
        matchType: isHantei ? 'ippon' : 'sanbon',
        timerDuration: 180,
        orderIndex: orderIndex++,
        round: newRound,
      })
    })
  }
  
  return newMatches
}

// Check all groups and generate next round matches where needed
const checkAndGenerateNextRoundMatches = (
  tournament: Tournament,
  members: Member[],
  getGroupById: (id: string) => Group | undefined
): Match[] => {
  const allNewMatches: Match[] = []
  
  tournament.groupOrder.forEach(groupId => {
    const newMatches = generateNextRoundMatchesForGroup(groupId, tournament, members, getGroupById)
    allNewMatches.push(...newMatches)
  })
  
  return allNewMatches
}

// Firebase Realtime Database for cross-device sync
const FIREBASE_URL = 'https://shiaijo-7412f-default-rtdb.firebaseio.com'
const STORAGE_KEY = 'renbu-shiai-data-v3'

// Save to Firebase + localStorage backup
const saveToStorage = async (state: AppState) => {
  try {
    const serializable = { ...state, lastUpdated: Date.now() }
    
    // Save to Firebase (cross-device sync)
    fetch(`${FIREBASE_URL}/tournament.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serializable)
    }).catch(e => console.error('Firebase save error:', e))
    
    // Also save to localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
  } catch (e) {
    console.error('Storage save error:', e)
  }
}

// Load from Firebase with localStorage fallback
const loadFromStorage = async (): Promise<AppState | null> => {
  try {
    const response = await fetch(`${FIREBASE_URL}/tournament.json`)
    if (response.ok) {
      const data = await response.json()
      if (data) {
        // Update localStorage with latest from Firebase
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        return data as AppState
      }
    }
  } catch (e) {
    console.error('Firebase load error:', e)
  }
  
  // Fallback to localStorage
  try {
    const local = localStorage.getItem(STORAGE_KEY)
    if (local) return JSON.parse(local) as AppState
  } catch (e) {
    console.error('localStorage load error:', e)
  }
  return null
}


// Helper to ensure match data is valid
const sanitizeMatch = (match: Match): Match => ({
  ...match,
  player1Score: match.player1Score || [],
  player2Score: match.player2Score || [],
  player1Hansoku: match.player1Hansoku || 0,
  player2Hansoku: match.player2Hansoku || 0,
  status: match.status || 'pending',
  winner: match.winner || null,
  matchType: match.matchType || 'sanbon',
  timerDuration: match.timerDuration || 180,
  round: match.round || 1,  // Default to round 1 for backwards compatibility
})

const sanitizeTournament = (tournament: Tournament | null): Tournament | null => {
  if (!tournament) return null
  return {
    ...tournament,
    matches: (tournament.matches || []).map(sanitizeMatch),
    groups: tournament.groups || [],
    groupOrder: tournament.groupOrder || [],
  }
}

// Default state
const defaultGroups: Group[] = [
  { id: 'A', name: 'Group A', isNonBogu: false },
  { id: 'B', name: 'Group B', isNonBogu: false },
  { id: 'C', name: 'Group C', isNonBogu: false },
  { id: 'D', name: 'Group D', isNonBogu: false },
  { id: 'NonBogu', name: 'Non-Bogu', isNonBogu: true },
]

const defaultState: AppState = {
  members: [],
  courtASelectedMatch: null,
  courtBSelectedMatch: null,
  courtAGroupOrder: [],
  courtBGroupOrder: [],
  sharedGroups: [],
  groups: defaultGroups,
  guestRegistry: [],
  currentTournament: null,
  currentMatchIndexA: 0,
  currentMatchIndexB: 0,
  activeCourt: 'A',
  timerSecondsA: 0,
  timerSecondsB: 0,
  timerRunningA: false,
  timerRunningB: false,
  timerTarget: 180,
  history: [],
  useFirstNamesOnly: true,
  adminPassword: '',
  courtkeeperPassword: '',
  volunteers: [],
}

// Device detection hook
const useDeviceDetection = () => {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
    }
    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])
  
  return isMobile
}

// Main App Component
export default function App() {
  const [portal, setPortal] = useState<'select' | 'admin' | 'courtkeeper' | 'spectator' | 'volunteer' | 'admin-login' | 'courtkeeper-login'>('select')
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [state, setState] = useState<AppState>(defaultState)
  const [loading, setLoading] = useState(true)
  const isMobile = useDeviceDetection()
  const timerRefA = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRefB = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const load = async () => {
      // Try to load from Firebase first, with retries
      let saved = null
      for (let i = 0; i < 3; i++) {
        saved = await loadFromStorage()
        if (saved && saved.members && saved.members.length > 0) break
        await new Promise(r => setTimeout(r, 500)) // Wait 500ms between retries
      }
      
      if (saved) {
        setState({
          ...defaultState,
          ...saved,
          members: saved.members || [],
          groups: saved.groups || defaultGroups,
          guestRegistry: saved.guestRegistry || [],
          history: saved.history || [],
          currentTournament: sanitizeTournament(saved.currentTournament),
          currentMatchIndexA: saved.currentMatchIndexA ?? 0,
          currentMatchIndexB: saved.currentMatchIndexB ?? 0,
          activeCourt: saved.activeCourt || 'A',
          timerSecondsA: saved.timerSecondsA ?? 0,
          timerSecondsB: saved.timerSecondsB ?? 0,
          timerRunningA: saved.timerRunningA ?? false,
          timerRunningB: saved.timerRunningB ?? false,
          lastUpdated: saved.lastUpdated || Date.now(),
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!loading) saveToStorage(state)
  }, [state, loading])

  useEffect(() => {
    if (portal !== 'select') {
      pollRef.current = setInterval(async () => {
        const saved = await loadFromStorage()
        if (saved) {
          // Ensure tournament has all required properties
          let tournament = sanitizeTournament(saved.currentTournament)
          if (tournament) {
            tournament = {
              ...tournament,
              matches: tournament.matches || [],
              groups: tournament.groups || [],
              groupOrder: tournament.groupOrder || [],
            }
          }
          setState(prev => ({
            ...prev,
            currentTournament: tournament,
            currentMatchIndexA: saved.currentMatchIndexA ?? prev.currentMatchIndexA,
            currentMatchIndexB: saved.currentMatchIndexB ?? prev.currentMatchIndexB,
            timerSecondsA: saved.timerSecondsA ?? prev.timerSecondsA,
            timerSecondsB: saved.timerSecondsB ?? prev.timerSecondsB,
            timerRunningA: saved.timerRunningA ?? prev.timerRunningA,
            timerRunningB: saved.timerRunningB ?? prev.timerRunningB,
          }))
        }
      }, 1000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [portal])

  // Timer logic for Court A
  useEffect(() => {
    if (state.timerRunningA) {
      timerRefA.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          timerSecondsA: Math.min(prev.timerSecondsA + 1, prev.timerTarget)
        }))
      }, 1000)
    } else {
      if (timerRefA.current) clearInterval(timerRefA.current)
    }
    return () => { if (timerRefA.current) clearInterval(timerRefA.current) }
  }, [state.timerRunningA, state.timerTarget])

  // Timer logic for Court B
  useEffect(() => {
    if (state.timerRunningB) {
      timerRefB.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          timerSecondsB: Math.min(prev.timerSecondsB + 1, prev.timerTarget)
        }))
      }, 1000)
    } else {
      if (timerRefB.current) clearInterval(timerRefB.current)
    }
    return () => { if (timerRefB.current) clearInterval(timerRefB.current) }
  }, [state.timerRunningB, state.timerTarget])

  const getMemberById = useCallback((id: string) => {
    if (!id) return undefined
    return state.members.find(m => m.id === id)
  }, [state.members])
  const getGroupById = useCallback((id: string) => state.groups.find(g => g.id === id), [state.groups])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1017] flex flex-col items-center justify-center">
        <div className="mb-6 animate-pulse">
          <ShiaijoLogo size={96} glow />
        </div>
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // Handle password login attempts
  const handlePasswordSubmit = (targetPortal: 'admin' | 'courtkeeper') => {
    const requiredPassword = targetPortal === 'admin' ? state.adminPassword : state.courtkeeperPassword
    if (passwordInput === requiredPassword) {
      setPasswordInput('')
      setPasswordError(false)
      setPortal(targetPortal)
    } else {
      setPasswordError(true)
    }
  }

  // Password login screen for admin
  if (portal === 'admin-login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1017] via-[#0f1a24] to-[#0a1017] flex items-center justify-center p-5">
        <Toaster theme="dark" position="top-center" />
        <div className="bg-gradient-to-br from-[#0f1a24] to-[#142130] border border-white/5 rounded-3xl p-6 sm:p-10 max-w-md w-full shadow-2xl">
          <button 
            onClick={() => { setPortal('select'); setPasswordInput(''); setPasswordError(false) }}
            className="text-[#6b8fad] hover:text-white text-sm mb-6 flex items-center gap-2"
          >
            ← Back
          </button>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-xl font-semibold text-white">Admin Portal</h2>
            <p className="text-[#6b8fad] text-sm mt-1">Enter password to continue</p>
          </div>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false) }}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit('admin')}
              className={`bg-[#1a2d42] border-[#1e3a5f] text-white h-12 ${passwordError ? 'border-red-500' : ''}`}
            />
            {passwordError && <p className="text-red-400 text-sm">Incorrect password</p>}
            <button 
              onClick={() => handlePasswordSubmit('admin')}
              className="w-full py-4 px-6 rounded-xl text-base font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Password login screen for courtkeeper
  if (portal === 'courtkeeper-login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1017] via-[#0f1a24] to-[#0a1017] flex items-center justify-center p-5">
        <Toaster theme="dark" position="top-center" />
        <div className="bg-gradient-to-br from-[#0f1a24] to-[#142130] border border-white/5 rounded-3xl p-6 sm:p-10 max-w-md w-full shadow-2xl">
          <button 
            onClick={() => { setPortal('select'); setPasswordInput(''); setPasswordError(false) }}
            className="text-[#6b8fad] hover:text-white text-sm mb-6 flex items-center gap-2"
          >
            ← Back
          </button>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2a4a6f]/20 to-[#1e3a5f]/10 flex items-center justify-center mx-auto mb-4">
              <Swords className="w-8 h-8 text-[#4a8fd1]" />
            </div>
            <h2 className="text-xl font-semibold text-white">Courtkeeper Portal</h2>
            <p className="text-[#6b8fad] text-sm mt-1">Enter password to continue</p>
          </div>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false) }}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit('courtkeeper')}
              className={`bg-[#1a2d42] border-[#1e3a5f] text-white h-12 ${passwordError ? 'border-red-500' : ''}`}
            />
            {passwordError && <p className="text-red-400 text-sm">Incorrect password</p>}
            <button 
              onClick={() => handlePasswordSubmit('courtkeeper')}
              className="w-full py-4 px-6 rounded-xl text-base font-semibold bg-gradient-to-r from-[#1e3a5f] to-[#162d4a] text-white border border-white/10 hover:from-[#2a4a6f] hover:to-[#1e3a5f] transition-all"
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (portal === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1017] via-[#0f1a24] to-[#0a1017] flex items-center justify-center p-4">
        <Toaster theme="dark" position="top-center" />
        <div className="bg-gradient-to-br from-[#0f1a24] to-[#142130] border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-8 w-full max-w-[300px] md:max-w-[380px] shadow-2xl">
          {/* Logo - responsive size */}
          <div className="text-center mb-4 md:mb-6">
            <div className="flex justify-center mb-2 md:mb-3">
              <div className="hidden md:block"><ShiaijoLogo size={140} glow /></div>
              <div className="md:hidden"><ShiaijoLogo size={90} glow /></div>
            </div>
            <p className="text-[#6b8fad] text-[10px] md:text-xs tracking-widest uppercase">Shiai Manager</p>
          </div>
          
          {/* Spectator Button - Glass style */}
          <button 
            onClick={() => setPortal('spectator')}
            className="w-full py-3 md:py-4 px-4 md:px-6 rounded-xl md:rounded-2xl text-sm md:text-base font-medium bg-emerald-950/40 backdrop-blur-sm text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:bg-emerald-900/50 hover:border-emerald-400/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:text-emerald-200 transition-all duration-300 flex items-center justify-center gap-2 md:gap-3 mb-4 md:mb-5"
          >
            <Eye className="w-4 h-4 md:w-5 md:h-5" /> Join as Spectator
          </button>
          
          {/* Divider */}
          <div className="flex items-center my-4 md:my-5">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#1e3a5f] to-transparent"></div>
            <span className="px-3 md:px-4 text-[10px] md:text-xs text-[#3d5a78] uppercase tracking-widest">staff</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#1e3a5f] to-transparent"></div>
          </div>
          
          {/* Admin, Courtkeeper & Volunteer Buttons - Glass style */}
          <div className="space-y-2 md:space-y-3">
            <button 
              onClick={() => state.adminPassword ? setPortal('admin-login') : setPortal('admin')}
              className="w-full py-3 md:py-4 px-4 md:px-6 rounded-xl md:rounded-2xl text-sm md:text-base font-medium bg-orange-950/40 backdrop-blur-sm text-orange-300 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)] hover:bg-orange-900/50 hover:border-orange-400/50 hover:shadow-[0_0_25px_rgba(249,115,22,0.25)] hover:text-orange-200 transition-all duration-300 flex items-center justify-center gap-2 md:gap-3"
            >
              <Shield className="w-4 h-4 md:w-5 md:h-5" /> Admin Portal
              {state.adminPassword && <Lock className="w-3 h-3 md:w-4 md:h-4 ml-1 opacity-60" />}
            </button>
            
            <button 
              onClick={() => state.courtkeeperPassword ? setPortal('courtkeeper-login') : setPortal('courtkeeper')}
              className="w-full py-3 md:py-4 px-4 md:px-6 rounded-xl md:rounded-2xl text-sm md:text-base font-medium bg-sky-950/40 backdrop-blur-sm text-sky-300 border border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.15)] hover:bg-sky-900/50 hover:border-sky-400/50 hover:shadow-[0_0_25px_rgba(14,165,233,0.25)] hover:text-sky-200 transition-all duration-300 flex items-center justify-center gap-2 md:gap-3"
            >
              <Swords className="w-4 h-4 md:w-5 md:h-5" /> Courtkeeper Portal
              {state.courtkeeperPassword && <Lock className="w-3 h-3 md:w-4 md:h-4 ml-1 opacity-60" />}
            </button>
            
            <button 
              onClick={() => setPortal('volunteer')}
              className="w-full py-3 md:py-4 px-4 md:px-6 rounded-xl md:rounded-2xl text-sm md:text-base font-medium bg-pink-950/40 backdrop-blur-sm text-pink-300 border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.15)] hover:bg-pink-900/50 hover:border-pink-400/50 hover:shadow-[0_0_25px_rgba(236,72,153,0.25)] hover:text-pink-200 transition-all duration-300 flex items-center justify-center gap-2 md:gap-3"
            >
              <Heart className="w-4 h-4 md:w-5 md:h-5" /> Volunteer Portal
            </button>
          </div>
          
          {/* Footer */}
          <p className="text-center text-[10px] md:text-xs text-[#3d5a78] mt-6 md:mt-8">
            Powered by <span className="text-orange-500">Renbu Dojo</span>
          </p>
        </div>
      </div>
    )
  }

  if (portal === 'admin') {
    return (
      <AdminPortal 
        state={state} 
        setState={setState} 
        isMobile={isMobile}
        onSwitchPortal={(p) => setPortal(p as any)}
        getMemberById={getMemberById}
        getGroupById={getGroupById}
      />
    )
  }

  if (portal === 'volunteer') {
    return (
      <VolunteerPortal 
        state={state}
        setState={setState}
        onSwitchPortal={(p) => setPortal(p as any)}
        getMemberById={getMemberById}
      />
    )
  }

  if (portal === 'spectator') {
    return (
      <SpectatorPortal 
        state={state}
        onSwitchPortal={(p) => setPortal(p as any)}
        getMemberById={getMemberById}
        getGroupById={getGroupById}
      />
    )
  }

  return (
    <CourtkeeperPortal 
      state={state} 
      setState={setState} 
      isMobile={isMobile}
      onSwitchPortal={(p) => setPortal(p as any)}
      getMemberById={getMemberById}
      getGroupById={getGroupById}
    />
  )
}

// Volunteer Portal Component
function VolunteerPortal({ 
  state, 
  setState,
  onSwitchPortal,
  getMemberById
}: { 
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
  onSwitchPortal: (portal: string) => void
  getMemberById: (id: string) => Member | undefined
}) {
  const [selectedVolunteer, setSelectedVolunteer] = useState<string | null>(null)
  const [showRegister, setShowRegister] = useState(false)
  const [newFirstName, setNewFirstName] = useState('')
  const [newLastName, setNewLastName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  
  // Log hours form
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0])
  const [logHours, setLogHours] = useState('0')
  const [logMinutes, setLogMinutes] = useState('0')
  const [logDescription, setLogDescription] = useState('')
  
  // Shiai signup
  const [shiaiSignupRole, setShiaiSignupRole] = useState<'courtkeeper' | 'general'>('general')

  const currentVolunteer = selectedVolunteer ? state.volunteers.find(v => v.id === selectedVolunteer) : null
  const upcomingTournament = state.currentTournament?.status === 'setup' || state.currentTournament?.status === 'in_progress' ? state.currentTournament : null

  const registerVolunteer = () => {
    if (!newFirstName.trim() || !newLastName.trim()) return
    const volunteer: Volunteer = {
      id: generateId(),
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      phone: newPhone.trim() || undefined,
      relatedMemberIds: selectedMembers,
      signups: []
    }
    setState(prev => ({ ...prev, volunteers: [...prev.volunteers, volunteer] }))
    setSelectedVolunteer(volunteer.id)
    setShowRegister(false)
    setNewFirstName('')
    setNewLastName('')
    setNewPhone('')
    setSelectedMembers([])
    toast.success('Welcome! You are now registered as a volunteer.')
  }

  const logVolunteerHours = () => {
    if (!selectedVolunteer || (!logHours && !logMinutes) || !logDescription.trim()) return
    const hours = parseInt(logHours) || 0
    const minutes = parseInt(logMinutes) || 0
    if (hours === 0 && minutes === 0) return

    const signup: VolunteerSignup = {
      id: generateId(),
      tournamentId: 'general',
      tournamentName: 'General Volunteering',
      date: logDate,
      hours,
      minutes,
      description: logDescription.trim(),
      isShiaiSignup: false
    }
    setState(prev => ({
      ...prev,
      volunteers: prev.volunteers.map(v => 
        v.id === selectedVolunteer 
          ? { ...v, signups: [...v.signups, signup] }
          : v
      )
    }))
    setLogHours('0')
    setLogMinutes('0')
    setLogDescription('')
    toast.success('Hours logged!')
  }

  const signUpForShiai = () => {
    if (!selectedVolunteer || !upcomingTournament) return
    
    // Check if already signed up
    const alreadySignedUp = currentVolunteer?.signups.some(
      s => s.isShiaiSignup && s.tournamentId === upcomingTournament.id
    )
    if (alreadySignedUp) {
      toast.error('You are already signed up for this tournament')
      return
    }

    const signup: VolunteerSignup = {
      id: generateId(),
      tournamentId: upcomingTournament.id,
      tournamentName: upcomingTournament.name,
      date: upcomingTournament.date,
      hours: 0,
      minutes: 0,
      description: `Shiai Volunteer - ${shiaiSignupRole === 'courtkeeper' ? 'Courtkeeper' : 'General'}`,
      isShiaiSignup: true,
      shiaiRole: shiaiSignupRole
    }
    setState(prev => ({
      ...prev,
      volunteers: prev.volunteers.map(v => 
        v.id === selectedVolunteer 
          ? { ...v, signups: [...v.signups, signup] }
          : v
      )
    }))
    toast.success(`Signed up as ${shiaiSignupRole === 'courtkeeper' ? 'Courtkeeper' : 'General Volunteer'}!`)
  }

  const cancelShiaiSignup = (signupId: string) => {
    if (!selectedVolunteer) return
    setState(prev => ({
      ...prev,
      volunteers: prev.volunteers.map(v => 
        v.id === selectedVolunteer 
          ? { ...v, signups: v.signups.filter(s => s.id !== signupId) }
          : v
      )
    }))
    toast.success('Signup cancelled')
  }

  const getTotalTime = (volunteer: Volunteer) => {
    const totalMinutes = volunteer.signups.reduce((sum, s) => sum + (s.hours * 60) + s.minutes, 0)
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    return { hours, mins, totalMinutes }
  }

  const getRelatedMemberNames = (volunteer: Volunteer) => {
    return volunteer.relatedMemberIds
      .map(id => getMemberById(id))
      .filter(Boolean)
      .map(m => `${m!.firstName} ${m!.lastName}`)
      .join(', ')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1017] via-[#0f1a24] to-[#0a1017]">
      {/* Header */}
      <header className="bg-[#0f1419]/90 backdrop-blur-sm border-b border-white/5 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShiaijoLogo size={36} glow />
            <div>
              <h1 className="text-white font-semibold text-sm sm:text-base">Volunteer Portal</h1>
              <p className="text-xs text-[#6b8fad]">Log hours & sign up for events</p>
            </div>
          </div>
          <Select onValueChange={(value) => onSwitchPortal(value)}>
            <SelectTrigger className="text-xs text-[#6b8fad] hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-white/5 border-0 w-auto gap-1">
              <ArrowLeftRight className="w-3 h-3" />
              <span>Switch</span>
            </SelectTrigger>
            <SelectContent className="bg-[#142130] border-[#1e3a5f]">
              <SelectItem value="spectator" className="text-emerald-300">
                <span className="flex items-center gap-2"><Eye className="w-4 h-4" /> Spectator</span>
              </SelectItem>
              <SelectItem value="admin" className="text-orange-300">
                <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Admin</span>
              </SelectItem>
              <SelectItem value="courtkeeper" className="text-sky-300">
                <span className="flex items-center gap-2"><Swords className="w-4 h-4" /> Courtkeeper</span>
              </SelectItem>
              <SelectItem value="select" className="text-[#8fb3d1]">
                <span className="flex items-center gap-2"><Home className="w-4 h-4" /> Main Menu</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>
      
      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Select or Register */}
        {!selectedVolunteer ? (
          <Card className="bg-[#142130]/80 border-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-400" />
                Welcome, Volunteer!
              </CardTitle>
              <CardDescription className="text-[#6b8fad]">
                Select your name or register as a new volunteer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {state.volunteers.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-[#8fb3d1]">I am...</Label>
                  <Select value={selectedVolunteer || ''} onValueChange={setSelectedVolunteer}>
                    <SelectTrigger className="bg-[#1a2d42] border-[#1e3a5f] text-white">
                      <SelectValue placeholder="Select your name..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2d42] border-[#1e3a5f]">
                      {state.volunteers.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.firstName} {v.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-[#1e3a5f]"></div>
                <span className="text-xs text-[#6b8fad]">or</span>
                <div className="flex-1 h-px bg-[#1e3a5f]"></div>
              </div>
              
              <Button 
                onClick={() => setShowRegister(true)} 
                className="w-full bg-pink-600 hover:bg-pink-700"
              >
                <Plus className="w-4 h-4 mr-2" /> Register as New Volunteer
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Volunteer Info Card */}
            <Card className="bg-[#142130]/80 border-white/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                      <span className="text-pink-400 font-semibold text-lg">
                        {currentVolunteer?.firstName[0]}{currentVolunteer?.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{currentVolunteer?.firstName} {currentVolunteer?.lastName}</p>
                      {currentVolunteer && currentVolunteer.relatedMemberIds.length > 0 && (
                        <p className="text-xs text-[#6b8fad]">Parent of: {getRelatedMemberNames(currentVolunteer)}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg sm:text-xl font-bold text-pink-400">
                      {currentVolunteer && getTotalTime(currentVolunteer).hours}h {currentVolunteer && getTotalTime(currentVolunteer).mins}m
                    </p>
                    <p className="text-xs text-[#6b8fad]">Total volunteer time</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-3 text-[#6b8fad]"
                  onClick={() => setSelectedVolunteer(null)}
                >
                  Switch volunteer
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Shiai Signup */}
            {upcomingTournament && (
              <Card className="bg-gradient-to-br from-orange-900/20 to-[#142130] border-orange-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-orange-400" />
                    Upcoming Shiai
                  </CardTitle>
                  <CardDescription className="text-[#8fb3d1]">
                    {upcomingTournament.name} - {upcomingTournament.date ? new Date(upcomingTournament.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : upcomingTournament.month}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentVolunteer?.signups.some(s => s.isShiaiSignup && s.tournamentId === upcomingTournament.id) ? (
                    <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">You're signed up!</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-400 hover:text-red-300"
                          onClick={() => {
                            const signup = currentVolunteer?.signups.find(s => s.isShiaiSignup && s.tournamentId === upcomingTournament.id)
                            if (signup) cancelShiaiSignup(signup.id)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                      <p className="text-sm text-[#6b8fad] mt-2">
                        Role: {currentVolunteer?.signups.find(s => s.isShiaiSignup && s.tournamentId === upcomingTournament.id)?.shiaiRole === 'courtkeeper' ? 'Courtkeeper' : 'General Volunteer'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Button
                          variant={shiaiSignupRole === 'courtkeeper' ? 'default' : 'outline'}
                          className={shiaiSignupRole === 'courtkeeper' ? 'bg-orange-600 flex-1' : 'flex-1'}
                          onClick={() => setShiaiSignupRole('courtkeeper')}
                        >
                          <Swords className="w-4 h-4 mr-2" /> Courtkeeper
                        </Button>
                        <Button
                          variant={shiaiSignupRole === 'general' ? 'default' : 'outline'}
                          className={shiaiSignupRole === 'general' ? 'bg-pink-600 flex-1' : 'flex-1'}
                          onClick={() => setShiaiSignupRole('general')}
                        >
                          <Heart className="w-4 h-4 mr-2" /> General
                        </Button>
                      </div>
                      <Button onClick={signUpForShiai} className="w-full bg-emerald-600 hover:bg-emerald-700">
                        Sign Up to Volunteer
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Log Hours */}
            <Card className="bg-[#142130]/80 border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Log Volunteer Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-[#8fb3d1]">Date</Label>
                  <Input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="bg-[#1a2d42] border-[#1e3a5f] text-white mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#8fb3d1]">Hours</Label>
                    <Input
                      type="number"
                      min="0"
                      value={logHours}
                      onChange={(e) => setLogHours(e.target.value)}
                      className="bg-[#1a2d42] border-[#1e3a5f] text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[#8fb3d1]">Minutes</Label>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={logMinutes}
                      onChange={(e) => setLogMinutes(e.target.value)}
                      className="bg-[#1a2d42] border-[#1e3a5f] text-white mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-[#8fb3d1]">What did you volunteer for?</Label>
                  <Input
                    value={logDescription}
                    onChange={(e) => setLogDescription(e.target.value)}
                    className="bg-[#1a2d42] border-[#1e3a5f] text-white mt-1"
                    placeholder="e.g., Setup and cleanup, Registration desk..."
                  />
                </div>
                <Button 
                  onClick={logVolunteerHours} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={(!logHours || logHours === '0') && (!logMinutes || logMinutes === '0') || !logDescription.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" /> Log Hours
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            {currentVolunteer && currentVolunteer.signups.length > 0 && (
              <Card className="bg-[#142130]/80 border-white/5">
                <CardHeader>
                  <CardTitle className="text-white text-base">Your Volunteer History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentVolunteer.signups.slice().reverse().map(signup => (
                      <div key={signup.id} className="flex items-center justify-between bg-[#0f1a24]/50 rounded-lg px-3 py-2 text-sm">
                        <div>
                          <p className="text-white">{signup.description}</p>
                          <p className="text-xs text-[#6b8fad]">
                            {new Date(signup.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <Badge className={signup.isShiaiSignup ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}>
                          {signup.hours > 0 || signup.minutes > 0 ? `${signup.hours}h ${signup.minutes}m` : 'Signed up'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      {/* Register Dialog */}
      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent className="bg-[#142130] border-[#1e3a5f] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Register as Volunteer</DialogTitle>
            <DialogDescription className="text-[#6b8fad]">
              Join our volunteer team!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="bg-[#1a2d42] border-[#1e3a5f] text-white mt-1"
                />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  className="bg-[#1a2d42] border-[#1e3a5f] text-white mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Phone (optional)</Label>
              <Input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="bg-[#1a2d42] border-[#1e3a5f] text-white mt-1"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label>Related Member(s)</Label>
              <p className="text-xs text-[#6b8fad] mb-2">Select the member(s) you're a parent/guardian of</p>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b8fad]" />
                <Input
                  placeholder="Search members..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="pl-10 bg-[#1a2d42] border-[#1e3a5f] text-white h-9 text-sm"
                />
              </div>
              <ScrollArea className="h-32 sm:h-40 border border-[#1e3a5f] rounded-lg p-2">
                {state.members
                  .filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                  .map(member => (
                  <div 
                    key={member.id}
                    className="flex items-center gap-2 p-2 hover:bg-[#1a2d42] rounded cursor-pointer"
                    onClick={() => {
                      setSelectedMembers(prev => 
                        prev.includes(member.id) 
                          ? prev.filter(id => id !== member.id)
                          : [...prev, member.id]
                      )
                    }}
                  >
                    <Checkbox checked={selectedMembers.includes(member.id)} />
                    <span className="text-white">{member.firstName} {member.lastName}</span>
                  </div>
                ))}
                {state.members.filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(memberSearchQuery.toLowerCase())).length === 0 && (
                  <p className="text-[#6b8fad] text-center py-4">{state.members.length === 0 ? 'No members available' : 'No matching members'}</p>
                )}
              </ScrollArea>
              {selectedMembers.length > 0 && (
                <p className="text-xs text-emerald-400 mt-2">{selectedMembers.length} member(s) selected</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegister(false)}>Cancel</Button>
            <Button 
              onClick={registerVolunteer} 
              className="bg-pink-600 hover:bg-pink-700"
              disabled={!newFirstName.trim() || !newLastName.trim()}
            >
              Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Spectator Portal Component
function SpectatorPortal({ 
  state, 
  onSwitchPortal,
  getMemberById,
  getGroupById
}: { 
  state: AppState
  onSwitchPortal: (portal: string) => void
  getMemberById: (id: string) => Member | undefined
  getGroupById: (id: string) => Group | undefined
}) {
  const tournament = state.currentTournament
  
  // Helper to convert score IDs to names
  const getScoreName = (scoreId: number) => {
    switch(scoreId) {
      case 1: return 'M'  // Men
      case 2: return 'K'  // Kote
      case 3: return 'D'  // Do
      case 4: return 'T'  // Tsuki
      case 5: return 'H'  // Hansoku
      default: return '?'
    }
  }

  const getScoreFullName = (scoreId: number) => {
    switch(scoreId) {
      case 1: return 'Men'
      case 2: return 'Kote'
      case 3: return 'Do'
      case 4: return 'Tsuki'
      case 5: return 'Hansoku'
      default: return '?'
    }
  }

  // Get upcoming matches for each court
  const getQueueForCourt = (court: 'A' | 'B') => {
    if (!tournament) return []
    return tournament.matches
      .filter(m => m.status === 'pending' && m.court === court)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .slice(0, 5)
  }

  // Get group standings
  const getGroupStandings = (groupId: string) => {
    if (!tournament) return []
    const groupMatches = tournament.matches.filter(m => m.groupId === groupId)
    const playerIds = new Set<string>()
    groupMatches.forEach(m => {
      playerIds.add(m.player1Id)
      playerIds.add(m.player2Id)
    })
    
    const standings = Array.from(playerIds).map(playerId => {
      const player = getMemberById(playerId)
      const playerMatches = groupMatches.filter(m => m.player1Id === playerId || m.player2Id === playerId)
      const completed = playerMatches.filter(m => m.status === 'completed')
      const pending = playerMatches.filter(m => m.status === 'pending')
      const inProgress = playerMatches.filter(m => m.status === 'in_progress')
      
      let wins = 0, losses = 0, draws = 0, points = 0
      completed.forEach(m => {
        const isP1 = m.player1Id === playerId
        const p1Score = m.player1Score.length
        const p2Score = m.player2Score.length
        const myScore = isP1 ? p1Score : p2Score
        const oppScore = isP1 ? p2Score : p1Score
        
        if (myScore > oppScore) { wins++; points += 2 }
        else if (myScore < oppScore) { losses++ }
        else { draws++; points += 1 }
      })
      
      return {
        playerId,
        playerName: player ? `${player.firstName} ${player.lastName}` : 'Unknown',
        total: playerMatches.length,
        completed: completed.length,
        pending: pending.length,
        inProgress: inProgress.length,
        wins,
        losses,
        draws,
        points
      }
    }).sort((a, b) => b.points - a.points || b.wins - a.wins)
    
    return standings
  }

  const courtAQueue = getQueueForCourt('A')
  const courtBQueue = getQueueForCourt('B')
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1017] via-[#0f1a24] to-[#0a1017]">
      {/* Header */}
      <header className="bg-[#0f1419]/90 backdrop-blur-sm border-b border-white/5 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShiaijoLogo size={36} glow />
            <div>
              <h1 className="text-white font-semibold text-sm sm:text-base">Live Tournament</h1>
              <p className="text-xs text-[#6b8fad]">Spectator View</p>
            </div>
          </div>
          <Select onValueChange={(value) => onSwitchPortal(value)}>
            <SelectTrigger className="text-xs text-[#6b8fad] hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-white/5 border-0 w-auto gap-1">
              <ArrowLeftRight className="w-3 h-3" />
              <span>Switch</span>
            </SelectTrigger>
            <SelectContent className="bg-[#142130] border-[#1e3a5f]">
              <SelectItem value="admin" className="text-orange-300">
                <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Admin</span>
              </SelectItem>
              <SelectItem value="courtkeeper" className="text-sky-300">
                <span className="flex items-center gap-2"><Swords className="w-4 h-4" /> Courtkeeper</span>
              </SelectItem>
              <SelectItem value="volunteer" className="text-pink-300">
                <span className="flex items-center gap-2"><Heart className="w-4 h-4" /> Volunteer</span>
              </SelectItem>
              <SelectItem value="select" className="text-[#8fb3d1]">
                <span className="flex items-center gap-2"><Home className="w-4 h-4" /> Main Menu</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Tournament Status */}
        {tournament ? (
          <>
            <Card className="bg-[#142130]/80 border-white/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-lg">{tournament.name}</CardTitle>
                    <p className="text-xs text-[#6b8fad]">
                      {tournament.date ? new Date(tournament.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : tournament.month}
                    </p>
                  </div>
                  {tournament.status === 'in_progress' && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></span>
                      LIVE
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div className="bg-[#0a1017]/50 rounded-xl p-4">
                    <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{tournament.matches?.filter(m => m.status === 'completed').length || 0}</p>
                    <p className="text-xs text-[#6b8fad]">Completed</p>
                  </div>
                  <div className="bg-[#0a1017]/50 rounded-xl p-4">
                    <p className="text-2xl sm:text-3xl font-bold text-orange-400">{tournament.matches?.filter(m => m.status === 'in_progress').length || 0}</p>
                    <p className="text-xs text-[#6b8fad]">In Progress</p>
                  </div>
                  <div className="bg-[#0a1017]/50 rounded-xl p-4">
                    <p className="text-2xl sm:text-3xl font-bold text-[#6b8fad]">{tournament.matches?.filter(m => m.status === 'pending').length || 0}</p>
                    <p className="text-xs text-[#6b8fad]">Remaining</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Current Matches */}
            <Card className="bg-[#142130]/80 border-white/5">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Swords className="w-5 h-5 text-orange-400" />
                  Current Matches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tournament.matches?.filter(m => m.status === 'in_progress').length === 0 ? (
                  <p className="text-[#6b8fad] text-center py-8">No matches in progress</p>
                ) : (
                  tournament.matches?.filter(m => m.status === 'in_progress').map(match => {
                    const player1 = getMemberById(match.player1Id)
                    const player2 = getMemberById(match.player2Id)
                    const group = getGroupById(match.groupId)
                    return (
                      <div key={match.id} className="bg-[#0a1017]/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-[#6b8fad]">{group?.name} • Court {match.court}</span>
                          <Badge className="bg-orange-500/20 text-orange-400 text-xs">LIVE</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 text-center">
                            <p className="text-white font-medium">{player1?.firstName} {player1?.lastName}</p>
                            <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{match.player1Score.length}</p>
                            <p className="text-xs text-[#6b8fad] mt-1">
                              {match.player1Score.map(s => getScoreName(s)).join(' ') || '-'}
                            </p>
                          </div>
                          <div className="px-4 text-[#4a6b8a]">VS</div>
                          <div className="flex-1 text-center">
                            <p className="text-white font-medium">{player2?.firstName} {player2?.lastName}</p>
                            <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{match.player2Score.length}</p>
                            <p className="text-xs text-[#6b8fad] mt-1">
                              {match.player2Score.map(s => getScoreName(s)).join(' ') || '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            {/* Match Queues */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Court A Queue */}
              <Card className="bg-[#142130]/80 border-white/5 border-l-4 border-l-amber-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-amber-500 text-black text-xs font-bold flex items-center justify-center">A</span>
                    Court A Queue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {courtAQueue.length === 0 ? (
                    <p className="text-[#6b8fad] text-sm text-center py-4">No upcoming matches</p>
                  ) : (
                    <div className="space-y-2">
                      {courtAQueue.map((match, idx) => {
                        const p1 = getMemberById(match.player1Id)
                        const p2 = getMemberById(match.player2Id)
                        const group = getGroupById(match.groupId)
                        return (
                          <div key={match.id} className="flex items-center gap-2 text-sm bg-[#0a1017]/30 rounded-lg px-3 py-2">
                            <span className="text-[#6b8fad] w-5">#{idx + 1}</span>
                            {(match.round || 1) > 1 && (
                              <span className="text-[9px] px-1 py-0.5 bg-purple-900/50 text-purple-300 rounded">TB</span>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white truncate">{p1?.firstName} {p1?.lastName} vs {p2?.firstName} {p2?.lastName}</p>
                              <p className="text-xs text-[#6b8fad]">{group?.name}{(match.round || 1) > 1 ? ` · Round ${match.round}` : ''}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Court B Queue */}
              <Card className="bg-[#142130]/80 border-white/5 border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-blue-500 text-white text-xs font-bold flex items-center justify-center">B</span>
                    Court B Queue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {courtBQueue.length === 0 ? (
                    <p className="text-[#6b8fad] text-sm text-center py-4">No upcoming matches</p>
                  ) : (
                    <div className="space-y-2">
                      {courtBQueue.map((match, idx) => {
                        const p1 = getMemberById(match.player1Id)
                        const p2 = getMemberById(match.player2Id)
                        const group = getGroupById(match.groupId)
                        return (
                          <div key={match.id} className="flex items-center gap-2 text-sm bg-[#0a1017]/30 rounded-lg px-3 py-2">
                            <span className="text-[#6b8fad] w-5">#{idx + 1}</span>
                            {(match.round || 1) > 1 && (
                              <span className="text-[9px] px-1 py-0.5 bg-purple-900/50 text-purple-300 rounded">TB</span>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white truncate">{p1?.firstName} {p1?.lastName} vs {p2?.firstName} {p2?.lastName}</p>
                              <p className="text-xs text-[#6b8fad]">{group?.name}{(match.round || 1) > 1 ? ` · Round ${match.round}` : ''}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Results with Points */}
            <Card className="bg-[#142130]/80 border-white/5">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Recent Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tournament.matches?.filter(m => m.status === 'completed').slice(-8).reverse().map(match => {
                  const player1 = getMemberById(match.player1Id)
                  const player2 = getMemberById(match.player2Id)
                  const group = getGroupById(match.groupId)
                  const p1Score = match.player1Score.length
                  const p2Score = match.player2Score.length
                  const p1Won = p1Score > p2Score
                  const p2Won = p2Score > p1Score
                  return (
                    <div key={match.id} className="bg-[#0a1017]/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-[#6b8fad]">{group?.name}</span>
                        {(p1Won || p2Won) && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className={`font-medium ${p1Won ? 'text-green-400' : 'text-white'}`}>
                            {player1?.firstName} {player1?.lastName}
                            {p1Won && <span className="ml-2 text-xs">👑</span>}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {match.player1Score.map((s, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-red-500/20 text-red-300 text-xs rounded">
                                {getScoreFullName(s)}
                              </span>
                            ))}
                            {match.player1Score.length === 0 && <span className="text-xs text-[#6b8fad]">-</span>}
                          </div>
                        </div>
                        <div className="px-4 text-center">
                          <span className="text-xl sm:text-2xl font-bold text-white">{p1Score} - {p2Score}</span>
                        </div>
                        <div className="flex-1 text-right">
                          <p className={`font-medium ${p2Won ? 'text-green-400' : 'text-white'}`}>
                            {p2Won && <span className="mr-2 text-xs">👑</span>}
                            {player2?.firstName} {player2?.lastName}
                          </p>
                          <div className="flex items-center gap-1 mt-1 justify-end">
                            {match.player2Score.map((s, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded">
                                {getScoreFullName(s)}
                              </span>
                            ))}
                            {match.player2Score.length === 0 && <span className="text-xs text-[#6b8fad]">-</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {tournament.matches?.filter(m => m.status === 'completed').length === 0 && (
                  <p className="text-[#6b8fad] text-center py-4">No completed matches yet</p>
                )}
              </CardContent>
            </Card>

            {/* Group Standings */}
            <Card className="bg-[#142130]/80 border-white/5">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Table className="w-5 h-5 text-blue-400" />
                  Group Standings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {(tournament.groupOrder || []).map(groupId => {
                    const group = getGroupById(groupId)
                    const standings = getGroupStandings(groupId)
                    if (standings.length === 0) return null
                    return (
                      <div key={groupId}>
                        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                          <Filter className="w-4 h-4 text-[#6b8fad]" />
                          {group?.name || groupId}
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs sm:text-sm">
                            <thead>
                              <tr className="border-b border-white/10">
                                <th className="text-left py-2 px-2 text-[#6b8fad] font-medium">#</th>
                                <th className="text-left py-2 px-2 text-[#6b8fad] font-medium">Name</th>
                                <th className="text-center py-2 px-1 text-[#6b8fad] font-medium">W</th>
                                <th className="text-center py-2 px-1 text-[#6b8fad] font-medium">L</th>
                                <th className="text-center py-2 px-1 text-[#6b8fad] font-medium">D</th>
                                <th className="text-center py-2 px-1 text-[#6b8fad] font-medium">Pts</th>
                                <th className="text-center py-2 px-2 text-[#6b8fad] font-medium">Matches</th>
                              </tr>
                            </thead>
                            <tbody>
                              {standings.map((player, idx) => (
                                <tr key={player.playerId} className="border-b border-white/5">
                                  <td className="py-2 px-2 text-[#6b8fad]">{idx + 1}</td>
                                  <td className="py-2 px-2 text-white">{player.playerName}</td>
                                  <td className="py-2 px-1 text-center text-emerald-400">{player.wins}</td>
                                  <td className="py-2 px-1 text-center text-red-400">{player.losses}</td>
                                  <td className="py-2 px-1 text-center text-[#6b8fad]">{player.draws}</td>
                                  <td className="py-2 px-1 text-center text-yellow-400 font-bold">{player.points}</td>
                                  <td className="py-2 px-2 text-center">
                                    <span className="text-emerald-400">{player.completed}</span>
                                    <span className="text-[#4a6b8a]">/</span>
                                    <span className="text-[#6b8fad]">{player.total}</span>
                                    {player.inProgress > 0 && (
                                      <span className="ml-1 text-orange-400 text-xs">(⚔️)</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="bg-[#142130]/80 border-white/5">
            <CardContent className="py-16 text-center">
              <ShiaijoLogo size={80} />
              <h2 className="text-xl text-white mt-6 mb-2">No Active Tournament</h2>
              <p className="text-[#6b8fad]">Check back when a tournament is in progress</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

// Admin Portal Component
function AdminPortal({ 
  state, 
  setState, 
  onSwitchPortal,
  getMemberById,
  getGroupById
}: { 
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
  isMobile: boolean
  onSwitchPortal: (portal: string) => void
  getMemberById: (id: string) => Member | undefined
  getGroupById: (id: string) => Group | undefined
}) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterGroup, setFilterGroup] = useState<string>('all')
  const [sortBy] = useState<'name' | 'group'>('name')
  const [showAddMember, setShowAddMember] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const filteredMembers = state.members
    .filter(m => {
      const matchesSearch = `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesGroup = filterGroup === 'all' || m.group === filterGroup
      return matchesSearch && matchesGroup
    })
    .sort((a, b) => {
      if (sortBy === 'name') return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
      return a.group.localeCompare(b.group)
    })

  const addMember = (firstName: string, lastName: string, group: string) => {
    if (!firstName || !lastName || !group) {
      toast.error('Please fill all fields')
      return
    }
    const newMember: Member = {
      id: generateId(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      group,
      isGuest: false,
      isParticipating: false,
    }
    setState(prev => ({ ...prev, members: [...prev.members, newMember] }))
    toast.success(`${firstName} ${lastName} added`)
  }

  const addGuestMember = (firstName: string, lastName: string, group: string, guestDojo?: string) => {
    const newMember: Member = {
      id: generateId(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      group,
      isGuest: true,
      guestDojo,
      isParticipating: false,
    }
    const existsInRegistry = state.guestRegistry.some(
      g => g.firstName === firstName && g.lastName === lastName
    )
    setState(prev => ({
      ...prev,
      members: [...prev.members, newMember],
      guestRegistry: existsInRegistry ? prev.guestRegistry : [...prev.guestRegistry, { ...newMember, isParticipating: false }]
    }))
    toast.success(`Guest ${firstName} ${lastName} added`)
  }

  const deleteMember = (id: string) => {
    setState(prev => ({ ...prev, members: prev.members.filter(m => m.id !== id) }))
  }

  const clearAllMembers = () => {
    setState(prev => ({ ...prev, members: [] }))
    setShowClearConfirm(false)
    toast.success('All members cleared')
  }

  const toggleParticipation = (id: string) => {
    setState(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === id ? { ...m, isParticipating: !m.isParticipating } : m)
    }))
  }

  const selectByGroup = (groupId: string) => {
    setState(prev => ({
      ...prev,
      members: prev.members.map(m => m.group === groupId ? { ...m, isParticipating: true } : m)
    }))
  }

  const deselectAll = () => {
    setState(prev => ({
      ...prev,
      members: prev.members.map(m => ({ ...m, isParticipating: false }))
    }))
  }

  const handleCSVImport = (csvText: string) => {
    const lines = csvText.trim().split('\n')
    const newMembers: Member[] = []
    const startIdx = lines[0].toLowerCase().includes('firstname') || lines[0].toLowerCase().includes('first') ? 1 : 0
    
    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim().replace(/"/g, ''))
      if (parts.length >= 3) {
        const [firstName, lastName, group] = parts
        if (firstName && lastName && group) {
          const groupId = state.groups.find(g => g.id === group || g.name === group)?.id || state.groups[0]?.id
          newMembers.push({
            id: generateId(),
            firstName,
            lastName,
            group: groupId,
            isGuest: false,
            isParticipating: false,
          })
        }
      }
    }
    
    if (newMembers.length === 0) {
      toast.error('No valid members found. Format: FirstName,LastName,Group')
      return
    }
    setState(prev => ({ ...prev, members: [...prev.members, ...newMembers] }))
    toast.success(`${newMembers.length} members imported`)
  }

  const generateTournament = (selectedMonth: string, selectedYear: number, date: string) => {
    const participants = state.members.filter(m => m.isParticipating)
    
    const participantsByGroup = new Map<string, Member[]>()
    participants.forEach(p => {
      const existing = participantsByGroup.get(p.group) || []
      participantsByGroup.set(p.group, [...existing, p])
    })
    
    const allMatches: Match[] = []
    let globalOrderIndex = 0
    const groupOrder = state.groups.filter(g => participantsByGroup.has(g.id)).map(g => g.id)
    
    // Process groups in order - each group gets assigned to one court
    // Odd groups (1st, 3rd, 5th) → Court A, Even groups (2nd, 4th, 6th) → Court B
    groupOrder.forEach((groupId, groupIndex) => {
      const groupParticipants = participantsByGroup.get(groupId)
      if (!groupParticipants || groupParticipants.length < 2) return
      
      const group = getGroupById(groupId)
      const isHantei = group?.isNonBogu || false
      const matchPairs = generateRoundRobinWithRest(groupParticipants.map(p => p.id))
      const court = groupIndex % 2 === 0 ? 'A' : 'B'
      
      matchPairs.forEach((pair) => {
        allMatches.push({
          id: generateId(),
          groupId,
          player1Id: pair[0],
          player2Id: pair[1],
          player1Score: [],
          player2Score: [],
          player1Hansoku: 0,
          player2Hansoku: 0,
          winner: null,
          status: 'pending',
          court,
          isHantei,
          matchType: isHantei ? 'ippon' : 'sanbon',
          timerDuration: 180,
          orderIndex: globalOrderIndex++,
          round: 1,
        })
      })
    })
    
    // Allow empty tournament - can be refreshed later with participants
    const tournament: Tournament = {
      id: generateId(),
      name: `Renbu Monthly Shiai - ${selectedMonth} ${selectedYear}`,
      date: date,
      month: selectedMonth,
      year: selectedYear,
      status: 'setup',
      matches: allMatches,
      groups: [...participantsByGroup.keys()],
      groupOrder,
      timerOptions: [120, 180, 240, 300],
      defaultTimerDuration: 180,
    }
    
    setState(prev => ({ 
      ...prev, 
      currentTournament: tournament,
      currentMatchIndexA: 0,
      currentMatchIndexB: 0,
      timerSecondsA: 0,
      timerSecondsB: 0,
      timerRunningA: false,
      timerRunningB: false,
    }))
    
    if (allMatches.length === 0) {
      toast.success(`Empty tournament created for ${selectedMonth} ${selectedYear}. Add participants and refresh to generate matches.`)
    } else {
      toast.success(`Tournament generated with ${allMatches.length} matches across ${participantsByGroup.size} groups`)
    }
  }

  const refreshTournamentParticipants = () => {
    if (!state.currentTournament) {
      toast.error('No active tournament')
      return
    }
    
    const participants = state.members.filter(m => m.isParticipating)
    if (participants.length < 2) {
      toast.error('Need at least 2 participants')
      return
    }
    
    const participantsByGroup = new Map<string, Member[]>()
    participants.forEach(p => {
      const existing = participantsByGroup.get(p.group) || []
      participantsByGroup.set(p.group, [...existing, p])
    })
    
    // Keep completed and in-progress matches
    const existingMatches = state.currentTournament.matches || []
    const completedMatches = existingMatches.filter(m => m.status === 'completed' || m.status === 'in_progress')
    
    const newMatches: Match[] = []
    let globalOrderIndex = 0
    const groupOrder = state.groups.filter(g => participantsByGroup.has(g.id)).map(g => g.id)
    
    groupOrder.forEach((groupId, groupIndex) => {
      const groupParticipants = participantsByGroup.get(groupId)
      if (!groupParticipants || groupParticipants.length < 2) return
      
      const group = getGroupById(groupId)
      const isHantei = group?.isNonBogu || false
      const matchPairs = generateRoundRobinWithRest(groupParticipants.map(p => p.id))
      const court = groupIndex % 2 === 0 ? 'A' : 'B'
      
      matchPairs.forEach((pair) => {
        // Check if this match already exists (same players, same group)
        const existingMatch = completedMatches.find(m => 
          m.groupId === groupId &&
          ((m.player1Id === pair[0] && m.player2Id === pair[1]) ||
           (m.player1Id === pair[1] && m.player2Id === pair[0]))
        )
        
        if (existingMatch) {
          // Keep the existing match with its results
          newMatches.push({ ...existingMatch, orderIndex: globalOrderIndex++ })
        } else {
          // Create new pending match
          newMatches.push({
            id: generateId(),
            groupId,
            player1Id: pair[0],
            player2Id: pair[1],
            player1Score: [],
            player2Score: [],
            player1Hansoku: 0,
            player2Hansoku: 0,
            winner: null,
            status: 'pending',
            court,
            isHantei,
            round: 1,
            matchType: isHantei ? 'ippon' : 'sanbon',
            timerDuration: state.currentTournament?.defaultTimerDuration || 180,
            orderIndex: globalOrderIndex++,
          })
        }
      })
    })
    
    if (newMatches.length === 0) {
      toast.error('No matches could be generated')
      return
    }
    
    const keptCount = newMatches.filter(m => m.status === 'completed' || m.status === 'in_progress').length
    
    setState(prev => ({
      ...prev,
      currentTournament: {
        ...prev.currentTournament!,
        matches: newMatches,
        groups: [...participantsByGroup.keys()],
        groupOrder,
      },
      currentMatchIndexA: 0,
      currentMatchIndexB: 0,
    }))
    
    toast.success(`Refreshed: ${newMatches.length} matches (${keptCount} preserved)`)
  }

  const archiveTournament = () => {
    if (!state.currentTournament) return
    
    const results = state.currentTournament.groups.map(groupId => {
      const group = getGroupById(groupId)
      const standings = calculateStandings(groupId, state.currentTournament!.matches, state.members, state.useFirstNamesOnly)
      return {
        groupId,
        groupName: group?.name || groupId,
        isNonBogu: group?.isNonBogu || false,
        standings: standings.map((s, idx) => ({
          rank: idx + 1,
          playerName: s.playerName,
          points: s.points,
          wins: s.wins,
          losses: s.losses,
          draws: s.draws,
        }))
      }
    })
    
    const historyEntry: TournamentHistory = {
      id: generateId(),
      name: state.currentTournament.name,
      date: state.currentTournament.date,
      month: state.currentTournament.month,
      year: state.currentTournament.year,
      results,
    }
    
    setState(prev => ({
      ...prev,
      history: [...(prev.history || []), historyEntry],
      currentTournament: null,
      currentMatchIndexA: 0,
      currentMatchIndexB: 0,
      timerSecondsA: 0,
      timerSecondsB: 0,
      timerRunningA: false,
      timerRunningB: false,
    }))
    
    toast.success('Tournament archived to history')
  }

  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // MobileNav inlined to prevent re-mounting on every render

  return (
    <div className="min-h-screen bg-[#0a1017] text-white">
      <Toaster theme="dark" position="top-center" />

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col fixed h-full bg-[#0f1a24] border-r border-white/5 transition-all duration-300 z-20 ${sidebarCollapsed ? 'w-[72px]' : 'w-64'}`}>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            {sidebarCollapsed ? (
              <div className="w-10 h-10 flex items-center justify-center">
                <span className="text-xl" style={{ fontFamily: 'ShiaijoCalligraphy, serif' }}>試</span>
              </div>
            ) : (
              <>
                <ShiaijoLogo size={45} glow />
                <span className="text-xl text-white" style={{ fontFamily: 'ShiaijoCalligraphy, serif' }}>試合場</span>
              </>
            )}
          </div>
        </div>

        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-[#1a2d42] border border-[#1e3a5f] rounded-full flex items-center justify-center hover:bg-[#243a52] transition z-10"
        >
          <ChevronLeft className={`w-3 h-3 text-[#8fb3d1] transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {!sidebarCollapsed && (
          <div className="p-4 border-b border-white/5">
            <div className="bg-[#142130] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#6b8fad] uppercase tracking-wider">Session</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{state.members.filter(m => m.isParticipating).length}</span>
                <span className="text-[#6b8fad] text-sm">participating</span>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 py-4 overflow-y-auto">
          {!sidebarCollapsed && <p className="px-4 mb-2 text-xs text-[#6b8fad] uppercase tracking-wider">Menu</p>}
          {(() => {
            // Determine upcoming month indicator
            const now = new Date()
            const dayOfMonth = now.getDate()
            const isFirstTwoWeeks = dayOfMonth <= 14
            const currentMonth = MONTHS[now.getMonth()]
            const currentYear = now.getFullYear()
            const nextMonth = MONTHS[(now.getMonth() + 1) % 12]
            const nextYear = now.getMonth() === 11 ? currentYear + 1 : currentYear
            
            // Check if current month has results
            const hasCurrentMonthResults = (state.history || []).some(h => 
              h.month === currentMonth && h.year === currentYear
            ) || (state.currentTournament?.month === currentMonth && state.currentTournament?.year === currentYear)
            
            // Upcoming is next month if: past first 2 weeks OR current month already has results
            const upcomingMonth = (!isFirstTwoWeeks || hasCurrentMonthResults) ? nextMonth : currentMonth
            const upcomingYear = (!isFirstTwoWeeks || hasCurrentMonthResults) ? nextYear : currentYear
            
            const tournamentBadge = state.currentTournament?.status === 'in_progress' 
              ? 'Live' 
              : (state.currentTournament?.month === upcomingMonth && state.currentTournament?.year === upcomingYear)
                ? upcomingMonth.slice(0, 3)
                : null
            
            return [
              { id: 'dashboard', icon: Home, label: 'Dashboard', badge: null },
              { id: 'members', icon: Users, label: 'Members', badge: null },
              { id: 'guests', icon: UserPlus, label: 'Guests', badge: null },
              { id: 'groups', icon: Filter, label: 'Groups', badge: null },
              { id: 'tournament', icon: Trophy, label: 'Tournament', badge: tournamentBadge, badgeColor: state.currentTournament?.status === 'in_progress' ? 'green' : 'amber' },
              { id: 'standings', icon: Table, label: 'Standings', badge: null },
              { id: 'history', icon: History, label: 'History', badge: null },
              { id: 'volunteers', icon: Heart, label: 'Volunteers', badge: null },
              { id: 'settings', icon: Settings, label: 'Settings', badge: null },
            ]
          })().map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                activeTab === item.id 
                  ? 'text-orange-400 bg-gradient-to-r from-orange-500/10 to-transparent border-l-2 border-orange-500' 
                  : 'text-[#8fb3d1] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${activeTab === item.id ? 'bg-orange-500/20' : 'bg-[#1a2d42]'}`}>
                <item.icon className="w-5 h-5" />
              </div>
              {!sidebarCollapsed && (
                <>
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span className={`ml-auto px-2 py-0.5 text-xs rounded-full border ${
                      item.badgeColor === 'green' 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>{item.badge}</span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <Select onValueChange={(value) => onSwitchPortal(value)}>
            <SelectTrigger className={`w-full py-3 px-4 text-sm bg-gradient-to-r from-[#1e3a5f] to-[#162d4a] hover:from-[#2a4a6f] hover:to-[#1e3a5f] rounded-xl flex items-center justify-center gap-2 font-medium transition border-0 ${sidebarCollapsed ? 'px-2' : ''}`}>
              <ArrowLeftRight className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span className="flex-1 text-left">Switch Portal</span>}
            </SelectTrigger>
            <SelectContent className="bg-[#142130] border-[#1e3a5f]">
              <SelectItem value="spectator" className="text-emerald-300 hover:bg-emerald-900/30">
                <span className="flex items-center gap-2"><Eye className="w-4 h-4" /> Spectator</span>
              </SelectItem>
              <SelectItem value="courtkeeper" className="text-sky-300 hover:bg-sky-900/30">
                <span className="flex items-center gap-2"><Swords className="w-4 h-4" /> Courtkeeper</span>
              </SelectItem>
              <SelectItem value="volunteer" className="text-pink-300 hover:bg-pink-900/30">
                <span className="flex items-center gap-2"><Heart className="w-4 h-4" /> Volunteer</span>
              </SelectItem>
              <SelectItem value="select" className="text-[#8fb3d1] hover:bg-[#1e3a5f]/50">
                <span className="flex items-center gap-2"><Home className="w-4 h-4" /> Main Menu</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#0f1a24] border-b border-white/5 flex items-center justify-between px-4 z-30 md:hidden">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <button className="p-2 text-[#8fb3d1] hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-[#0f1a24] border-[#162d4a] w-72 p-0">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <ShiaijoLogo size={45} glow />
                <span className="text-xl text-white" style={{ fontFamily: 'ShiaijoCalligraphy, serif' }}>試合場</span>
              </div>
              <p className="text-xs text-[#6b8fad] mt-2">Admin Portal</p>
            </div>
            <nav className="py-4">
              {[
                { id: 'dashboard', icon: Home, label: 'Dashboard' },
                { id: 'members', icon: Users, label: 'Members' },
                { id: 'guests', icon: UserPlus, label: 'Guests' },
                { id: 'groups', icon: Filter, label: 'Groups' },
                { id: 'tournament', icon: Trophy, label: 'Tournament' },
                { id: 'standings', icon: Table, label: 'Standings' },
                { id: 'history', icon: History, label: 'History' },
                { id: 'volunteers', icon: Heart, label: 'Volunteers' },
                { id: 'settings', icon: Settings, label: 'Settings' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileNavOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 ${
                    activeTab === item.id 
                      ? 'text-orange-400 bg-orange-500/10 border-l-2 border-orange-500' 
                      : 'text-[#8fb3d1] hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-white/5 space-y-2">
              <p className="text-xs text-[#6b8fad] uppercase tracking-wider mb-2">Switch Portal</p>
              <button 
                onClick={() => { setMobileNavOpen(false); onSwitchPortal('spectator'); }}
                className="w-full py-2.5 px-4 text-sm bg-emerald-950/40 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-300"
              >
                <Eye className="w-4 h-4" /> Spectator
              </button>
              <button 
                onClick={() => { setMobileNavOpen(false); onSwitchPortal('courtkeeper'); }}
                className="w-full py-2.5 px-4 text-sm bg-sky-950/40 border border-sky-500/30 rounded-lg flex items-center gap-2 text-sky-300"
              >
                <Swords className="w-4 h-4" /> Courtkeeper
              </button>
              <button 
                onClick={() => { setMobileNavOpen(false); onSwitchPortal('volunteer'); }}
                className="w-full py-2.5 px-4 text-sm bg-pink-950/40 border border-pink-500/30 rounded-lg flex items-center gap-2 text-pink-300"
              >
                <Heart className="w-4 h-4" /> Volunteer
              </button>
              <button 
                onClick={() => { setMobileNavOpen(false); onSwitchPortal('select'); }}
                className="w-full py-2.5 px-4 text-sm bg-[#1e3a5f]/50 border border-[#1e3a5f] rounded-lg flex items-center gap-2 text-[#8fb3d1]"
              >
                <Home className="w-4 h-4" /> Main Menu
              </button>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <ShiaijoLogo size={32} glow />
          <span className="text-lg text-white" style={{ fontFamily: 'ShiaijoCalligraphy, serif' }}>試合場</span>
        </div>
        <button 
          onClick={async () => {
            const saved = await loadFromStorage()
            if (saved) {
              setState(prev => ({ 
                ...prev, 
                ...saved,
                currentTournament: sanitizeTournament(saved.currentTournament)
              }))
              toast.success('Synced')
            }
          }}
          className="p-2 text-[#8fb3d1] hover:text-white"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className={`pt-14 md:pt-0 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-64'}`}>
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[#6b8fad] text-sm mb-1 hidden md:block">Welcome back</p>
              <h2 className="text-xl md:text-2xl font-bold capitalize">{activeTab}</h2>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#6b8fad]" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 bg-[#1e3a5f]/30 border border-[#1e3a5f]/50 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <button 
                onClick={async () => {
                  const saved = await loadFromStorage()
                  if (saved) {
                    const tournament = sanitizeTournament(saved.currentTournament)
                    setState(prev => ({ ...prev, members: saved.members || prev.members, groups: saved.groups || prev.groups, guestRegistry: saved.guestRegistry || prev.guestRegistry, currentTournament: tournament, history: saved.history || prev.history }))
                    toast.success('Synced')
                  }
                }}
                className="p-2.5 text-[#8fb3d1] hover:text-white hover:bg-[#1a2d42] rounded-xl transition"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Card */}
              <Card className="bg-gradient-to-br from-[#142130] to-[#1a2d42] border-white/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <ShiaijoLogo size={60} glow />
                    <div>
                      <h2 className="text-2xl font-bold text-white">Welcome to <span style={{ fontFamily: 'ShiaijoCalligraphy, serif' }}>試合場</span></h2>
                      <p className="text-[#6b8fad]">Shiai Manager</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Card className="bg-[#142130] border-white/5">
                  <CardContent className="p-4 text-center">
                    <Users className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-white">{state.members.length}</p>
                    <p className="text-xs text-[#6b8fad]">Total Members</p>
                  </CardContent>
                </Card>
                <Card className="bg-[#142130] border-white/5">
                  <CardContent className="p-4 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-white">{state.members.filter(m => m.isParticipating).length}</p>
                    <p className="text-xs text-[#6b8fad]">Participating</p>
                  </CardContent>
                </Card>
                <Card className="bg-[#142130] border-white/5">
                  <CardContent className="p-4 text-center">
                    <Filter className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-white">{state.groups.length}</p>
                    <p className="text-xs text-[#6b8fad]">Groups</p>
                  </CardContent>
                </Card>
                <Card className="bg-[#142130] border-white/5">
                  <CardContent className="p-4 text-center">
                    <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-white">{state.history.length}</p>
                    <p className="text-xs text-[#6b8fad]">Past Tournaments</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tournament Status */}
              <Card className="bg-[#142130] border-white/5">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-orange-400" />
                    Current Tournament
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {state.currentTournament ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{state.currentTournament.name}</p>
                          <p className="text-sm text-[#6b8fad]">
                            {state.currentTournament.date ? new Date(state.currentTournament.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : `${state.currentTournament.month} ${state.currentTournament.year}`}
                          </p>
                        </div>
                        <Badge className={`${
                          state.currentTournament.status === 'setup' ? 'bg-yellow-600' :
                          state.currentTournament.status === 'in_progress' ? 'bg-emerald-600' :
                          'bg-blue-600'
                        }`}>
                          {state.currentTournament.status === 'setup' ? 'Setup' : 
                           state.currentTournament.status === 'in_progress' ? 'In Progress' : 'Completed'}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => setActiveTab('tournament')} className="bg-orange-600 hover:bg-orange-700">
                          <Play className="w-4 h-4 mr-2" /> Go to Tournament
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Trophy className="w-12 h-12 text-[#3d5a78] mx-auto mb-3" />
                      <p className="text-[#6b8fad] mb-4">No active tournament</p>
                      <Button onClick={() => setActiveTab('tournament')} className="bg-orange-600 hover:bg-orange-700">
                        <Plus className="w-4 h-4 mr-2" /> Create Tournament
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-[#142130] border-white/5 hover:border-orange-500/30 transition-colors cursor-pointer" onClick={() => setActiveTab('members')}>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Manage Members</p>
                      <p className="text-xs text-[#6b8fad]">Add, edit, or remove members</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-[#142130] border-white/5 hover:border-blue-500/30 transition-colors cursor-pointer" onClick={() => setActiveTab('groups')}>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Filter className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Manage Groups</p>
                      <p className="text-xs text-[#6b8fad]">Configure rank groups</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-[#142130] border-white/5 hover:border-emerald-500/30 transition-colors cursor-pointer" onClick={() => setActiveTab('settings')}>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Settings className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Settings</p>
                      <p className="text-xs text-[#6b8fad]">Passwords & preferences</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-[#142130] border border-white/5 rounded-xl p-4">
                  <p className="text-[#6b8fad] text-xs mb-1">Total Members</p>
                  <p className="text-2xl font-bold">{state.members.length}</p>
                </div>
                <div className="bg-[#142130] border border-white/5 rounded-xl p-4">
                  <p className="text-[#6b8fad] text-xs mb-1">Participating</p>
                  <p className="text-2xl font-bold text-green-400">{state.members.filter(m => m.isParticipating).length}</p>
                </div>
                <div className="bg-[#142130] border border-white/5 rounded-xl p-4">
                  <p className="text-[#6b8fad] text-xs mb-1">Matches</p>
                  <p className="text-2xl font-bold">{state.currentTournament?.matches?.length || 0}</p>
                </div>
                <div className="bg-[#142130] border border-white/5 rounded-xl p-4">
                  <p className="text-[#6b8fad] text-xs mb-1">Completed</p>
                  <p className="text-2xl font-bold text-orange-400">{state.currentTournament?.matches?.filter(m => m.status === 'completed').length || 0}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-[#142130] border border-white/5 rounded-xl p-4">
                <div className="flex flex-wrap gap-2">
                  <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                    <DialogTrigger asChild>
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        <Plus className="w-4 h-4 mr-2" />Add Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#142130] border-[#162d4a]">
                      <DialogHeader>
                        <DialogTitle className="text-white">Add Member</DialogTitle>
                      </DialogHeader>
                      <AddMemberForm groups={state.groups} onAdd={addMember} />
                    </DialogContent>
                  </Dialog>
                  <Dialog open={showBulkAdd} onOpenChange={setShowBulkAdd}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-[#1e3a5f] text-[#b8d4ec]">
                        <Upload className="w-4 h-4 mr-2" />Import CSV
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#142130] border-[#162d4a]">
                      <DialogHeader>
                        <DialogTitle className="text-white">Import Members</DialogTitle>
                        <DialogDescription className="text-[#8fb3d1]">Paste CSV: FirstName,LastName,Group</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <textarea 
                          className="w-full h-32 bg-[#1a2d42] border border-[#1e3a5f] rounded-lg p-3 text-sm"
                          placeholder="FirstName,LastName,Group&#10;John,Doe,Group A"
                          id="csv-input"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowBulkAdd(false)} className="border-[#1e3a5f]">Cancel</Button>
                          <Button onClick={() => { 
                            const textarea = document.getElementById('csv-input') as HTMLTextAreaElement
                            if (textarea) { handleCSVImport(textarea.value); setShowBulkAdd(false); }
                          }} className="bg-orange-600 hover:bg-orange-700">Import</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
                  <span className="text-xs text-[#6b8fad] self-center">Quick select:</span>
                  {state.groups.map(g => (
                    <button key={g.id} onClick={() => selectByGroup(g.id)} className="px-3 py-1 text-xs rounded-lg bg-[#1a2d42] text-[#8fb3d1] hover:bg-[#243a52]">
                      +{g.name}
                    </button>
                  ))}
                  <button onClick={deselectAll} className="px-3 py-1 text-xs rounded-lg text-[#6b8fad] hover:text-[#b8d4ec]">Clear</button>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button 
                  onClick={() => setFilterGroup('all')}
                  className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap ${filterGroup === 'all' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-[#1a2d42] text-[#8fb3d1]'}`}
                >All</button>
                {state.groups.map(g => (
                  <button 
                    key={g.id}
                    onClick={() => setFilterGroup(g.id)}
                    className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap ${filterGroup === g.id ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-[#1a2d42] text-[#8fb3d1]'}`}
                  >{g.name}</button>
                ))}
              </div>

              {/* Members List */}
              <div className="bg-[#142130] border border-white/5 rounded-xl overflow-hidden">
                <div className="divide-y divide-white/5">
                  {filteredMembers.map(member => {
                    const group = getGroupById(member.group)
                    return (
                      <div key={member.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/5">
                        <Checkbox 
                          checked={member.isParticipating} 
                          onCheckedChange={() => toggleParticipation(member.id)}
                          className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{member.lastName}, {member.firstName}</p>
                          <p className="text-xs text-[#6b8fad]">{group?.name || member.group}{member.isGuest && ' • Guest'}</p>
                        </div>
                        <span className={`w-2 h-2 rounded-full ${member.isParticipating ? 'bg-green-500' : 'bg-[#2e4a65]'}`}></span>
                        <button onClick={() => deleteMember(member.id)} className="p-1.5 text-[#6b8fad] hover:text-red-400 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
                <div className="px-4 py-3 border-t border-white/5 flex justify-between text-sm text-[#6b8fad]">
                  <span>{filteredMembers.length} members</span>
                  <span className="text-orange-400">{state.members.filter(m => m.isParticipating).length} participating</span>
                </div>
              </div>

            </div>
          )}

          {/* Guests Tab */}
          {activeTab === 'guests' && (
            <GuestsTab state={state} onAddGuest={addGuestMember} getGroupById={getGroupById} />
          )}

          {/* Groups Tab */}
          {activeTab === 'groups' && (
            <GroupsManager state={state} setState={setState} />
          )}

          {/* Tournament Tab */}
          {activeTab === 'tournament' && (
            <TournamentManager state={state} setState={setState} getMemberById={getMemberById} getGroupById={getGroupById} generateTournament={generateTournament} refreshTournamentParticipants={refreshTournamentParticipants} archiveTournament={archiveTournament} />
          )}

          {/* Standings Tab */}
          {activeTab === 'standings' && (
            <StandingsView state={state} getMemberById={getMemberById} getGroupById={getGroupById} />
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <HistoryView state={state} setState={setState} />
          )}

          {/* Volunteers Tab */}
          {activeTab === 'volunteers' && (
            <VolunteersTab state={state} setState={setState} getMemberById={getMemberById} />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <Card className="bg-[#142130] border-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Display Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <div>
                      <p className="font-medium">First Names Only</p>
                      <p className="text-sm text-[#6b8fad]">Show first names only (disambiguate with last initial when needed)</p>
                    </div>
                    <Switch 
                      checked={state.useFirstNamesOnly}
                      onCheckedChange={(checked) => setState(prev => ({ ...prev, useFirstNamesOnly: checked }))}
                      className="data-[state=checked]:bg-orange-500"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card className="bg-[#142130] border-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Security</CardTitle>
                  <CardDescription className="text-[#6b8fad]">Set passwords to protect portal access</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-[#8fb3d1]">Admin Password</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="password"
                          placeholder={state.adminPassword ? '••••••••' : 'No password set'}
                          className="bg-[#1a2d42] border-[#1e3a5f] text-white"
                          onBlur={(e) => {
                            if (e.target.value) {
                              setState(prev => ({ ...prev, adminPassword: e.target.value }))
                              toast.success('Admin password updated')
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                              setState(prev => ({ ...prev, adminPassword: (e.target as HTMLInputElement).value }))
                              toast.success('Admin password updated')
                              ;(e.target as HTMLInputElement).value = ''
                            }
                          }}
                        />
                        {state.adminPassword && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-800/50 text-red-400 hover:bg-red-900/30"
                            onClick={() => {
                              setState(prev => ({ ...prev, adminPassword: '' }))
                              toast.success('Admin password removed')
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-[#6b8fad] mt-1">
                        {state.adminPassword ? '🔒 Password protected' : 'Anyone can access admin portal'}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-[#8fb3d1]">Courtkeeper Password</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="password"
                          placeholder={state.courtkeeperPassword ? '••••••••' : 'No password set'}
                          className="bg-[#1a2d42] border-[#1e3a5f] text-white"
                          onBlur={(e) => {
                            if (e.target.value) {
                              setState(prev => ({ ...prev, courtkeeperPassword: e.target.value }))
                              toast.success('Courtkeeper password updated')
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                              setState(prev => ({ ...prev, courtkeeperPassword: (e.target as HTMLInputElement).value }))
                              toast.success('Courtkeeper password updated')
                              ;(e.target as HTMLInputElement).value = ''
                            }
                          }}
                        />
                        {state.courtkeeperPassword && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-800/50 text-red-400 hover:bg-red-900/30"
                            onClick={() => {
                              setState(prev => ({ ...prev, courtkeeperPassword: '' }))
                              toast.success('Courtkeeper password removed')
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-[#6b8fad] mt-1">
                        {state.courtkeeperPassword ? '🔒 Password protected' : 'Anyone can access courtkeeper mode'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#142130] border-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Developer Tools</CardTitle>
                  <CardDescription className="text-[#6b8fad]">Test data and debugging options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={() => {
                      const testMembers: Member[] = []
                      const firstNames = ['Sakura', 'Yuki', 'Hana', 'Ren', 'Kai', 'Aoi', 'Sora', 'Hiro']
                      const lastNames = ['Tanaka', 'Suzuki', 'Yamada', 'Sato', 'Watanabe', 'Ito', 'Takahashi', 'Nakamura']
                      for (let i = 0; i < 20; i++) {
                        testMembers.push({ 
                          id: generateId(), 
                          firstName: firstNames[i % firstNames.length], 
                          lastName: lastNames[i % lastNames.length] + (i > 7 ? (i - 7).toString() : ''), 
                          group: state.groups[i % state.groups.length]?.id || 'group-a', 
                          isGuest: false, 
                          isParticipating: true 
                        })
                      }
                      setState(prev => ({ ...prev, members: [...prev.members, ...testMembers] }))
                      toast.success('Added 20 test members')
                    }} className="px-4 py-3 rounded-xl bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/50 transition">
                      <Plus className="w-4 h-4 inline mr-2" />Add Test Members
                    </button>
                    
                    <button onClick={() => {
                      // Generate demo history
                      const demoHistory: TournamentHistory[] = []
                      const months = ['November', 'October', 'September', 'August', 'July']
                      const players = ['Sakura T.', 'Yuki S.', 'Hana Y.', 'Ren W.', 'Kai I.', 'Aoi N.']
                      
                      months.forEach((month, idx) => {
                        const year = 2025
                        demoHistory.push({
                          id: generateId(),
                          name: `Renbu Monthly Shiai - ${month} ${year}`,
                          date: `${year}-${String(11 - idx).padStart(2, '0')}-15`,
                          month,
                          year,
                          results: [
                            {
                              groupId: 'demo-a',
                              groupName: 'Group A',
                              isNonBogu: false,
                              standings: players.slice(0, 5).map((name, i) => ({
                                rank: i + 1,
                                playerName: name,
                                points: Math.max(0, 10 - i * 2 + Math.floor(Math.random() * 2)),
                                wins: Math.max(0, 4 - i + Math.floor(Math.random() * 2)),
                                losses: i + Math.floor(Math.random() * 2),
                                draws: Math.floor(Math.random() * 2),
                              }))
                            },
                            {
                              groupId: 'demo-b',
                              groupName: 'Group B', 
                              isNonBogu: false,
                              standings: players.slice(1, 6).map((name, i) => ({
                                rank: i + 1,
                                playerName: name,
                                points: Math.max(0, 8 - i * 2 + Math.floor(Math.random() * 2)),
                                wins: Math.max(0, 3 - i + Math.floor(Math.random() * 2)),
                                losses: i + Math.floor(Math.random() * 2),
                                draws: Math.floor(Math.random() * 2),
                              }))
                            }
                          ]
                        })
                      })
                      setState(prev => ({ ...prev, history: [...(prev.history || []), ...demoHistory] }))
                      toast.success('Added 5 months of demo history')
                    }} className="px-4 py-3 rounded-xl bg-blue-900/30 text-blue-400 border border-blue-800/50 hover:bg-blue-900/50 transition">
                      <History className="w-4 h-4 inline mr-2" />Generate Demo History
                    </button>
                    
                    <button onClick={() => setShowClearConfirm(true)} className="px-4 py-3 rounded-xl bg-red-900/30 text-red-400 border border-red-800/50 hover:bg-red-900/50 transition">
                      <Trash2 className="w-4 h-4 inline mr-2" />Clear All Members
                    </button>
                    
                    <button onClick={() => {
                      setState(prev => ({ ...prev, history: [] }))
                      toast.success('History cleared')
                    }} className="px-4 py-3 rounded-xl bg-red-900/30 text-red-400 border border-red-800/50 hover:bg-red-900/50 transition">
                      <Trash2 className="w-4 h-4 inline mr-2" />Clear History
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#142130] border-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Data Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={async () => {
                        const saved = await loadFromStorage()
                        if (saved) {
                          const tournament = sanitizeTournament(saved.currentTournament)
                          setState(prev => ({ ...prev, members: saved.members || prev.members, groups: saved.groups || prev.groups, guestRegistry: saved.guestRegistry || prev.guestRegistry, currentTournament: tournament, history: saved.history || prev.history }))
                          toast.success('Data synced from cloud')
                        }
                      }}
                      className="px-4 py-3 rounded-xl bg-[#1e3a5f] text-[#b8d4ec] border border-[#2a4a6f] hover:bg-[#243a52] transition"
                    >
                      <RefreshCw className="w-4 h-4 inline mr-2" />Sync from Cloud
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Clear Confirm Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="bg-[#142130] border-[#162d4a]">
          <DialogHeader>
            <DialogTitle className="text-white">Clear All Members?</DialogTitle>
            <DialogDescription className="text-[#8fb3d1]">This will remove all {state.members.length} members.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearConfirm(false)} className="border-[#1e3a5f]">Cancel</Button>
            <Button variant="destructive" onClick={clearAllMembers}>Clear All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


// Guests Tab Component
function GuestsTab({ state, onAddGuest, getGroupById }: {
  state: AppState
  onAddGuest: (firstName: string, lastName: string, group: string, guestDojo?: string) => void
  getGroupById: (id: string) => Group | undefined
}) {
  const [showAddGuest, setShowAddGuest] = useState(false)
  const guests = state.members.filter(m => m.isGuest)

  return (
    <div className="space-y-4">
      <div className="bg-[#142130] border border-white/5 rounded-xl p-4">
        <Dialog open={showAddGuest} onOpenChange={setShowAddGuest}>
          <DialogTrigger asChild>
            <Button className="bg-[#1e3a5f] hover:bg-[#162d4a]">
              <Plus className="w-4 h-4 mr-2" />Add Guest
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#142130] border-[#162d4a]">
            <DialogHeader>
              <DialogTitle className="text-white">Add Guest</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label className="text-[#b8d4ec]">First Name</Label>
                          <Input id="guest-first" className="bg-[#1a2d42] border-[#1e3a5f]" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#b8d4ec]">Last Name</Label>
                          <Input id="guest-last" className="bg-[#1a2d42] border-[#1e3a5f]" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#b8d4ec]">Group</Label>
                          <Select defaultValue={state.groups[0]?.id}>
                            <SelectTrigger className="bg-[#1a2d42] border-[#1e3a5f]"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-[#1a2d42] border-[#1e3a5f]">
                              {state.groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#b8d4ec]">Dojo (optional)</Label>
                          <Input id="guest-dojo" className="bg-[#1a2d42] border-[#1e3a5f]" placeholder="Guest's home dojo" />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <Button variant="outline" onClick={() => setShowAddGuest(false)} className="border-[#1e3a5f]">Cancel</Button>
                          <Button onClick={() => {
                            const first = (document.getElementById('guest-first') as HTMLInputElement)?.value
                            const last = (document.getElementById('guest-last') as HTMLInputElement)?.value
                            const dojo = (document.getElementById('guest-dojo') as HTMLInputElement)?.value
                            if (first && last) { onAddGuest(first, last, state.groups[0]?.id || '', dojo); setShowAddGuest(false); }
                          }} className="bg-[#1e3a5f] hover:bg-[#162d4a]">Add Guest</Button>
                        </div>
                      </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-[#142130] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <span className="font-medium">Guests ({guests.length})</span>
        </div>
        <div className="divide-y divide-white/5">
          {guests.length === 0 ? (
            <div className="p-8 text-center text-[#6b8fad]">No guests added yet</div>
          ) : (
            guests.map(guest => {
              const group = getGroupById(guest.group)
              return (
                <div key={guest.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium">{guest.lastName}, {guest.firstName}</p>
                    <p className="text-xs text-[#6b8fad]">{guest.guestDojo || 'Guest'} • {group?.name}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {state.guestRegistry.length > 0 && (
        <div className="bg-[#142130] border border-white/5 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <span className="font-medium">Guest Registry ({state.guestRegistry.length})</span>
          </div>
          <div className="divide-y divide-white/5">
            {state.guestRegistry.map(guest => (
              <div key={guest.id} className="px-4 py-3 text-sm">
                {guest.lastName}, {guest.firstName} {guest.guestDojo && `(${guest.guestDojo})`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Groups Manager Component
function GroupsManager({
  state,
  setState,
}: {
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
}) {
  const [editMode, setEditMode] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null)

  const updateGroup = (groupId: string, updates: Partial<Group>) => {
    setState(prev => ({
      ...prev,
      groups: prev.groups.map(g => g.id === groupId ? { ...g, ...updates } : g)
    }))
  }

  const reorderGroups = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return
    setState(prev => {
      const groups = [...prev.groups]
      const draggedIdx = groups.findIndex(g => g.id === draggedId)
      const targetIdx = groups.findIndex(g => g.id === targetId)
      if (draggedIdx === -1 || targetIdx === -1) return prev
      const [dragged] = groups.splice(draggedIdx, 1)
      groups.splice(targetIdx, 0, dragged)
      return { ...prev, groups }
    })
  }

  const addGroup = () => {
    if (!newGroupName.trim()) {
      toast.error('Enter a group name')
      return
    }
    const newGroup: Group = {
      id: generateId(),
      name: newGroupName.trim(),
      isNonBogu: false,
    }
    setState(prev => ({ ...prev, groups: [...prev.groups, newGroup] }))
    setNewGroupName('')
    toast.success('Group added')
  }

  const deleteGroup = (groupId: string) => {
    const membersInGroup = state.members.filter(m => m.group === groupId).length
    if (membersInGroup > 0) {
      toast.error(`Cannot delete: ${membersInGroup} members in this group`)
      return
    }
    setState(prev => ({ ...prev, groups: prev.groups.filter(g => g.id !== groupId) }))
    toast.success('Group deleted')
  }

  return (
    <div className="space-y-3">
      <Card className="bg-[#142130] border-white/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base">Groups</CardTitle>
            <Button
              size="sm"
              variant={editMode ? "default" : "outline"}
              onClick={() => setEditMode(!editMode)}
              className={editMode ? "bg-orange-600 hover:bg-orange-700" : "border-[#2a4a6f]"}
            >
              <Edit2 className="w-3 h-3 mr-1" />
              {editMode ? 'Done' : 'Edit'}
            </Button>
          </div>
          <CardDescription className="text-[#8fb3d1] text-xs">
            Odd positions → Court A (amber) | Even → Court B (blue)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {editMode && (
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="New group..."
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                className="bg-[#1a2d42] border-[#2a4a6f] text-sm h-9"
              />
              <Button onClick={addGroup} size="sm" className="bg-orange-600 hover:bg-orange-700 h-9">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="space-y-1">
            {state.groups.map((group, idx) => {
              const memberCount = state.members.filter(m => m.group === group.id).length
              const isCourtA = idx % 2 === 0
              const isDragging = draggedGroupId === group.id
              const isDragTarget = draggedGroupId && draggedGroupId !== group.id
              
              return (
                <div 
                  key={group.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedGroupId(group.id)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragEnd={() => setDraggedGroupId(null)}
                  onDragOver={(e) => {
                    if (!isDragTarget) return
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (draggedGroupId && isDragTarget) {
                      reorderGroups(draggedGroupId, group.id)
                    }
                    setDraggedGroupId(null)
                  }}
                  className={`flex items-center gap-2 p-3 rounded-lg transition-all cursor-grab active:cursor-grabbing select-none ${
                    isDragging ? 'opacity-50 scale-95' :
                    isDragTarget ? 'border-2 border-dashed border-amber-400/50' :
                    isCourtA 
                      ? 'bg-amber-950/20 border-l-2 border-l-amber-500' 
                      : 'bg-blue-950/20 border-l-2 border-l-blue-500'
                  }`}
                >
                  {/* Drag handle */}
                  <span className="text-slate-500 cursor-grab">☰</span>
                  {/* Court badge */}
                  <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                    isCourtA ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'
                  }`}>
                    {isCourtA ? 'A' : 'B'}
                  </span>
                  
                  {/* Group info */}
                  {editingGroup?.id === group.id ? (
                    <Input
                      value={editingGroup.name}
                      onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
                      className="bg-[#1e3a5f] border-[#2a4a6f] flex-1 h-8 text-sm"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          updateGroup(group.id, { name: editingGroup.name })
                          setEditingGroup(null)
                        }
                        if (e.key === 'Escape') setEditingGroup(null)
                      }}
                    />
                  ) : (
                    <div className="flex-1 min-w-0">
                      <span className="text-white text-sm font-medium">{group.name}</span>
                      <span className="text-[#6b8fad] text-xs ml-1">({memberCount})</span>
                    </div>
                  )}
                  
                  {/* Non-bogu toggle */}
                  <div className="flex items-center gap-1">
                    {group.isNonBogu && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">Hantei</span>
                    )}
                    {editMode && (
                      <Switch
                        checked={group.isNonBogu}
                        onCheckedChange={(checked) => updateGroup(group.id, { isNonBogu: checked })}
                        className="scale-75"
                      />
                    )}
                  </div>
                  
                  {/* Edit/Delete buttons - only in edit mode */}
                  {editMode && (
                    <div className="flex gap-0.5">
                      {editingGroup?.id === group.id ? (
                        <>
                          <button
                            onClick={() => {
                              updateGroup(group.id, { name: editingGroup.name })
                              setEditingGroup(null)
                            }}
                            className="p-1.5 rounded text-green-400 hover:bg-green-900/30"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingGroup(null)}
                            className="p-1.5 rounded text-slate-400 hover:bg-slate-700/30"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingGroup(group)}
                            className="p-1.5 rounded text-slate-400 hover:bg-slate-700/30"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteGroup(group.id)}
                            className="p-1.5 rounded text-red-400 hover:bg-red-900/30"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#142130] border-white/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base">Rules</CardTitle>
        </CardHeader>
        <CardContent className="text-[#b8d4ec] text-xs space-y-2">
          <div>
            <span className="font-semibold text-white">Bogu:</span> First to 2 ippons wins, 3 min, draws allowed
          </div>
          <div>
            <span className="font-semibold text-orange-400">Hantei:</span> Judge decision, no ippons, no draws
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


function TournamentManager({
  state,
  setState,
  getMemberById,
  getGroupById,
  generateTournament,
  refreshTournamentParticipants,
  archiveTournament,
}: {
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
  getMemberById: (id: string) => Member | undefined
  getGroupById: (id: string) => Group | undefined
  generateTournament: (month: string, year: number, date: string) => void
  refreshTournamentParticipants: () => void
  archiveTournament: () => void
}) {
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const tournament = state.currentTournament

  const startTournament = () => {
    if (!tournament) return
    setState(prev => ({
      ...prev,
      currentTournament: { ...tournament, status: 'in_progress' }
    }))
    toast.success('Tournament started!')
  }

  const clearTournament = () => {
    setState(prev => ({
      ...prev,
      currentTournament: null,
      currentMatchIndexA: 0,
      currentMatchIndexB: 0,
      timerSecondsA: 0,
      timerSecondsB: 0,
      timerRunningA: false,
      timerRunningB: false,
    }))
    toast.success('Tournament cleared')
  }

  const swapMatchCourt = (matchId: string) => {
    if (!tournament) return
    setState(prev => ({
      ...prev,
      currentTournament: {
        ...tournament,
        matches: (tournament.matches || []).map(m => 
          m.id === matchId ? { ...m, court: m.court === 'A' ? 'B' : 'A' } : m
        )
      }
    }))
  }

  const setGroupCourt = (groupId: string, court: 'A' | 'B') => {
    if (!tournament) return
    // Remove from shared groups when assigning to specific court
    setState(prev => ({
      ...prev,
      sharedGroups: prev.sharedGroups.filter(g => g !== groupId),
      currentTournament: {
        ...tournament,
        matches: (tournament.matches || []).map(m => 
          m.groupId === groupId ? { ...m, court } : m
        )
      }
    }))
    toast.success(`All ${getGroupById(groupId)?.name || 'group'} matches moved to Court ${court}`)
  }

  const toggleSharedGroup = (groupId: string) => {
    const isCurrentlyShared = state.sharedGroups.includes(groupId)
    if (isCurrentlyShared) {
      // Remove from shared - assign all to Court A
      setState(prev => ({
        ...prev,
        sharedGroups: prev.sharedGroups.filter(g => g !== groupId),
        currentTournament: {
          ...tournament!,
          matches: (tournament!.matches || []).map(m => 
            m.groupId === groupId && m.status === 'pending' ? { ...m, court: 'A' } : m
          )
        }
      }))
      toast.success(`${getGroupById(groupId)?.name} now on Court A only`)
    } else {
      // Add to shared groups
      setState(prev => ({
        ...prev,
        sharedGroups: [...prev.sharedGroups, groupId]
      }))
      toast.success(`${getGroupById(groupId)?.name} shared between both courts`)
    }
  }

  // Update individual match settings (timer, match type)
  const updateMatchSettings = (matchId: string, field: string, value: number | string) => {
    if (!tournament) return
    setState(prev => ({
      ...prev,
      currentTournament: {
        ...tournament,
        matches: (tournament.matches || []).map(m => 
          m.id === matchId ? { ...m, [field]: value } : m
        )
      }
    }))
  }

  // Update all matches in a group with same settings
  const setGroupMatchSettings = (groupId: string, field: string, value: number | string) => {
    if (!tournament) return
    setState(prev => ({
      ...prev,
      currentTournament: {
        ...tournament,
        matches: (tournament.matches || []).map(m => 
          m.groupId === groupId ? { ...m, [field]: value } : m
        )
      }
    }))
    toast.success(`Updated ${field} for all ${getGroupById(groupId)?.name || 'group'} matches`)
  }

  // Track dragged group in tournament
  const [draggedTournamentGroupId, setDraggedTournamentGroupId] = useState<string | null>(null)

  const reorderTournamentGroups = (draggedId: string, targetId: string) => {
    if (!tournament || !tournament.groupOrder || draggedId === targetId) return
    const currentOrder = [...tournament.groupOrder]
    const draggedIdx = currentOrder.indexOf(draggedId)
    const targetIdx = currentOrder.indexOf(targetId)
    if (draggedIdx === -1 || targetIdx === -1) return
    currentOrder.splice(draggedIdx, 1)
    currentOrder.splice(targetIdx, 0, draggedId)
    setState(prev => ({
      ...prev,
      currentTournament: { ...tournament, groupOrder: currentOrder }
    }))
  }

    if (!tournament || !tournament.groupOrder) {
    return (
      <Card className="bg-[#142130] border-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Tournament Setup</CardTitle>
          <CardDescription className="text-[#b8d4ec]">
            Generate a round-robin tournament. You can generate before selecting participants, then refresh to add them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#b8d4ec]">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="bg-[#243a52]/50 border-[#2a4a6f] bg-[#142130] hover:bg-[#1e3a5f]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#243a52]/50 border-[#2a4a6f] bg-[#142130] hover:bg-[#1e3a5f]">
                  {MONTHS.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#b8d4ec]">Year</Label>
              <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="bg-[#243a52]/50 border-[#2a4a6f] bg-[#142130] hover:bg-[#1e3a5f]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#243a52]/50 border-[#2a4a6f] bg-[#142130] hover:bg-[#1e3a5f]">
                  {[2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#b8d4ec]">Date</Label>
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#142130] border-[#2a4a6f] text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-[#1e3a5f]/30 rounded-xl p-4 text-center border border-white/5">
              <div className="text-3xl font-bold text-white">{state.members.length}</div>
              <div className="text-sm text-[#b8d4ec]">Total Members</div>
            </div>
            <div className="bg-[#1e3a5f]/30 rounded-xl p-4 text-center border border-white/5">
              <div className="text-3xl font-bold text-orange-400">
                {state.members.filter(m => m.isParticipating).length}
              </div>
              <div className="text-sm text-[#b8d4ec]">Participating</div>
            </div>
            <div className="bg-[#1e3a5f]/30 rounded-xl p-4 text-center border border-white/5">
              <div className="text-3xl font-bold text-white">{state.groups.length}</div>
              <div className="text-sm text-[#b8d4ec]">Groups</div>
            </div>
            <div className="bg-[#1e3a5f]/30 rounded-xl p-4 text-center border border-white/5">
              <div className="text-3xl font-bold text-emerald-400">
                {(() => {
                  const participants = state.members.filter(m => m.isParticipating)
                  const byGroup = new Map<string, number>()
                  participants.forEach(p => byGroup.set(p.group, (byGroup.get(p.group) || 0) + 1))
                  let total = 0
                  byGroup.forEach(count => total += (count * (count - 1)) / 2)
                  return total
                })()}
              </div>
              <div className="text-sm text-[#b8d4ec]">Est. Matches</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-medium">Participants by Group:</h4>
            <div className="flex flex-wrap gap-2">
              {state.groups.map(g => {
                const count = state.members.filter(m => m.group === g.id && m.isParticipating).length
                return (
                  <Badge 
                    key={g.id} 
                    variant="outline" 
                    className={`${g.isNonBogu ? 'border-orange-500 text-orange-400' : 'border-[#2a4a6f] text-[#b8d4ec]'}`}
                  >
                    {g.name}: {count}
                  </Badge>
                )
              })}
            </div>
          </div>

          <Button 
            onClick={() => generateTournament(selectedMonth, selectedYear, selectedDate)}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Generate Tournament
          </Button>
        </CardContent>
      </Card>
    )
  }

  const completedMatches = (tournament.matches || []).filter(m => m.status === 'completed').length
  const totalMatches = (tournament.matches || []).length
  const isComplete = totalMatches > 0 && completedMatches === totalMatches
  const courtAMatches = (tournament.matches || []).filter(m => m.court === 'A')
  const courtBMatches = (tournament.matches || []).filter(m => m.court === 'B')

  return (
    <div className="space-y-4">
      <Card className="bg-[#142130] border-white/5 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-white text-lg sm:text-xl">{tournament.name}</CardTitle>
              <CardDescription className="text-[#8fb3d1] text-sm">
                {tournament.date ? new Date(tournament.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : `${tournament.month} ${tournament.year}`}
              </CardDescription>
            </div>
            <Badge className={`text-sm px-3 py-1 ${
              tournament.status === 'setup' ? 'bg-yellow-600' :
              tournament.status === 'in_progress' ? (isComplete ? 'bg-emerald-600' : 'bg-amber-500') :
              'bg-emerald-600'
            }`}>
              {tournament.status === 'setup' ? 'Setup' : tournament.status === 'in_progress' ? (isComplete ? 'Complete!' : 'In Progress') : 'Completed'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${(completedMatches / totalMatches) * 100}%` }}
              />
            </div>
            <span className="text-[#b8d4ec] text-sm">{completedMatches}/{totalMatches} matches</span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-2 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-amber-400">{courtAMatches.length}</div>
              <div className="text-xs sm:text-sm text-[#8fb3d1]">Court A</div>
            </div>
            <div className="bg-[#243a52]/30 border border-white/5 rounded-lg p-2 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-[#b8d4ec]">{courtBMatches.length}</div>
              <div className="text-xs sm:text-sm text-[#8fb3d1]">Court B</div>
            </div>
          </div>

          {/* Volunteer Courtkeepers */}
          {(() => {
            const courtkeeperVolunteers = state.volunteers.filter(v => 
              v.signups.some(s => s.isShiaiSignup && s.tournamentId === tournament.id && s.shiaiRole === 'courtkeeper')
            )
            const generalVolunteers = state.volunteers.filter(v => 
              v.signups.some(s => s.isShiaiSignup && s.tournamentId === tournament.id && s.shiaiRole === 'general')
            )
            if (courtkeeperVolunteers.length === 0 && generalVolunteers.length === 0) return null
            return (
              <div className="bg-pink-900/20 border border-pink-700/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span className="text-sm font-medium text-pink-400">Volunteers Signed Up</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {courtkeeperVolunteers.map(v => (
                    <span key={v.id} className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded-full flex items-center gap-1">
                      <Swords className="w-3 h-3" /> {v.firstName} {v.lastName}
                    </span>
                  ))}
                  {generalVolunteers.map(v => (
                    <span key={v.id} className="px-2 py-1 bg-pink-500/20 text-pink-300 text-xs rounded-full flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {v.firstName} {v.lastName}
                    </span>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Timer Settings */}
          <div className="bg-[#1e3a5f]/20 rounded-lg p-3 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#b8d4ec]">Timer Options</span>
              <span className="text-xs text-slate-500">Available durations for matches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[60, 90, 120, 150, 180, 240, 300].map(secs => {
                const isSelected = (tournament.timerOptions || [120, 180, 240, 300]).includes(secs)
                return (
                  <button
                    key={secs}
                    onClick={() => {
                      const current = tournament.timerOptions || [120, 180, 240, 300]
                      const newOptions = isSelected 
                        ? current.filter(t => t !== secs)
                        : [...current, secs].sort((a, b) => a - b)
                      if (newOptions.length === 0) return // Don't allow empty
                      setState(prev => ({
                        ...prev,
                        currentTournament: { ...tournament, timerOptions: newOptions }
                      }))
                    }}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      isSelected 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {Math.floor(secs / 60)}:{(secs % 60).toString().padStart(2, '0')}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {tournament.status === 'setup' && (
              <>
                <Button onClick={startTournament} className="bg-emerald-600 hover:bg-emerald-700">
                  <Play className="w-4 h-4 mr-2" />
                  Start Tournament
                </Button>
                <Button onClick={refreshTournamentParticipants} variant="outline" className="border-[#2a4a6f] bg-[#142130] hover:bg-[#1e3a5f]">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Participants
                </Button>
              </>
            )}
            {tournament.status === 'in_progress' && !isComplete && (
              <Button onClick={refreshTournamentParticipants} variant="outline" className="h-10 px-4 border-[#2a4a6f] bg-[#142130] hover:bg-[#1e3a5f]">
                <RefreshCw className="w-4 h-4 mr-2" />
                Update Participants
              </Button>
            )}
            {isComplete && (
              <Button onClick={archiveTournament} className="h-10 px-4 bg-orange-600 hover:bg-orange-700">
                <History className="w-4 h-4 mr-2" />
                Archive & Complete
              </Button>
            )}
            <Button variant="outline" onClick={clearTournament} className="h-10 px-4 border-red-700/60 text-red-400 bg-red-900/20 hover:bg-red-800/40 hover:border-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Tournament
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Match Schedule by Group with Court Assignment */}
      {(tournament.groupOrder || []).map((groupId) => {
        const group = getGroupById(groupId)
        const groupMatches = (tournament.matches || []).filter(m => m.groupId === groupId)
        const isShared = state.sharedGroups.includes(groupId)
        const isCourtA = !isShared && groupMatches[0]?.court === 'A'
        const isCourtB = !isShared && groupMatches[0]?.court === 'B'
        const isDraggingGroup = draggedTournamentGroupId === groupId
        const isDragTargetGroup = draggedTournamentGroupId && draggedTournamentGroupId !== groupId
        
        return (
          <Card 
            key={groupId} 
            draggable
            onDragStart={(e) => {
              setDraggedTournamentGroupId(groupId)
              e.dataTransfer.effectAllowed = 'move'
            }}
            onDragEnd={() => setDraggedTournamentGroupId(null)}
            onDragOver={(e) => {
              if (!isDragTargetGroup) return
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
            }}
            onDrop={(e) => {
              e.preventDefault()
              if (draggedTournamentGroupId && isDragTargetGroup) {
                reorderTournamentGroups(draggedTournamentGroupId, groupId)
              }
              setDraggedTournamentGroupId(null)
            }}
            className={`border-l-2 transition-all cursor-grab active:cursor-grabbing ${
              isDraggingGroup ? 'opacity-50 scale-[0.98]' :
              isDragTargetGroup ? 'border-2 border-dashed border-amber-400/50' :
              isShared ? 'border-l-emerald-500' : isCourtA ? 'border-l-amber-500' : 'border-l-blue-500'
            }`}
          >
            <CardHeader className="p-3 pb-2">
              {/* Row 1: Group name and progress */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500 cursor-grab">☰</span>
                <span className={`px-1.5 h-6 rounded flex items-center justify-center text-xs font-bold ${
                  isShared ? 'bg-emerald-500 text-white' : isCourtA ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'
                }`}>
                  {isShared ? 'A+B' : isCourtA ? 'A' : 'B'}
                </span>
                <span className="text-white font-medium text-sm">{group?.name || groupId}</span>
                {group?.isNonBogu && <span className="text-[9px] px-1 py-0.5 bg-orange-900/40 text-orange-300 rounded">Hantei</span>}
                <span className="text-[10px] text-[#6b8fad] ml-auto">{groupMatches.filter(m => m.status === 'completed').length}/{groupMatches.length}</span>
              </div>
              {/* Row 2: Settings */}
              <div className="flex items-center gap-2 mt-2 px-4">
                <select
                  value={groupMatches[0]?.timerDuration || 180}
                  onChange={(e) => setGroupMatchSettings(groupId, 'timerDuration', parseInt(e.target.value))}
                  className="bg-[#1a2d42] border border-[#1e3a5f] rounded px-2 py-1 text-xs text-[#b8d4ec]"
                >
                  {(tournament.timerOptions || [120, 180, 240, 300]).map(secs => (
                    <option key={secs} value={secs}>{Math.floor(secs / 60)}m</option>
                  ))}
                </select>
                <select
                  value={groupMatches[0]?.matchType || 'sanbon'}
                  onChange={(e) => setGroupMatchSettings(groupId, 'matchType', e.target.value)}
                  className="bg-[#1a2d42] border border-[#1e3a5f] rounded px-2 py-1 text-xs text-[#b8d4ec]"
                >
                  <option value="sanbon">Sanbon</option>
                  <option value="ippon">Ippon</option>
                </select>
                <div className="flex rounded overflow-hidden border border-[#1e3a5f] ml-auto">
                  <button
                    className={`px-3 py-1 text-xs font-bold ${isCourtA ? 'bg-amber-500 text-black' : 'bg-[#1a2d42] text-[#8fb3d1]'}`}
                    onClick={() => setGroupCourt(groupId, 'A')}
                  >A</button>
                  <button
                    className={`px-3 py-1 text-xs font-bold ${isShared ? 'bg-emerald-500 text-white' : 'bg-[#1a2d42] text-[#8fb3d1]'}`}
                    onClick={() => toggleSharedGroup(groupId)}
                  >A+B</button>
                  <button
                    className={`px-3 py-1 text-xs font-bold ${isCourtB ? 'bg-blue-500 text-white' : 'bg-[#1a2d42] text-[#8fb3d1]'}`}
                    onClick={() => setGroupCourt(groupId, 'B')}
                  >B</button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72 pr-2">
                <div className="space-y-2">
                  {groupMatches.map((match, idx) => {
                    const p1 = getMemberById(match.player1Id)
                    const p2 = getMemberById(match.player2Id)
                    const timerMins = Math.floor((match.timerDuration || 180) / 60)
                    const isIppon = match.matchType === 'ippon'
                    return (
                      <div 
                        key={match.id}
                        className={`p-2 sm:p-3 rounded-lg ${
                          match.status === 'completed' ? 'bg-[#243a52]/20' :
                          match.status === 'in_progress' ? 'bg-emerald-900/20 border border-emerald-700' :
                          'bg-[#142130]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[#6b8fad] text-xs w-5">#{idx + 1}</span>
                          {(match.round || 1) > 1 && (
                            <span className="text-[9px] px-1 py-0.5 bg-purple-900/50 text-purple-300 rounded border border-purple-500/30">
                              R{match.round}
                            </span>
                          )}
                          <button
                            className={`w-6 h-6 rounded text-xs font-bold ${match.court === 'A' ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'}`}
                            onClick={() => swapMatchCourt(match.id)}
                          >
                            {match.court}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 text-sm">
                              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
                              <span className={`truncate ${match.winner === 'player1' ? 'text-red-400 font-semibold' : 'text-white'}`}>
                                {p1 ? formatDisplayName(p1, state.members, state.useFirstNamesOnly) : '?'}
                              </span>
                              <span className="text-[#6b8fad] mx-1">vs</span>
                              <span className="w-2 h-2 rounded-full bg-white flex-shrink-0"></span>
                              <span className={`truncate ${match.winner === 'player2' ? 'text-blue-100 font-semibold' : 'text-white'}`}>
                                {p2 ? formatDisplayName(p2, state.members, state.useFirstNamesOnly) : '?'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Match settings for pending matches */}
                          {match.status === 'pending' && (
                            <div className="flex items-center gap-1">
                              <select
                                value={match.timerDuration || 180}
                                onChange={(e) => updateMatchSettings(match.id, 'timerDuration', parseInt(e.target.value))}
                                className="bg-[#0f1a24] border border-[#1e3a5f] rounded px-1 py-0.5 text-[10px] text-[#8fb3d1] w-12"
                              >
                                {(tournament.timerOptions || [120, 180, 240, 300]).map(secs => (
                                  <option key={secs} value={secs}>{Math.floor(secs / 60)}m</option>
                                ))}
                              </select>
                              <select
                                value={match.matchType || 'sanbon'}
                                onChange={(e) => updateMatchSettings(match.id, 'matchType', e.target.value)}
                                className="bg-[#0f1a24] border border-[#1e3a5f] rounded px-1 py-0.5 text-[10px] text-[#8fb3d1] w-12"
                              >
                                <option value="sanbon">Sanbon</option>
                                <option value="ippon">Ippon</option>
                              </select>
                            </div>
                          )}
                        </div>
                        
                        {/* Status row */}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-[#6b8fad]">
                            {match.status === 'completed' && match.actualDuration ? 
                              `${Math.floor(match.actualDuration / 60)}:${(match.actualDuration % 60).toString().padStart(2, '0')}` : 
                              `${timerMins}m · ${isIppon ? 'Ippon' : 'Sanbon'}`
                            }
                          </span>
                          {match.status === 'completed' && (
                            <span className={`text-xs px-2 py-0.5 rounded ${match.winner === 'player1' ? 'bg-red-900/30 text-red-400' : match.winner === 'player2' ? 'bg-blue-900/30 text-blue-200' : 'bg-[#1a2d42] text-[#8fb3d1]'}`}>
                              {match.winner === 'draw' ? 'Draw' : 
                               match.winner === 'player1' ? `Win ${match.isHantei ? '(Hantei)' : (match.player1Score?.length || 0) + '-' + (match.player2Score?.length || 0)}` :
                               `Win ${match.isHantei ? '(Hantei)' : (match.player1Score?.length || 0) + '-' + (match.player2Score?.length || 0)}`}
                            </span>
                          )}
                          {match.status === 'in_progress' && (
                            <span className={`text-xs px-2 py-0.5 rounded text-white animate-pulse ${match.court === 'A' ? 'bg-amber-500' : 'bg-blue-500'}`}>
                              Live {match.court}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// Standings View Component
function StandingsView({
  state,
  getGroupById,
}: {
  state: AppState
  getMemberById: (id: string) => Member | undefined
  getGroupById: (id: string) => Group | undefined
}) {
  const [selectedGroup, setSelectedGroup] = useState<string>('all')

  if (!state.currentTournament) {
    return (
      <Card className="bg-[#142130] border-white/5 backdrop-blur-sm">
        <CardContent className="p-8 text-center text-[#8fb3d1]">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No tournament in progress</p>
          <p className="text-sm mt-2">Generate a tournament to see standings</p>
        </CardContent>
      </Card>
    )
  }

  const tournamentGroups = state.currentTournament.groups
  const groupsToShow = selectedGroup === 'all' ? tournamentGroups : [selectedGroup]

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedGroup === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedGroup('all')}
          className={selectedGroup === 'all' ? 'bg-amber-600' : 'border-[#1e3a5f]'}
        >
          All Groups
        </Button>
        {tournamentGroups.map(gId => {
          const group = getGroupById(gId)
          return (
            <Button
              key={gId}
              variant={selectedGroup === gId ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedGroup(gId)}
              className={selectedGroup === gId ? 'bg-amber-600' : 'border-[#1e3a5f]'}
            >
              {group?.name || gId}
            </Button>
          )
        })}
      </div>

      {groupsToShow.map(groupId => {
        const group = getGroupById(groupId)
        const standings = calculateStandings(groupId, state.currentTournament!.matches, state.members, state.useFirstNamesOnly)
        const groupMembers = state.members.filter(m => m.group === groupId && m.isParticipating)
        
        if (standings.length === 0) return null

        return (
          <Card key={groupId} className="bg-[#142130] border-white/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                {group?.name || groupId}
                {group?.isNonBogu && <Badge className="bg-orange-900 text-orange-200">Hantei</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2a4a6f] bg-[#142130] hover:bg-[#1e3a5f]">
                      <th className="text-left text-[#b8d4ec] p-2 font-medium">#</th>
                      <th className="text-left text-[#b8d4ec] p-2 font-medium">Name</th>
                      <th className="text-center text-[#b8d4ec] p-2 font-medium">Pts</th>
                      <th className="text-center text-[#b8d4ec] p-2 font-medium">W</th>
                      {!group?.isNonBogu && <th className="text-center text-[#b8d4ec] p-2 font-medium">D</th>}
                      <th className="text-center text-[#b8d4ec] p-2 font-medium">L</th>
                      <th className="text-center text-[#b8d4ec] p-2 font-medium">Left</th>
                      {!group?.isNonBogu && <th className="text-center text-[#b8d4ec] p-2 font-medium">Ippons</th>}
                      {groupMembers.map(m => (
                        <th key={m.id} className="text-center text-[#b8d4ec] p-2 font-medium text-xs">
                          {m.firstName.charAt(0)}{m.lastName.charAt(0)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((standing, idx) => (
                      <tr key={standing.playerId} className="border-b border-white/5 hover:bg-[#142130]">
                        <td className="p-2 text-[#8fb3d1]">{idx + 1}</td>
                        <td className="p-2 text-white font-medium">{standing.playerName}</td>
                        <td className="p-2 text-center text-orange-400 font-bold">{standing.points}</td>
                        <td className="p-2 text-center text-green-400">{standing.wins}</td>
                        {!group?.isNonBogu && <td className="p-2 text-center text-[#b8d4ec]">{standing.draws}</td>}
                        <td className="p-2 text-center text-red-400">{standing.losses}</td>
                        <td className="p-2 text-center text-slate-400">{standing.gamesLeft > 0 ? standing.gamesLeft : '-'}</td>
                        {!group?.isNonBogu && (
                          <td className="p-2 text-center text-[#b8d4ec]">
                            {standing.ipponsScored}-{standing.ipponsAgainst}
                          </td>
                        )}
                        {groupMembers.map(m => {
                          if (m.id === standing.playerId) {
                            return <td key={m.id} className="p-2 text-center text-[#4a6a8a]">-</td>
                          }
                          const result = standing.results.get(m.id)
                          let className = 'p-2 text-center '
                          if (result === 'W') className += 'text-green-400 bg-green-900/20'
                          else if (result === 'L') className += 'text-red-400 bg-red-900/20'
                          else if (result === 'D') className += 'text-[#b8d4ec] bg-[#243a52]/50'
                          else className += 'text-[#4a6a8a]'
                          return <td key={m.id} className={className}>{result || '-'}</td>
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// History View Component with Excel Import
function HistoryView({
  state,
  setState,
}: {
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
}) {
  const [showImport, setShowImport] = useState(false)
  const history = state.history || []
  
  const deleteHistoryEntry = (id: string) => {
    setState(prev => ({
      ...prev,
      history: (prev.history || []).filter(h => h.id !== id)
    }))
    toast.success('History entry deleted')
  }

  const handleExcelImport = (data: string) => {
    try {
      // Parse CSV/Excel data
      // Expected format: Month,Year,GroupName,Rank,PlayerName,Points,Wins,Losses,Draws
      const lines = data.trim().split('\n')
      const startIdx = lines[0].toLowerCase().includes('month') ? 1 : 0
      
      const entries: Map<string, TournamentHistory> = new Map()
      
      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/"/g, ''))
        if (parts.length >= 7) {
          const [month, yearStr, groupName, rankStr, playerName, pointsStr, winsStr, lossesStr, drawsStr] = parts
          const year = parseInt(yearStr)
          const key = `${month}-${year}`
          
          if (!entries.has(key)) {
            entries.set(key, {
              id: generateId(),
              name: `Renbu Monthly Shiai - ${month} ${year}`,
              date: new Date(year, MONTHS.indexOf(month), 1).toISOString().split('T')[0],
              month,
              year,
              results: []
            })
          }
          
          const entry = entries.get(key)!
          let groupResult = entry.results.find(r => r.groupName === groupName)
          if (!groupResult) {
            groupResult = {
              groupId: generateId(),
              groupName,
              isNonBogu: groupName.toLowerCase().includes('non-bogu'),
              standings: []
            }
            entry.results.push(groupResult)
          }
          
          groupResult.standings.push({
            rank: parseInt(rankStr) || groupResult.standings.length + 1,
            playerName,
            points: parseInt(pointsStr) || 0,
            wins: parseInt(winsStr) || 0,
            losses: parseInt(lossesStr) || 0,
            draws: parseInt(drawsStr || '0') || 0,
          })
        }
      }
      
      setState(prev => ({
        ...prev,
        history: [...(prev.history || []), ...entries.values()]
      }))
      
      toast.success(`Imported ${entries.size} tournament(s)`)
      setShowImport(false)
    } catch (e) {
      toast.error('Failed to parse import data')
    }
  }

  if (history.length === 0 && !showImport) {
    return (
      <Card className="bg-[#142130] border-white/5 backdrop-blur-sm">
        <CardContent className="p-8 text-center text-[#8fb3d1]">
          <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No tournament history</p>
          <p className="text-sm mt-2">Completed tournaments will appear here</p>
          <Button className="mt-4" variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import Past History
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={showImport} onOpenChange={setShowImport}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-[#2a4a6f] bg-[#142130] hover:bg-[#1e3a5f]">
              <Upload className="w-4 h-4 mr-2" />
              Import Past History
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#142130] border-white/5 backdrop-blur-sm max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Import Tournament History</DialogTitle>
              <DialogDescription className="text-[#b8d4ec]">
                Import past tournament data from CSV/Excel. Format: Month,Year,GroupName,Rank,PlayerName,Points,Wins,Losses,Draws
              </DialogDescription>
            </DialogHeader>
            <HistoryImportForm onImport={handleExcelImport} />
          </DialogContent>
        </Dialog>
      </div>

      {history.map(entry => (
        <Card key={entry.id} className="bg-[#142130] border-white/5 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">{entry.name}</CardTitle>
                <CardDescription className="text-[#b8d4ec]">{entry.date}</CardDescription>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => deleteHistoryEntry(entry.id)}
                className="h-8 w-8 text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entry.results.map(result => (
                <div key={result.groupId} className="bg-[#142130] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-white font-medium">{result.groupName}</h4>
                    {result.isNonBogu && <Badge className="bg-orange-900 text-orange-200 text-xs">Hantei</Badge>}
                  </div>
                  <div className="space-y-2">
                    {result.standings.slice(0, 3).map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className={`w-6 text-center font-bold ${
                          idx === 0 ? 'text-orange-400' :
                          idx === 1 ? 'text-[#b8d4ec]' :
                          'text-amber-700'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-white flex-1">{s.playerName}</span>
                        <span className="text-orange-400">{s.points}pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// History Import Form
function HistoryImportForm({ onImport }: { onImport: (data: string) => void }) {
  const [importText, setImportText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImportText(event.target?.result as string)
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Upload CSV/Excel File</Label>
        <Input
          type="file"
          accept=".csv,.xlsx,.xls"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="bg-[#1a2d42] border-[#2a4a6f] focus:border-orange-500"
        />
      </div>
      <div className="space-y-2">
        <Label>Or paste data</Label>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          className="w-full h-40 bg-[#243a52]/50 border border-[#1e3a5f] rounded-md p-3 text-white text-sm font-mono"
          placeholder="Month,Year,GroupName,Rank,PlayerName,Points,Wins,Losses,Draws&#10;January,2025,Group A,1,John Doe,6,3,0,0&#10;January,2025,Group A,2,Jane Smith,4,2,1,0"
        />
      </div>
      <DialogFooter>
        <Button 
          onClick={() => onImport(importText)}
          className="bg-orange-600 hover:bg-orange-700"
          disabled={!importText.trim()}
        >
          <Upload className="w-4 h-4 mr-2" />
          Import
        </Button>
      </DialogFooter>
    </div>
  )
}

// Volunteers Tab Component
function VolunteersTab({ 
  state, 
  setState,
  getMemberById
}: { 
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
  getMemberById: (id: string) => Member | undefined
}) {
  const [showAddVolunteer, setShowAddVolunteer] = useState(false)
  const [newFirstName, setNewFirstName] = useState('')
  const [newLastName, setNewLastName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [showLogHours, setShowLogHours] = useState<string | null>(null)
  const [logHours, setLogHours] = useState('0')
  const [logMinutes, setLogMinutes] = useState('0')
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0])
  const [logDescription, setLogDescription] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'hours'>('name')
  const [memberSearchQuery, setMemberSearchQuery] = useState('')

  const addVolunteer = () => {
    if (!newFirstName.trim() || !newLastName.trim()) return
    const volunteer: Volunteer = {
      id: generateId(),
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      phone: newPhone.trim() || undefined,
      relatedMemberIds: selectedMemberIds,
      signups: []
    }
    setState(prev => ({ ...prev, volunteers: [...prev.volunteers, volunteer] }))
    setNewFirstName('')
    setNewLastName('')
    setNewPhone('')
    setSelectedMemberIds([])
    setShowAddVolunteer(false)
    toast.success('Volunteer added')
  }

  const deleteVolunteer = (id: string) => {
    setState(prev => ({ ...prev, volunteers: prev.volunteers.filter(v => v.id !== id) }))
    toast.success('Volunteer removed')
  }

  const logVolunteerHours = (volunteerId: string) => {
    const hours = parseInt(logHours) || 0
    const minutes = parseInt(logMinutes) || 0
    if ((hours === 0 && minutes === 0) || !logDescription.trim()) return
    
    const signup: VolunteerSignup = {
      id: generateId(),
      tournamentId: 'general',
      tournamentName: 'General Volunteering',
      date: logDate,
      hours,
      minutes,
      description: logDescription.trim(),
      isShiaiSignup: false
    }
    setState(prev => ({
      ...prev,
      volunteers: prev.volunteers.map(v => 
        v.id === volunteerId 
          ? { ...v, signups: [...v.signups, signup] }
          : v
      )
    }))
    setShowLogHours(null)
    setLogHours('0')
    setLogMinutes('0')
    setLogDescription('')
    toast.success('Hours logged')
  }

  const deleteSignup = (volunteerId: string, signupId: string) => {
    setState(prev => ({
      ...prev,
      volunteers: prev.volunteers.map(v => 
        v.id === volunteerId 
          ? { ...v, signups: v.signups.filter(s => s.id !== signupId) }
          : v
      )
    }))
    toast.success('Entry removed')
  }

  const getTotalTime = (volunteer: Volunteer) => {
    const totalMinutes = volunteer.signups.reduce((sum, s) => sum + (s.hours * 60) + s.minutes, 0)
    return { hours: Math.floor(totalMinutes / 60), mins: totalMinutes % 60, totalMinutes }
  }

  const getRelatedMemberNames = (volunteer: Volunteer) => {
    return volunteer.relatedMemberIds
      .map(id => getMemberById(id))
      .filter(Boolean)
      .map(m => `${m!.firstName} ${m!.lastName}`)
      .join(', ')
  }

  const filteredVolunteers = state.volunteers
    .filter(v => `${v.firstName} ${v.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'hours') return getTotalTime(b).totalMinutes - getTotalTime(a).totalMinutes
      return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
    })

  const totalVolunteerMinutes = state.volunteers.reduce((sum, v) => sum + getTotalTime(v).totalMinutes, 0)
  const totalHours = Math.floor(totalVolunteerMinutes / 60)
  const totalMins = totalVolunteerMinutes % 60

  // Get courtkeeper volunteers for current tournament
  const courtkeeperVolunteers = state.currentTournament 
    ? state.volunteers.filter(v => 
        v.signups.some(s => s.isShiaiSignup && s.tournamentId === state.currentTournament?.id && s.shiaiRole === 'courtkeeper')
      )
    : []

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="bg-[#142130] border-white/5">
          <CardContent className="p-4 text-center">
            <Heart className="w-6 h-6 text-pink-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{state.volunteers.length}</p>
            <p className="text-xs text-[#6b8fad]">Volunteers</p>
          </CardContent>
        </Card>
        <Card className="bg-[#142130] border-white/5">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{totalHours}h {totalMins}m</p>
            <p className="text-xs text-[#6b8fad]">Total Time</p>
          </CardContent>
        </Card>
        <Card className="bg-[#142130] border-white/5">
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {state.volunteers.filter(v => getTotalTime(v).totalMinutes >= 600).length}
            </p>
            <p className="text-xs text-[#6b8fad]">10+ Hours</p>
          </CardContent>
        </Card>
        <Card className="bg-[#142130] border-white/5">
          <CardContent className="p-4 text-center">
            <Swords className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{courtkeeperVolunteers.length}</p>
            <p className="text-xs text-[#6b8fad]">Courtkeepers</p>
          </CardContent>
        </Card>
      </div>

      {/* Volunteer Hours Table */}
      <Card className="bg-[#142130] border-white/5">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-400" />
              Volunteer Registry
            </CardTitle>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(v: 'name' | 'hours') => setSortBy(v)}>
                <SelectTrigger className="w-32 bg-[#1a2d42] border-[#1e3a5f] text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2d42] border-[#1e3a5f]">
                  <SelectItem value="name">By Name</SelectItem>
                  <SelectItem value="hours">By Hours</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowAddVolunteer(true)} className="bg-pink-600 hover:bg-pink-700">
                <Plus className="w-4 h-4 mr-2" /> Add
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b8fad]" />
            <Input
              placeholder="Search volunteers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a2d42] border-[#1e3a5f] text-white"
            />
          </div>

          {filteredVolunteers.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-[#3d5a78] mx-auto mb-3" />
              <p className="text-[#6b8fad]">
                {state.volunteers.length === 0 ? 'No volunteers yet' : 'No matching volunteers'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 text-[#6b8fad] font-medium">Name</th>
                    <th className="text-left py-3 px-2 text-[#6b8fad] font-medium hidden sm:table-cell">Related To</th>
                    <th className="text-center py-3 px-2 text-[#6b8fad] font-medium">Total Hours</th>
                    <th className="text-center py-3 px-2 text-[#6b8fad] font-medium">Entries</th>
                    <th className="text-right py-3 px-2 text-[#6b8fad] font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVolunteers.map(volunteer => {
                    const time = getTotalTime(volunteer)
                    const relatedNames = getRelatedMemberNames(volunteer)
                    return (
                      <tr key={volunteer.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-pink-400 text-xs font-semibold">
                                {volunteer.firstName[0]}{volunteer.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium">{volunteer.firstName} {volunteer.lastName}</p>
                              {volunteer.phone && <p className="text-xs text-[#6b8fad]">{volunteer.phone}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-[#8fb3d1] hidden sm:table-cell">
                          {relatedNames || <span className="text-[#6b8fad]">-</span>}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            {time.hours}h {time.mins}m
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-center text-[#8fb3d1]">
                          {volunteer.signups.length}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 h-8 w-8 p-0"
                              onClick={() => setShowLogHours(volunteer.id)}
                            >
                              <Clock className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/30 h-8 w-8 p-0"
                              onClick={() => deleteVolunteer(volunteer.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full History Log */}
      <Card className="bg-[#142130] border-white/5">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            Complete Volunteer History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {state.volunteers.flatMap(v => v.signups.map(s => ({ volunteer: v, signup: s }))).length === 0 ? (
            <p className="text-[#6b8fad] text-center py-8">No volunteer entries yet</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {state.volunteers
                .flatMap(v => v.signups.map(s => ({ volunteer: v, signup: s })))
                .sort((a, b) => new Date(b.signup.date).getTime() - new Date(a.signup.date).getTime())
                .map(({ volunteer, signup }) => (
                  <div key={signup.id} className="flex items-center justify-between bg-[#0f1a24]/50 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                        <span className="text-pink-400 text-xs font-semibold">
                          {volunteer.firstName[0]}{volunteer.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{volunteer.firstName} {volunteer.lastName}</p>
                        <p className="text-sm text-[#8fb3d1]">{signup.description}</p>
                        <p className="text-xs text-[#6b8fad]">
                          {new Date(signup.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={signup.isShiaiSignup ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}>
                        {signup.hours}h {signup.minutes}m
                      </Badge>
                      <button 
                        onClick={() => deleteSignup(volunteer.id, signup.id)}
                        className="text-red-400/50 hover:text-red-400 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Volunteer Dialog */}
      <Dialog open={showAddVolunteer} onOpenChange={setShowAddVolunteer}>
        <DialogContent className="bg-[#142130] border-[#1e3a5f] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Add Volunteer</DialogTitle>
            <DialogDescription className="text-[#6b8fad]">
              Add a parent or volunteer to the registry
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="bg-[#1a2d42] border-[#1e3a5f] text-white mt-1"
                  placeholder="John"
                />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  className="bg-[#1a2d42] border-[#1e3a5f] text-white mt-1"
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <Label>Phone (optional)</Label>
              <Input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="bg-[#1a2d42] border-[#1e3a5f] text-white mt-1"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label>Related Member(s)</Label>
              <p className="text-xs text-[#6b8fad] mb-2">Select the member(s) this volunteer is a parent/guardian of</p>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b8fad]" />
                <Input
                  placeholder="Search members..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="pl-10 bg-[#1a2d42] border-[#1e3a5f] text-white h-9 text-sm"
                />
              </div>
              <ScrollArea className="h-32 sm:h-40 border border-[#1e3a5f] rounded-lg p-2">
                {state.members
                  .filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                  .map(member => (
                  <div 
                    key={member.id}
                    className="flex items-center gap-2 p-2 hover:bg-[#1a2d42] rounded cursor-pointer"
                    onClick={() => {
                      setSelectedMemberIds(prev => 
                        prev.includes(member.id) 
                          ? prev.filter(id => id !== member.id)
                          : [...prev, member.id]
                      )
                    }}
                  >
                    <Checkbox checked={selectedMemberIds.includes(member.id)} />
                    <span className="text-white">{member.firstName} {member.lastName}</span>
                  </div>
                ))}
                {state.members.filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(memberSearchQuery.toLowerCase())).length === 0 && (
                  <p className="text-[#6b8fad] text-center py-4">{state.members.length === 0 ? 'No members available' : 'No matching members'}</p>
                )}
              </ScrollArea>
              {selectedMemberIds.length > 0 && (
                <p className="text-xs text-emerald-400 mt-2">{selectedMemberIds.length} member(s) selected</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddVolunteer(false)}>Cancel</Button>
            <Button onClick={addVolunteer} className="bg-pink-600 hover:bg-pink-700" disabled={!newFirstName.trim() || !newLastName.trim()}>
              Add Volunteer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Hours Dialog */}
      <Dialog open={showLogHours !== null} onOpenChange={() => setShowLogHours(null)}>
        <DialogContent className="bg-[#142130] border-[#1e3a5f] text-white">
          <DialogHeader>
            <DialogTitle>Log Volunteer Hours</DialogTitle>
            <DialogDescription className="text-[#6b8fad]">
              Record volunteering time for {state.volunteers.find(v => v.id === showLogHours)?.firstName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="bg-[#1a2d42] border-[#1e3a5f] text-white mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hours</Label>
                <Input
                  type="number"
                  min="0"
                  value={logHours}
                  onChange={(e) => setLogHours(e.target.value)}
                  className="bg-[#1a2d42] border-[#1e3a5f] text-white mt-1"
                />
              </div>
              <div>
                <Label>Minutes</Label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={logMinutes}
                  onChange={(e) => setLogMinutes(e.target.value)}
                  className="bg-[#1a2d42] border-[#1e3a5f] text-white mt-1"
                />
              </div>
            </div>
            <div>
              <Label>What did they volunteer for?</Label>
              <Input
                value={logDescription}
                onChange={(e) => setLogDescription(e.target.value)}
                className="bg-[#1a2d42] border-[#1e3a5f] text-white mt-1"
                placeholder="e.g., Setup, Registration, Cleanup..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogHours(null)}>Cancel</Button>
            <Button 
              onClick={() => showLogHours && logVolunteerHours(showLogHours)} 
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={(parseInt(logHours) === 0 && parseInt(logMinutes) === 0) || !logDescription.trim()}
            >
              <Clock className="w-4 h-4 mr-2" /> Log Hours
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Add Member Form
function AddMemberForm({ 
  groups,
  onAdd 
}: { 
  groups: Group[]
  onAdd: (firstName: string, lastName: string, group: string) => void 
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [group, setGroup] = useState(groups[0]?.id || '')

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>First Name</Label>
        <Input 
          value={firstName} 
          onChange={(e) => setFirstName(e.target.value)}
          className="bg-[#1a2d42] border-[#2a4a6f] focus:border-orange-500"
          placeholder="Enter first name"
        />
      </div>
      <div className="space-y-2">
        <Label>Last Name</Label>
        <Input 
          value={lastName} 
          onChange={(e) => setLastName(e.target.value)}
          className="bg-[#1a2d42] border-[#2a4a6f] focus:border-orange-500"
          placeholder="Enter last name"
        />
      </div>
      <div className="space-y-2">
        <Label>Group</Label>
        <Select value={group} onValueChange={setGroup}>
          <SelectTrigger className="bg-[#243a52]/50 border-[#2a4a6f] bg-[#142130] hover:bg-[#1e3a5f]">
            <SelectValue placeholder="Select group" />
          </SelectTrigger>
          <SelectContent className="bg-[#243a52]/50 border-[#2a4a6f] bg-[#142130] hover:bg-[#1e3a5f]">
            {groups.map(g => (
              <SelectItem key={g.id} value={g.id}>
                {g.name} {g.isNonBogu && '(Hantei)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button 
          onClick={() => onAdd(firstName, lastName, group)}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Add Member
        </Button>
      </DialogFooter>
    </div>
  )
}

// Courtkeeper Portal Component - Significantly Enhanced
function CourtkeeperPortal({ 
  state, 
  setState, 
  isMobile: _isMobile,
  onSwitchPortal,
  getMemberById,
  getGroupById
}: { 
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
  isMobile: boolean
  onSwitchPortal: (portal: string) => void
  getMemberById: (id: string) => Member | undefined
  getGroupById: (id: string) => Group | undefined
}) {
  const [selectedCourt, setSelectedCourt] = useState<'A' | 'B'>('A')
  const [lastMatchId, setLastMatchId] = useState<string | null>(null)
  
  const tournament = state.currentTournament
  
  // Shared groups run on both courts - show pending AND in_progress matches
  const sharedGroups = state.sharedGroups || []
  
  // Court matches include: assigned to this court OR shared group (pending/in_progress)
  const courtAMatches = tournament?.matches?.filter(m => 
    m.court === 'A' || (sharedGroups.includes(m.groupId) && m.status !== 'completed')
  ) || []
  const courtBMatches = tournament?.matches?.filter(m => 
    m.court === 'B' || (sharedGroups.includes(m.groupId) && m.status !== 'completed')
  ) || []
  
  // Get group order for queue display (use tournament groups or custom order)
  const courtAGroupOrder = state.courtAGroupOrder.length > 0 
    ? state.courtAGroupOrder 
    : (tournament?.groups || []).filter(gId => courtAMatches.some(m => m.groupId === gId))
  const courtBGroupOrder = state.courtBGroupOrder.length > 0 
    ? state.courtBGroupOrder 
    : (tournament?.groups || []).filter(gId => courtBMatches.some(m => m.groupId === gId))
  
  // Get pending matches sorted by group order then match order
  const getSortedPendingMatches = (matches: Match[], groupOrder: string[]) => {
    return matches
      .filter(m => m.status !== 'completed')
      .sort((a, b) => {
        const aGroupIdx = groupOrder.indexOf(a.groupId)
        const bGroupIdx = groupOrder.indexOf(b.groupId)
        if (aGroupIdx !== bGroupIdx) return aGroupIdx - bGroupIdx
        return a.orderIndex - b.orderIndex
      })
  }
  
  const pendingMatchesA = getSortedPendingMatches(courtAMatches, courtAGroupOrder)
  const pendingMatchesB = getSortedPendingMatches(courtBMatches, courtBGroupOrder)
  
  // If a match is manually selected, use it; otherwise use first pending match
  const selectedMatchIdA = state.courtASelectedMatch
  const selectedMatchIdB = state.courtBSelectedMatch
  
  const currentMatchA = selectedMatchIdA 
    ? courtAMatches.find(m => m.id === selectedMatchIdA && m.status !== 'completed')
    : pendingMatchesA[0]
  const currentMatchB = selectedMatchIdB
    ? courtBMatches.find(m => m.id === selectedMatchIdB && m.status !== 'completed')
    : pendingMatchesB[0]
  
  const currentMatch = selectedCourt === 'A' ? currentMatchA : currentMatchB
  const pendingMatches = selectedCourt === 'A' ? pendingMatchesA : pendingMatchesB
  const groupOrder = selectedCourt === 'A' ? courtAGroupOrder : courtBGroupOrder
  // const _currentMatches = selectedCourt === 'A' ? courtAMatches : courtBMatches
  
  const timerSeconds = selectedCourt === 'A' ? state.timerSecondsA : state.timerSecondsB
  const timerRunning = selectedCourt === 'A' ? state.timerRunningA : state.timerRunningB
  
  const group = currentMatch ? getGroupById(currentMatch.groupId) : null
  const player1 = currentMatch ? getMemberById(currentMatch.player1Id) : null
  const player2 = currentMatch ? getMemberById(currentMatch.player2Id) : null
  
  // Safe accessors
  const p1Score = currentMatch?.player1Score || []
  const p2Score = currentMatch?.player2Score || []
  const p1Hansoku = currentMatch?.player1Hansoku || 0
  const p2Hansoku = currentMatch?.player2Hansoku || 0
  const matchType = currentMatch?.matchType || 'sanbon'
  const timerDuration = currentMatch?.timerDuration || 180
  const winTarget = matchType === 'sanbon' ? 2 : 1

  // Auto-reset timer when match changes
  useEffect(() => {
    if (currentMatch && currentMatch.id !== lastMatchId) {
      setLastMatchId(currentMatch.id)
      // Reset timer for new match
      if (selectedCourt === 'A') {
        setState(prev => ({ ...prev, timerSecondsA: 0, timerRunningA: false }))
      } else {
        setState(prev => ({ ...prev, timerSecondsB: 0, timerRunningB: false }))
      }
    }
  }, [currentMatch?.id, selectedCourt, lastMatchId, setState])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const toggleTimer = () => {
    const matchId = currentMatch?.id
    
    // When starting timer, lock match to this court
    if (matchId && !timerRunning) {
      setState(prev => {
        if (!prev.currentTournament) return prev
        const updatedMatches = prev.currentTournament.matches.map(m => 
          m.id === matchId ? { ...m, court: selectedCourt, status: 'in_progress' as const } : m
        )
        return {
          ...prev,
          currentTournament: { ...prev.currentTournament, matches: updatedMatches },
          timerRunningA: selectedCourt === 'A' ? true : prev.timerRunningA,
          timerRunningB: selectedCourt === 'B' ? true : prev.timerRunningB,
        }
      })
    } else {
      // Just toggle timer
      if (selectedCourt === 'A') {
        setState(prev => ({ ...prev, timerRunningA: !prev.timerRunningA }))
      } else {
        setState(prev => ({ ...prev, timerRunningB: !prev.timerRunningB }))
      }
    }
  }

  const resetTimer = () => {
    if (selectedCourt === 'A') {
      setState(prev => ({ ...prev, timerSecondsA: 0, timerRunningA: false }))
    } else {
      setState(prev => ({ ...prev, timerSecondsB: 0, timerRunningB: false }))
    }
  }

  // Update match settings (timer duration, match type)
  const updateMatchSettings = (field: 'timerDuration' | 'matchType', value: number | string) => {
    if (!tournament || !currentMatch) return
    const updatedMatches = tournament.matches.map(m => 
      m.id === currentMatch.id ? { ...m, [field]: value } : m
    )
    setState(prev => ({
      ...prev,
      currentTournament: { ...tournament, matches: updatedMatches }
    }))
  }

  // Score type definitions with circled letters
  const scoreTypes = [
    { id: 1, name: 'Men', letter: 'M', circle: 'Ⓜ' },
    { id: 2, name: 'Kote', letter: 'K', circle: 'Ⓚ' },
    { id: 3, name: 'Do', letter: 'D', circle: 'Ⓓ' },
    { id: 4, name: 'Tsuki', letter: 'T', circle: 'Ⓣ' },
    { id: 5, name: 'Hansoku', letter: 'H', circle: 'Ⓗ' }, // Point from opponent's 2 hansoku
  ]

  // Calculate effective points (including hansoku-derived points)
  const getEffectiveScore = (scores: number[], opponentHansoku: number) => {
    const directPoints = scores.length
    const hansokuPoints = Math.floor(opponentHansoku / 2)
    // Cap at win target - can't score more than needed to win
    return Math.min(directPoints + hansokuPoints, winTarget)
  }

  const p1EffectiveScore = getEffectiveScore(p1Score, p2Hansoku)
  const p2EffectiveScore = getEffectiveScore(p2Score, p1Hansoku)

  // In kendo, max 4 hansoku per player (4th = hansoku-make = automatic loss)
  // The button is disabled separately when game is over
  const p1MaxHansoku = 4
  const p2MaxHansoku = 4
  
  // Check if game is over (someone reached win target)
  const gameOver = p1EffectiveScore >= winTarget || p2EffectiveScore >= winTarget

  const addScore = (player: 'player1' | 'player2', scoreType: number) => {
    const matchId = currentMatch?.id
    if (!matchId) return
    
    setState(prev => {
      if (!prev.currentTournament) return prev
      const updatedMatches = prev.currentTournament.matches.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            status: 'in_progress' as const,
            court: selectedCourt,  // Lock to current court when match starts
            player1Score: player === 'player1' ? [...m.player1Score, scoreType] : m.player1Score,
            player2Score: player === 'player2' ? [...m.player2Score, scoreType] : m.player2Score,
          }
        }
        return m
      })
      return { ...prev, currentTournament: { ...prev.currentTournament, matches: updatedMatches } }
    })
  }

  const addHansoku = (player: 'player1' | 'player2') => {
    const matchId = currentMatch?.id
    if (!matchId) return
    
    const currentHansoku = player === 'player1' ? p1Hansoku : p2Hansoku
    const maxHansoku = player === 'player1' ? p1MaxHansoku : p2MaxHansoku
    
    if (currentHansoku >= maxHansoku) {
      toast.error(`Maximum hansoku reached`)
      return
    }

    const newHansoku = currentHansoku + 1

    setState(prev => {
      if (!prev.currentTournament) return prev
      const updatedMatches = prev.currentTournament.matches.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            status: 'in_progress' as const,
            court: selectedCourt,  // Lock to current court when match starts
            player1Hansoku: player === 'player1' ? newHansoku : m.player1Hansoku,
            player2Hansoku: player === 'player2' ? newHansoku : m.player2Hansoku,
          }
        }
        return m
      })
      return { ...prev, currentTournament: { ...prev.currentTournament, matches: updatedMatches } }
    })

    // Toast removed - yellow H circle shows the point visually
  }

  const removeLastScore = (player: 'player1' | 'player2') => {
    const matchId = currentMatch?.id
    if (!matchId) return

    setState(prev => {
      if (!prev.currentTournament) return prev
      const match = prev.currentTournament.matches.find(m => m.id === matchId)
      if (!match) return prev
      const scores = player === 'player1' ? match.player1Score : match.player2Score
      if (scores.length === 0) return prev
      
      const updatedMatches = prev.currentTournament.matches.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            player1Score: player === 'player1' ? m.player1Score.slice(0, -1) : m.player1Score,
            player2Score: player === 'player2' ? m.player2Score.slice(0, -1) : m.player2Score,
          }
        }
        return m
      })
      return { ...prev, currentTournament: { ...prev.currentTournament, matches: updatedMatches } }
    })
  }

  const removeHansoku = (player: 'player1' | 'player2') => {
    const matchId = currentMatch?.id
    if (!matchId) return

    setState(prev => {
      if (!prev.currentTournament) return prev
      const match = prev.currentTournament.matches.find(m => m.id === matchId)
      if (!match) return prev
      const hansoku = player === 'player1' ? match.player1Hansoku : match.player2Hansoku
      if (hansoku === 0) return prev
      
      const updatedMatches = prev.currentTournament.matches.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            player1Hansoku: player === 'player1' ? Math.max(0, m.player1Hansoku - 1) : m.player1Hansoku,
            player2Hansoku: player === 'player2' ? Math.max(0, m.player2Hansoku - 1) : m.player2Hansoku,
          }
        }
        return m
      })
      return { ...prev, currentTournament: { ...prev.currentTournament, matches: updatedMatches } }
    })
  }

  const completeMatch = (winner: 'player1' | 'player2' | 'draw') => {
    const matchId = currentMatch?.id
    if (!matchId) return

    setState(prev => {
      if (!prev.currentTournament) return prev
      
      // First, mark the current match as completed
      const updatedMatches = prev.currentTournament.matches.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            status: 'completed' as const,
            winner: winner === 'draw' ? 'draw' : winner,
            actualDuration: timerSeconds,
          }
        }
        return m
      })
      
      // Create a temporary tournament state to check for next round matches
      const tempTournament = { ...prev.currentTournament, matches: updatedMatches }
      
      // Check if any group needs next round matches (tiebreakers/playoffs)
      const nextRoundMatches = checkAndGenerateNextRoundMatches(tempTournament, prev.members, getGroupById)
      
      // Combine all matches
      const allMatches = [...updatedMatches, ...nextRoundMatches]
      
      // Show toast if new tiebreaker matches were added
      if (nextRoundMatches.length > 0) {
        setTimeout(() => {
          toast.success(`${nextRoundMatches.length} tiebreaker match${nextRoundMatches.length > 1 ? 'es' : ''} added!`, {
            duration: 4000,
          })
        }, 500)
      }
      
      return {
        ...prev,
        currentTournament: { ...prev.currentTournament, matches: allMatches },
        courtASelectedMatch: selectedCourt === 'A' ? null : prev.courtASelectedMatch,
        courtBSelectedMatch: selectedCourt === 'B' ? null : prev.courtBSelectedMatch,
      }
    })
    
    // Show next match toast
    toast('Starting Next Match...', {
      icon: '⚔️',
      duration: 3000,
      style: {
        background: '#1e3a5f',
        color: '#fff',
        border: '2px solid #f59e0b',
        fontSize: '16px',
        fontWeight: 'bold',
        padding: '16px',
      },
    })
  }

  // Select a specific match to play next (override queue)
  const selectMatch = (matchId: string) => {
    if (selectedCourt === 'A') {
      setState(prev => ({ ...prev, courtASelectedMatch: matchId }))
    } else {
      setState(prev => ({ ...prev, courtBSelectedMatch: matchId }))
    }
    toast.success('Match selected - will start next')
  }

  // Clear selected match (resume normal queue)
  const clearSelectedMatch = () => {
    if (selectedCourt === 'A') {
      setState(prev => ({ ...prev, courtASelectedMatch: null }))
    } else {
      setState(prev => ({ ...prev, courtBSelectedMatch: null }))
    }
  }

  // Move group up/down in queue order
  const moveGroupInQueue = (groupId: string, direction: 'up' | 'down') => {
    const currentOrder = selectedCourt === 'A' ? [...courtAGroupOrder] : [...courtBGroupOrder]
    const idx = currentOrder.indexOf(groupId)
    if (idx === -1) return
    
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= currentOrder.length) return
    
    // Swap
    [currentOrder[idx], currentOrder[newIdx]] = [currentOrder[newIdx], currentOrder[idx]]
    
    if (selectedCourt === 'A') {
      setState(prev => ({ ...prev, courtAGroupOrder: currentOrder }))
    } else {
      setState(prev => ({ ...prev, courtBGroupOrder: currentOrder }))
    }
  }

  const toggleSharedGroupCK = (groupId: string) => {
    const isCurrentlyShared = (state.sharedGroups || []).includes(groupId)
    if (isCurrentlyShared) {
      // Remove from shared - assign all pending to current court
      setState(prev => {
        if (!prev.currentTournament) return prev
        const updatedMatches = prev.currentTournament.matches.map(m => 
          m.groupId === groupId && m.status === 'pending' ? { ...m, court: selectedCourt } : m
        )
        return {
          ...prev,
          sharedGroups: (prev.sharedGroups || []).filter(g => g !== groupId),
          currentTournament: { ...prev.currentTournament, matches: updatedMatches }
        }
      })
      toast.success(`Group now on Court ${selectedCourt} only`)
    } else {
      // Add to shared groups
      setState(prev => ({
        ...prev,
        sharedGroups: [...(prev.sharedGroups || []), groupId]
      }))
      toast.success(`Group shared between both courts`)
    }
  }

  // Reorder match in queue (drag and drop)
  const reorderMatch = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return
    
    setState(prev => {
      if (!prev.currentTournament) return prev
      const matches = [...prev.currentTournament.matches]
      const draggedMatch = matches.find(m => m.id === draggedId)
      const targetMatch = matches.find(m => m.id === targetId)
      
      if (!draggedMatch || !targetMatch) return prev
      if (draggedMatch.groupId !== targetMatch.groupId) return prev // Only within same group
      if (draggedMatch.status !== 'pending' || targetMatch.status !== 'pending') return prev
      
      // Swap orderIndex values
      const tempOrder = draggedMatch.orderIndex
      draggedMatch.orderIndex = targetMatch.orderIndex
      targetMatch.orderIndex = tempOrder
      
      return { ...prev, currentTournament: { ...prev.currentTournament, matches } }
    })
  }

  // No tournament or not started
  if (!tournament || tournament.status !== 'in_progress') {
    return (
      <div className="min-h-screen bg-[#0a1017] flex items-center justify-center p-4">
        <Toaster theme="dark" position="top-center" />
        <Card className="bg-[#0f1a24] border-[#1e3a5f] max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-white text-center">No Active Tournament</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <ShiaijoLogo size={80} />
            <p className="text-[#b8d4ec]">
              {tournament ? 'Tournament needs to be started from Admin Portal' : 'No tournament generated yet'}
            </p>
            <Button onClick={() => onSwitchPortal('admin')} variant="outline" className="border-orange-500 text-orange-400">
              Go to Admin Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No current match
  if (!currentMatch) {
    return (
      <div className="min-h-screen bg-[#0a1017] flex items-center justify-center p-4">
        <Toaster theme="dark" position="top-center" />
        <Card className="bg-[#0f1a24] border-[#1e3a5f] max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-white text-center">All Matches Complete!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Trophy className="w-16 h-16 text-amber-500 mx-auto" />
            <p className="text-[#b8d4ec]">Court {selectedCourt} has no more matches</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setSelectedCourt(selectedCourt === 'A' ? 'B' : 'A')} className="bg-[#1e3a5f]">
                Switch to Court {selectedCourt === 'A' ? 'B' : 'A'}
              </Button>
              <Button onClick={() => onSwitchPortal('admin')} variant="outline" className="border-orange-500 text-orange-400">
                Admin Portal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const [showQueue, setShowQueue] = useState(false)
  const [showGroupQueue, setShowGroupQueue] = useState(true)
  const [showWinModal, setShowWinModal] = useState(false)
  const [pendingWinner, setPendingWinner] = useState<'player1' | 'player2' | null>(null)
  const [modalDismissedForMatch, setModalDismissedForMatch] = useState<string | null>(null)
  const [draggedMatchId, setDraggedMatchId] = useState<string | null>(null)
  const [touchStartY, setTouchStartY] = useState<number | null>(null)
  
  // Detect when someone wins and show modal, or close if score undone
  useEffect(() => {
    const p1Wins = p1EffectiveScore >= winTarget
    const p2Wins = p2EffectiveScore >= winTarget
    const matchId = currentMatch?.id
    
    // Don't show modal if user dismissed it for this match
    const wasDismissed = modalDismissedForMatch === matchId
    
    if (p1Wins && !showWinModal && !wasDismissed) {
      setPendingWinner('player1')
      setShowWinModal(true)
    } else if (p2Wins && !showWinModal && !wasDismissed) {
      setPendingWinner('player2')
      setShowWinModal(true)
    } else if (showWinModal && !p1Wins && !p2Wins) {
      // Score was undone (possibly from another device) - close modal
      setShowWinModal(false)
      setPendingWinner(null)
      setModalDismissedForMatch(null) // Reset so modal can show again if they win again
    }
  }, [p1EffectiveScore, p2EffectiveScore, winTarget, showWinModal, currentMatch?.id, modalDismissedForMatch])

  // Undo the winning point
  const undoWinningPoint = () => {
    if (!currentMatch) return
    const matchId = currentMatch.id
    
    // Figure out what caused the win - check hansoku first
    const winner = pendingWinner
    if (!winner) return
    
    // If winner got point from opponent's hansoku, undo hansoku
    const opponentHansoku = winner === 'player1' ? p2Hansoku : p1Hansoku
    const winnerDirectScore = winner === 'player1' ? p1Score : p2Score
    
    if (opponentHansoku >= 2 && opponentHansoku % 2 === 0) {
      // Last point was from hansoku pair - remove opponent's last hansoku
      const opponent = winner === 'player1' ? 'player2' : 'player1'
      setState(prev => {
        if (!prev.currentTournament) return prev
        const updatedMatches = prev.currentTournament.matches.map(m => {
          if (m.id === matchId) {
            return {
              ...m,
              player1Hansoku: opponent === 'player1' ? Math.max(0, m.player1Hansoku - 1) : m.player1Hansoku,
              player2Hansoku: opponent === 'player2' ? Math.max(0, m.player2Hansoku - 1) : m.player2Hansoku,
            }
          }
          return m
        })
        return { ...prev, currentTournament: { ...prev.currentTournament, matches: updatedMatches } }
      })
    } else if (winnerDirectScore.length > 0) {
      // Last point was direct score - remove it
      setState(prev => {
        if (!prev.currentTournament) return prev
        const updatedMatches = prev.currentTournament.matches.map(m => {
          if (m.id === matchId) {
            return {
              ...m,
              player1Score: winner === 'player1' ? m.player1Score.slice(0, -1) : m.player1Score,
              player2Score: winner === 'player2' ? m.player2Score.slice(0, -1) : m.player2Score,
            }
          }
          return m
        })
        return { ...prev, currentTournament: { ...prev.currentTournament, matches: updatedMatches } }
      })
    }
    
    setShowWinModal(false)
    setPendingWinner(null)
    setModalDismissedForMatch(null)
  }

  // Confirm the win
  const confirmWin = () => {
    if (pendingWinner) {
      completeMatch(pendingWinner)
    }
    setShowWinModal(false)
    setPendingWinner(null)
    setModalDismissedForMatch(null)
  }
  
  // Get next pending match (after current)
  const getNextMatch = () => {
    const currentIdx = pendingMatches.findIndex(m => m.id === currentMatch?.id)
    return currentIdx >= 0 && currentIdx < pendingMatches.length - 1 
      ? pendingMatches[currentIdx + 1] 
      : pendingMatches.find(m => m.id !== currentMatch?.id)
  }
  const nextMatch = getNextMatch()
  const nextPlayer1 = nextMatch ? getMemberById(nextMatch.player1Id) : null
  const nextPlayer2 = nextMatch ? getMemberById(nextMatch.player2Id) : null
  const nextGroup = nextMatch ? getGroupById(nextMatch.groupId) : null

  return (
    <div className="h-screen bg-[#0a0e14] text-white flex flex-col overflow-hidden">
      <Toaster theme="dark" position="top-center" />
      
      {/* Header */}
      <header className="bg-[#0f1419] border-b border-slate-800 px-3 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShiaijoLogo size={28} glow />
            <span className="font-bold text-sm">COURTKEEPER</span>
          </div>
          <button 
            onClick={() => setShowQueue(true)}
            className={`p-2 rounded-lg ${selectedCourt === 'A' ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'}`}
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-3 gap-3 overflow-auto">
        {/* Group Header Bar */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded font-bold ${selectedCourt === 'A' ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'}`}>
              {selectedCourt === 'A' ? 'COURT A' : 'COURT B'}
            </span>
            <span className="text-slate-400 font-semibold uppercase">{group?.name || 'No Match'}</span>
            {group?.isNonBogu && <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded text-[10px]">Hantei</span>}
          </div>
          {!group?.isNonBogu && (
            <div className="flex items-center gap-1">
              <select 
                value={timerDuration} 
                onChange={(e) => updateMatchSettings('timerDuration', parseInt(e.target.value))}
                className="bg-slate-800 border-0 rounded px-1.5 py-0.5 text-[10px] text-slate-300"
              >
                {(tournament?.timerOptions || [120, 180, 240, 300]).map(secs => (
                  <option key={secs} value={secs}>{Math.floor(secs / 60)}:{(secs % 60).toString().padStart(2, '0')}</option>
                ))}
              </select>
              <select 
                value={matchType} 
                onChange={(e) => updateMatchSettings('matchType', e.target.value)}
                className="bg-slate-800 border-0 rounded px-1.5 py-0.5 text-[10px] text-slate-300"
              >
                <option value="sanbon">Sanbon</option>
                <option value="ippon">Ippon</option>
              </select>
            </div>
          )}
        </div>

        {/* Score Display */}
        <div className="bg-gradient-to-r from-red-950/30 via-[#12181f] to-slate-700/20 rounded-xl p-3">
          {/* Names Row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-red-400 text-[10px] font-medium">AKA</p>
              <p className="text-sm font-semibold truncate">
                {player1 ? formatDisplayName(player1, state.members, state.useFirstNamesOnly) : '—'}
              </p>
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-slate-400 text-[10px] font-medium">SHIRO</p>
              <p className="text-sm font-semibold truncate">
                {player2 ? formatDisplayName(player2, state.members, state.useFirstNamesOnly) : '—'}
              </p>
            </div>
          </div>
          
          {/* Score Row: Letters + Numbers + Letters */}
          <div className="flex items-center justify-center gap-2">
            {/* P1 Score Letters (direct + H for opponent hansoku pairs, capped at winTarget) */}
            <div className="flex gap-1 justify-end min-w-[60px]">
              {p1Score.filter(s => s !== 5).slice(0, winTarget).map((s, i) => (
                <span key={`p1-${i}`} className="w-5 h-5 rounded-full border border-red-400 text-red-400 flex items-center justify-center text-[10px] font-bold">
                  {scoreTypes.find(t => t.id === s)?.letter}
                </span>
              ))}
              {/* Yellow H circles - only show what's needed to reach winTarget */}
              {Array.from({ length: Math.min(Math.floor(p2Hansoku / 2), winTarget - Math.min(p1Score.length, winTarget)) }).map((_, i) => (
                <span key={`p1-h-${i}`} className="w-5 h-5 rounded-full border border-yellow-400 bg-yellow-400/20 text-yellow-400 flex items-center justify-center text-[10px] font-bold">
                  H
                </span>
              ))}
            </div>
            
            {/* Center Numbers */}
            <div className="text-2xl sm:text-3xl font-mono font-bold px-2">
              <span className="text-red-400">{p1EffectiveScore}</span>
              <span className="text-slate-500 mx-1">:</span>
              <span className="text-slate-200">{p2EffectiveScore}</span>
            </div>
            
            {/* P2 Score Letters (direct + H for opponent hansoku pairs, capped at winTarget) */}
            <div className="flex gap-1 min-w-[60px]">
              {/* Yellow H circles - only show what's needed to reach winTarget */}
              {Array.from({ length: Math.min(Math.floor(p1Hansoku / 2), winTarget - Math.min(p2Score.length, winTarget)) }).map((_, i) => (
                <span key={`p2-h-${i}`} className="w-5 h-5 rounded-full border border-yellow-400 bg-yellow-400/20 text-yellow-400 flex items-center justify-center text-[10px] font-bold">
                  H
                </span>
              ))}
              {p2Score.filter(s => s !== 5).slice(0, winTarget).map((s, i) => (
                <span key={`p2-${i}`} className="w-5 h-5 rounded-full border border-slate-400 text-slate-300 flex items-center justify-center text-[10px] font-bold">
                  {scoreTypes.find(t => t.id === s)?.letter}
                </span>
              ))}
            </div>
          </div>
          
          {/* Hansoku indicator - fixed layout, always centered */}
          <div className="flex items-center justify-center mt-2 pt-2 border-t border-slate-700/30">
            <div className="w-16 flex justify-end">
              {p1Hansoku % 2 === 1 && <span className="text-yellow-400 text-xl drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]">▲</span>}
            </div>
            <span className="text-slate-500 mx-3 text-xs">Hansoku</span>
            <div className="w-16 flex justify-start">
              {p2Hansoku % 2 === 1 && <span className="text-yellow-400 text-xl drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]">▲</span>}
            </div>
          </div>
        </div>

        {/* Score Buttons - Fixed size, not stretched */}
        {!currentMatch?.isHantei && (
          <div className="grid grid-cols-2 gap-3">
            {/* AKA Controls */}
            <div className="bg-red-950/20 rounded-xl p-3 border border-red-900/30">
              <p className="text-red-400 text-[10px] font-bold mb-2">AKA</p>
              <div className="grid grid-cols-2 gap-2">
                {scoreTypes.slice(0, 4).map(type => (
                  <button
                    key={`p1-${type.id}`}
                    onClick={() => addScore('player1', type.id)}
                    disabled={gameOver}
                    className="h-12 sm:h-14 rounded-lg border-2 border-red-500/50 text-red-400 hover:bg-red-500/20 disabled:opacity-30 flex items-center justify-center"
                  >
                    <span className="w-9 h-9 rounded-full border-2 border-current flex items-center justify-center text-base font-bold">
                      {type.letter}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => removeHansoku('player1')}
                  className="w-9 h-9 rounded-lg text-[10px] border border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10 flex items-center justify-center"
                >
                  <Undo2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => addHansoku('player1')}
                  disabled={p1Hansoku >= p1MaxHansoku || gameOver}
                  className="flex-1 h-9 rounded-lg text-xs border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20 disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  onClick={() => removeLastScore('player1')}
                  className="w-12 h-9 rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-700/50 flex items-center justify-center"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SHIRO Controls */}
            <div className="bg-slate-700/20 rounded-xl p-3 border border-slate-700/30">
              <p className="text-slate-400 text-[10px] font-bold mb-2 text-right">SHIRO</p>
              <div className="grid grid-cols-2 gap-2">
                {scoreTypes.slice(0, 4).map(type => (
                  <button
                    key={`p2-${type.id}`}
                    onClick={() => addScore('player2', type.id)}
                    disabled={gameOver}
                    className="h-12 sm:h-14 rounded-lg border-2 border-slate-500/50 text-slate-300 hover:bg-slate-500/20 disabled:opacity-30 flex items-center justify-center"
                  >
                    <span className="w-9 h-9 rounded-full border-2 border-current flex items-center justify-center text-base font-bold">
                      {type.letter}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => removeLastScore('player2')}
                  className="w-12 h-9 rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-700/50 flex items-center justify-center"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => addHansoku('player2')}
                  disabled={p2Hansoku >= p2MaxHansoku || gameOver}
                  className="flex-1 h-9 rounded-lg text-xs border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20 disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  onClick={() => removeHansoku('player2')}
                  className="w-9 h-9 rounded-lg text-[10px] border border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10 flex items-center justify-center"
                >
                  <Undo2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hantei Buttons */}
        {currentMatch?.isHantei && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => completeMatch('player1')}
              className="h-16 rounded-xl font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 flex items-center justify-center gap-2"
            >
              <Award className="w-5 h-5" /> AKA Wins
            </button>
            <button
              onClick={() => completeMatch('player2')}
              className="h-16 rounded-xl font-bold bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 flex items-center justify-center gap-2"
            >
              <Award className="w-5 h-5" /> SHIRO Wins
            </button>
          </div>
        )}

        {/* Timer */}
        {!group?.isNonBogu && (
          <div className={`rounded-xl p-3 flex items-center gap-3 ${timerSeconds >= timerDuration ? 'bg-amber-950/30 border border-amber-500' : 'bg-slate-800/30'}`}>
            <button
              onClick={toggleTimer}
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                timerRunning ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-white'
              }`}
            >
              {timerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            
            <div className="flex-1 text-center">
              <div className={`text-3xl font-mono font-bold ${timerSeconds >= timerDuration ? 'text-amber-400' : 'text-white'}`}>
                {formatTime(timerSeconds)}
              </div>
              {timerSeconds >= timerDuration ? (
                <div className="w-full h-5 bg-amber-500 rounded-full mt-1 flex items-center justify-center">
                  <span className="text-black font-bold text-xs">TIME!</span>
                </div>
              ) : (
                <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full transition-all bg-emerald-500"
                    style={{ width: `${Math.min((timerSeconds / timerDuration) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
            
            <button
              onClick={resetTimer}
              className="w-12 h-12 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 flex items-center justify-center flex-shrink-0"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Up Next Card */}
        {nextMatch && (
          <div className="bg-slate-800/20 rounded-xl p-2 border border-slate-700/30">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">UP NEXT</span>
              <span className="text-slate-600">{nextGroup?.name}</span>
            </div>
            <div className="flex items-center justify-center gap-2 mt-1 text-sm">
              <span className="text-red-400">{nextPlayer1 ? formatDisplayName(nextPlayer1, state.members, state.useFirstNamesOnly) : '?'}</span>
              <span className="text-slate-500">vs</span>
              <span className="text-slate-300">{nextPlayer2 ? formatDisplayName(nextPlayer2, state.members, state.useFirstNamesOnly) : '?'}</span>
            </div>
          </div>
        )}

        {/* Match Complete Buttons */}
        {!currentMatch?.isHantei && (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => completeMatch('player1')}
              disabled={!gameOver}
              className="py-2.5 rounded-lg font-bold text-xs bg-red-600/80 hover:bg-red-600 disabled:opacity-30"
            >
              AKA Wins
            </button>
            <button
              onClick={() => completeMatch('draw')}
              className="py-2.5 rounded-lg font-bold text-xs bg-slate-700 hover:bg-slate-600"
            >
              Draw
            </button>
            <button
              onClick={() => completeMatch('player2')}
              disabled={!gameOver}
              className="py-2.5 rounded-lg font-bold text-xs bg-slate-500/80 hover:bg-slate-500 disabled:opacity-30"
            >
              SHIRO Wins
            </button>
          </div>
        )}
      </main>

      {/* Win Confirmation Modal */}
      {showWinModal && pendingWinner && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl p-6 max-w-sm w-full text-center border-2 relative ${
            pendingWinner === 'player1' 
              ? 'bg-gradient-to-b from-red-950/90 to-[#1a2535] border-red-500/50' 
              : 'bg-gradient-to-b from-slate-700/90 to-[#1a2535] border-slate-400/50'
          }`}>
            <button
              onClick={() => { setShowWinModal(false); setPendingWinner(null); setModalDismissedForMatch(currentMatch?.id || null) }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
            >
              ✕
            </button>
            <div className="text-5xl mb-3">🏆</div>
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${
              pendingWinner === 'player1' ? 'bg-red-500 text-white' : 'bg-slate-300 text-slate-900'
            }`}>
              {pendingWinner === 'player1' ? 'AKA' : 'SHIRO'}
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {pendingWinner === 'player1' 
                ? (player1 ? formatDisplayName(player1, state.members, state.useFirstNamesOnly) : 'AKA')
                : (player2 ? formatDisplayName(player2, state.members, state.useFirstNamesOnly) : 'SHIRO')
              }
            </h2>
            <p className="text-slate-400 text-lg mb-5">wins!</p>
            <div className="space-y-2">
              <button
                onClick={confirmWin}
                className="w-full py-3 rounded-xl font-bold text-lg bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Yes, Complete Match
              </button>
              <button
                onClick={undoWinningPoint}
                className="w-full py-3 rounded-xl font-bold text-lg bg-slate-700 hover:bg-slate-600 text-slate-300"
              >
                No, Undo Last Point
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Queue Slide Panel */}
      {showQueue && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowQueue(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-80 bg-[#0f1419] border-l border-slate-800 z-50 flex flex-col">
            {/* Panel Header */}
            <div className="p-3 border-b border-slate-800 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold">Menu</span>
                <button onClick={() => setShowQueue(false)} className="p-1 rounded hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Court Switch */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-slate-400 text-xs">Court:</span>
                <button
                  onClick={() => { setSelectedCourt('A'); setShowQueue(false) }}
                  className={`px-4 py-1.5 rounded text-xs font-bold ${selectedCourt === 'A' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'}`}
                >
                  A
                </button>
                <button
                  onClick={() => { setSelectedCourt('B'); setShowQueue(false) }}
                  className={`px-4 py-1.5 rounded text-xs font-bold ${selectedCourt === 'B' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  B
                </button>
              </div>
              
              <Select onValueChange={(value) => onSwitchPortal(value)}>
                <SelectTrigger className="w-full py-2 rounded bg-slate-800 text-slate-400 text-xs hover:bg-slate-700 flex items-center justify-center gap-2 border-0">
                  <ArrowLeftRight className="w-3 h-3" />
                  <span>Switch Portal</span>
                </SelectTrigger>
                <SelectContent className="bg-[#142130] border-[#1e3a5f]">
                  <SelectItem value="spectator" className="text-emerald-300">
                    <span className="flex items-center gap-2"><Eye className="w-4 h-4" /> Spectator</span>
                  </SelectItem>
                  <SelectItem value="admin" className="text-orange-300">
                    <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Admin</span>
                  </SelectItem>
                  <SelectItem value="volunteer" className="text-pink-300">
                    <span className="flex items-center gap-2"><Heart className="w-4 h-4" /> Volunteer</span>
                  </SelectItem>
                  <SelectItem value="select" className="text-[#8fb3d1]">
                    <span className="flex items-center gap-2"><Home className="w-4 h-4" /> Main Menu</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Group Queue - Collapsible */}
            <div className="border-b border-slate-800">
              <button 
                onClick={() => setShowGroupQueue(!showGroupQueue)}
                className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-slate-400 hover:bg-slate-800/50"
              >
                <span>Group Queue</span>
                {showGroupQueue ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showGroupQueue && (
                <div className="px-3 pb-2 space-y-1">
                  {groupOrder.map((groupId, gIdx) => {
                    const groupInfo = getGroupById(groupId)
                    const groupMatchCount = pendingMatches.filter(m => m.groupId === groupId).length
                    const isShared = (state.sharedGroups || []).includes(groupId)
                    if (groupMatchCount === 0) return null
                    return (
                      <div key={groupId} className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${isShared ? 'bg-emerald-500 text-white' : selectedCourt === 'A' ? 'bg-amber-500/30 text-amber-400' : 'bg-blue-500/30 text-blue-400'}`}>
                            {isShared ? 'A+B' : selectedCourt}
                          </span>
                          <span className="text-slate-300">{groupInfo?.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">{groupMatchCount}</span>
                          <button
                            onClick={() => toggleSharedGroupCK(groupId)}
                            className={`px-1.5 h-5 rounded text-[9px] font-medium ${isShared ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                          >{isShared ? '✓A+B' : 'A+B'}</button>
                          <button
                            onClick={() => moveGroupInQueue(groupId, 'up')}
                            disabled={gIdx === 0}
                            className="w-5 h-5 rounded text-[10px] bg-slate-800 text-slate-500 disabled:opacity-30"
                          >▲</button>
                          <button
                            onClick={() => moveGroupInQueue(groupId, 'down')}
                            disabled={gIdx === groupOrder.length - 1}
                            className="w-5 h-5 rounded text-[10px] bg-slate-800 text-slate-500 disabled:opacity-30"
                          >▼</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
            {/* Match Queue Header */}
            <div className="px-3 py-2 flex items-center justify-between flex-shrink-0">
              <span className="text-slate-400 text-xs font-medium">Match Queue</span>
              {(selectedCourt === 'A' ? selectedMatchIdA : selectedMatchIdB) && (
                <button onClick={clearSelectedMatch} className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                  Clear
                </button>
              )}
            </div>
            
            {/* Match Queue List */}
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {groupOrder.map((groupId) => {
                const groupInfo = getGroupById(groupId)
                const groupMatches = pendingMatches.filter(m => m.groupId === groupId)
                if (groupMatches.length === 0) return null
                
                return (
                  <div key={groupId} className="mb-2">
                    <div className="px-1 py-1 flex items-center gap-1">
                      {(state.sharedGroups || []).includes(groupId) && (
                        <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-600 text-white font-bold">A+B</span>
                      )}
                      <span className="text-slate-500 text-[10px] font-medium">{groupInfo?.name}</span>
                    </div>
                    {groupMatches.map((match) => {
                      const mp1 = getMemberById(match.player1Id)
                      const mp2 = getMemberById(match.player2Id)
                      const isSelected = match.id === (selectedCourt === 'A' ? selectedMatchIdA : selectedMatchIdB)
                      const isCurrentlyPlaying = match.id === currentMatch?.id
                      const isSharedGroup = (state.sharedGroups || []).includes(groupId)
                      const isLiveOnOtherCourt = match.status === 'in_progress' && !isCurrentlyPlaying
                      const canDrag = match.status === 'pending' && !isCurrentlyPlaying && !isLiveOnOtherCourt
                      const isDragging = draggedMatchId === match.id
                      const isDragTarget = draggedMatchId && draggedMatchId !== match.id && canDrag
                      
                      return (
                        <div
                          key={match.id}
                          draggable={canDrag}
                          onDragStart={(e) => {
                            if (!canDrag) return
                            setDraggedMatchId(match.id)
                            e.dataTransfer.effectAllowed = 'move'
                          }}
                          onDragEnd={() => setDraggedMatchId(null)}
                          onDragOver={(e) => {
                            if (!isDragTarget) return
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'move'
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            if (draggedMatchId && isDragTarget) {
                              reorderMatch(draggedMatchId, match.id)
                            }
                            setDraggedMatchId(null)
                          }}
                          onTouchStart={(e) => {
                            if (!canDrag) return
                            setTouchStartY(e.touches[0].clientY)
                            setDraggedMatchId(match.id)
                          }}
                          onTouchMove={(e) => {
                            if (!draggedMatchId || touchStartY === null) return
                            const touch = e.touches[0]
                            const target = document.elementFromPoint(touch.clientX, touch.clientY)
                            const matchEl = target?.closest('[data-match-id]')
                            if (matchEl) {
                              const targetId = matchEl.getAttribute('data-match-id')
                              if (targetId && targetId !== draggedMatchId) {
                                reorderMatch(draggedMatchId, targetId)
                              }
                            }
                          }}
                          onTouchEnd={() => {
                            setDraggedMatchId(null)
                            setTouchStartY(null)
                          }}
                          data-match-id={match.id}
                          onClick={() => { if (!isCurrentlyPlaying && !isLiveOnOtherCourt && !isDragging) { selectMatch(match.id); setShowQueue(false) } }}
                          className={`w-full p-2 rounded-lg mb-1 text-xs transition-all cursor-pointer select-none ${
                            isDragging ? 'opacity-50 scale-95 bg-amber-900/50 border border-amber-400' :
                            isDragTarget ? 'border-2 border-dashed border-amber-400/50' :
                            isCurrentlyPlaying ? 'bg-emerald-900/30 border border-emerald-600' 
                            : isLiveOnOtherCourt ? 'bg-emerald-900/20 border border-emerald-700/50 opacity-60'
                            : isSelected ? 'bg-amber-900/30 border border-amber-500'
                            : 'bg-slate-800/50 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center">
                            {canDrag && !isSelected && !isCurrentlyPlaying && (
                              <span className="text-slate-600 mr-2 cursor-grab">☰</span>
                            )}
                            {isCurrentlyPlaying && (
                              <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-500 text-white font-bold mr-2">
                                LIVE{isSharedGroup ? ` ${selectedCourt}` : ''}
                              </span>
                            )}
                            {isLiveOnOtherCourt && (
                              <span className={`text-[8px] px-1 py-0.5 rounded font-bold mr-2 ${match.court === 'A' ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'}`}>
                                LIVE {match.court}
                              </span>
                            )}
                            {isSelected && !isCurrentlyPlaying && !isLiveOnOtherCourt && <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500 text-black font-bold mr-2">NEXT</span>}
                            <span className="text-red-400 truncate flex-1 text-left">
                              {mp1 ? formatDisplayName(mp1, state.members, state.useFirstNamesOnly) : '?'}
                            </span>
                            <span className="text-slate-500 px-2">vs</span>
                            <span className="text-slate-300 truncate flex-1 text-right">
                              {mp2 ? formatDisplayName(mp2, state.members, state.useFirstNamesOnly) : '?'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
              {pendingMatches.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-xs">No pending matches</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}





declare global {
  interface Window {
    storage?: {
      get: (key: string, shared?: boolean) => Promise<{ value: string } | null>
      set: (key: string, value: string, shared?: boolean) => Promise<{ key: string; value: string } | null>
      delete: (key: string, shared?: boolean) => Promise<{ key: string; deleted: boolean } | null>
      list: (prefix?: string, shared?: boolean) => Promise<{ keys: string[] } | null>
    }
  }
}

