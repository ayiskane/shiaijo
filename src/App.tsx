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
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Toaster, toast } from 'sonner'
import { 
  Users, Settings, Trophy, Play, Pause, RotateCcw, 
  Plus, Trash2, Upload, Search, Filter, X, Edit2,
  Menu, Swords, UserPlus,
  Circle, CheckCircle2, Table, History, RefreshCw,
  ArrowLeftRight, Timer, Award, ChevronLeft
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
  ipponsScored: number
  ipponsAgainst: number
  results: Map<string, 'W' | 'L' | 'D' | null>
}

interface AppState {
  members: Member[]
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
  const groupMembers = members.filter(m => m.group === groupId && m.isParticipating)
  
  const standings: Map<string, PlayerStanding> = new Map()
  
  groupMembers.forEach(member => {
    standings.set(member.id, {
      playerId: member.id,
      playerName: formatDisplayName(member, groupMembers, useFirstNamesOnly),
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
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
  const [portal, setPortal] = useState<'select' | 'admin' | 'courtkeeper'>('select')
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
        <img 
          src="/renbu-logo.png" 
          alt="Renbu Kendo" 
          className="w-24 h-24 mb-6 animate-pulse"
        />
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (portal === 'select') {
    return (
      <div className="min-h-screen bg-[#0a1017] flex items-center justify-center p-4">
        <Toaster theme="dark" position="top-center" />
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <img src="/renbu-logo.png" alt="Renbu" className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Shiaijo</h1>
            <p className="text-[#6b8fad]">Tournament Manager</p>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={() => setPortal('admin')}
              className="w-full bg-[#142130] border border-white/5 rounded-2xl p-5 text-left hover:border-orange-500/50 hover:bg-[#252530] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center group-hover:from-orange-500/30 group-hover:to-orange-600/20 transition-colors">
                  <Settings className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Admin Portal</h2>
                  <p className="text-sm text-[#6b8fad]">Manage members, groups & tournament</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => setPortal('courtkeeper')}
              className="w-full bg-[#142130] border border-white/5 rounded-2xl p-5 text-left hover:border-[#2a4a6f]/50 hover:bg-[#252530] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2a4a6f]/20 to-[#1e3a5f]/10 flex items-center justify-center group-hover:from-[#2a4a6f]/30 group-hover:to-[#1e3a5f]/20 transition-colors">
                  <Swords className="w-6 h-6 text-[#2a4a6f]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Courtkeeper Portal</h2>
                  <p className="text-sm text-[#6b8fad]">Run matches & keep score</p>
                </div>
              </div>
            </button>
          </div>

          <p className="text-center text-xs text-[#4a6a8a]">Renbu Kendo Club</p>
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
        onSwitchPortal={() => setPortal('select')}
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
      onSwitchPortal={() => setPortal('select')}
      getMemberById={getMemberById}
      getGroupById={getGroupById}
    />
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
  onSwitchPortal: () => void
  getMemberById: (id: string) => Member | undefined
  getGroupById: (id: string) => Group | undefined
}) {
  const [activeTab, setActiveTab] = useState('members')
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
    
    const allMatches: Match[] = []
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
        })
      })
    })
    
    if (allMatches.length === 0) {
      toast.error('No matches could be generated')
      return
    }
    
    setState(prev => ({
      ...prev,
      currentTournament: {
        ...prev.currentTournament!,
        matches: allMatches,
        groups: [...participantsByGroup.keys()],
        groupOrder,
      },
      currentMatchIndexA: 0,
      currentMatchIndexB: 0,
    }))
    
    toast.success(`Refreshed with ${allMatches.length} matches`)
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
              <img src="/renbu-logo.png" alt="Renbu" className="w-6 h-6" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-bold">Shiaijo</h1>
                <p className="text-xs text-[#6b8fad]">Admin Portal</p>
              </div>
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
          {[
            { id: 'members', icon: Users, label: 'Members' },
            { id: 'guests', icon: UserPlus, label: 'Guests' },
            { id: 'groups', icon: Filter, label: 'Groups' },
            { id: 'tournament', icon: Trophy, label: 'Tournament', badge: state.currentTournament?.status === 'in_progress' ? 'Live' : null },
            { id: 'standings', icon: Table, label: 'Standings' },
            { id: 'history', icon: History, label: 'History' },
          ].map(item => (
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
                    <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">{item.badge}</span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={onSwitchPortal}
            className={`w-full py-3 px-4 text-sm bg-gradient-to-r from-[#1e3a5f] to-[#162d4a] hover:from-[#2a4a6f] hover:to-[#1e3a5f] rounded-xl flex items-center justify-center gap-2 font-medium transition ${sidebarCollapsed ? 'px-0' : ''}`}
          >
            <ArrowLeftRight className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>Courtkeeper</span>}
          </button>
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <img src="/renbu-logo.png" alt="Renbu" className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-bold text-white">Shiaijo</h1>
                  <p className="text-xs text-[#6b8fad]">Admin Portal</p>
                </div>
              </div>
            </div>
            <nav className="py-4">
              {[
                { id: 'members', icon: Users, label: 'Members' },
                { id: 'guests', icon: UserPlus, label: 'Guests' },
                { id: 'groups', icon: Filter, label: 'Groups' },
                { id: 'tournament', icon: Trophy, label: 'Tournament' },
                { id: 'standings', icon: Table, label: 'Standings' },
                { id: 'history', icon: History, label: 'History' },
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
            <div className="p-4 border-t border-white/5">
              <button 
                onClick={() => { setMobileNavOpen(false); onSwitchPortal(); }}
                className="w-full py-3 px-4 text-sm bg-gradient-to-r from-[#1e3a5f] to-[#162d4a] rounded-xl flex items-center justify-center gap-2 font-medium text-white"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Courtkeeper</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <img src="/renbu-logo.png" alt="Renbu" className="w-5 h-5" />
          </div>
          <span className="font-semibold">Shiaijo</span>
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
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e3a5f]/30 rounded-lg">
                <span className="text-xs text-[#6b8fad]">First names</span>
                <Switch 
                  checked={state.useFirstNamesOnly}
                  onCheckedChange={(checked) => setState(prev => ({ ...prev, useFirstNamesOnly: checked }))}
                  className="data-[state=checked]:bg-orange-500"
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

              {/* Dev tools */}
              <details className="text-sm">
                <summary className="text-[#6b8fad] cursor-pointer">Dev tools</summary>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => {
                    const testMembers: Member[] = []
                    const names = ['Tanaka', 'Suzuki', 'Yamada', 'Sato', 'Watanabe', 'Ito', 'Takahashi', 'Nakamura']
                    for (let i = 0; i < 20; i++) {
                      testMembers.push({ id: generateId(), firstName: names[i % names.length], lastName: 'Test' + i, group: state.groups[i % state.groups.length]?.id || 'group-a', isGuest: false, isParticipating: true })
                    }
                    setState(prev => ({ ...prev, members: [...prev.members, ...testMembers] }))
                    toast.success('Added test data')
                  }} className="px-3 py-1.5 text-xs rounded bg-emerald-900/30 text-emerald-400 border border-emerald-800/50">+ Test Data</button>
                  <button onClick={() => setShowClearConfirm(true)} className="px-3 py-1.5 text-xs rounded bg-red-900/30 text-red-400 border border-red-800/50">Clear All</button>
                </div>
              </details>
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
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [newGroupName, setNewGroupName] = useState('')

  const updateGroup = (groupId: string, updates: Partial<Group>) => {
    setState(prev => ({
      ...prev,
      groups: prev.groups.map(g => g.id === groupId ? { ...g, ...updates } : g)
    }))
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
    <div className="space-y-4">
      <Card className="bg-[#142130] border-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Group Settings</CardTitle>
          <CardDescription className="text-[#8fb3d1] text-sm">
            Reorder groups to set court assignments. Position 1,3,5 → Court A | Position 2,4,6 → Court B
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="New group name..."
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              className="bg-[#1a2d42] border-[#2a4a6f] focus:border-orange-500"
            />
            <Button onClick={addGroup} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Group
            </Button>
          </div>

          <Separator className="bg-[#243a52]/50" />

          <div className="space-y-2">
            {state.groups.map((group, groupIndex) => {
              const memberCount = state.members.filter(m => m.group === group.id).length
              return (
                <div 
                  key={group.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('groupId', group.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const draggedId = e.dataTransfer.getData('groupId')
                    if (draggedId === group.id) return
                    setState(prev => {
                      const groups = [...prev.groups]
                      const fromIdx = groups.findIndex(g => g.id === draggedId)
                      const toIdx = groups.findIndex(g => g.id === group.id)
                      if (fromIdx === -1 || toIdx === -1) return prev
                      const [moved] = groups.splice(fromIdx, 1)
                      groups.splice(toIdx, 0, moved)
                      return { ...prev, groups }
                    })
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-move hover:bg-[#1e3a5f]/30 transition-colors border-l-4 ${groupIndex % 2 === 0 ? 'border-l-amber-500' : 'border-l-[#4a7ab0]'}`}
                >
                  {/* Court indicator - small pill */}
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${groupIndex % 2 === 0 ? 'bg-amber-600/20 text-amber-400' : 'bg-[#2e4a65]/20 text-[#8fb3d1]'}`}>
                    {groupIndex % 2 === 0 ? 'A' : 'B'}
                  </span>
                  
                  {/* Position */}
                  <span className="text-xs text-[#6b8fad] w-4">#{groupIndex + 1}</span>
                  
                  {editingGroup?.id === group.id ? (
                    <Input
                      value={editingGroup.name}
                      onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
                      className="bg-[#1e3a5f] border-[#2a4a6f] flex-1"
                      autoFocus
                    />
                  ) : (
                    <div className="flex-1">
                      <span className="text-white font-medium">{group.name}</span>
                      <span className="text-[#8fb3d1] ml-2 text-sm">({memberCount} members)</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Label className="text-[#b8d4ec] text-sm">Non-Bogu</Label>
                    <Switch
                      checked={group.isNonBogu}
                      onCheckedChange={(checked) => updateGroup(group.id, { isNonBogu: checked })}
                    />
                  </div>

                  {group.isNonBogu && (
                    <Badge className="bg-orange-900 text-orange-200">Hantei</Badge>
                  )}

                  {editingGroup?.id === group.id ? (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          updateGroup(group.id, { name: editingGroup.name })
                          setEditingGroup(null)
                        }}
                        className="h-8 w-8 text-green-400 hover:text-green-300"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingGroup(null)}
                        className="h-8 w-8 text-[#b8d4ec]"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingGroup(group)}
                        className="h-8 w-8 text-[#b8d4ec] hover:text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteGroup(group.id)}
                        className="h-8 w-8 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#142130] border-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white text-lg">Tournament Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-[#b8d4ec]">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#142130] rounded-lg">
              <h4 className="font-semibold text-white mb-2">Regular Groups (Bogu)</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>First to 2 ippons wins</li>
                <li>3 minute match time</li>
                <li>No encho (overtime)</li>
                <li>If time expires with 1-0, 1-ippon holder wins</li>
                <li>If time expires with 0-0 or 1-1, match is a draw</li>
              </ul>
            </div>
            <div className="p-4 bg-orange-900/20 border border-orange-800 rounded-lg">
              <h4 className="font-semibold text-orange-400 mb-2">Non-Bogu Groups (Hantei)</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Judge decision (hantei) determines winner</li>
                <li>3 minute match time</li>
                <li>No ippon scoring</li>
                <li>3 shinpan (judges) - always a winner</li>
                <li className="text-orange-300 font-medium">No draws possible</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Tournament Manager Component
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
    setState(prev => ({
      ...prev,
      currentTournament: {
        ...tournament,
        matches: (tournament.matches || []).map(m => 
          m.groupId === groupId ? { ...m, court } : m
        )
      }
    }))
    toast.success(`All ${getGroupById(groupId)?.name || 'group'} matches moved to Court ${court}`)
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                {tournament.month} {tournament.year}
              </CardDescription>
            </div>
            <Badge className={`text-sm px-3 py-1 ${
              tournament.status === 'setup' ? 'bg-yellow-600' :
              tournament.status === 'in_progress' ? 'bg-emerald-600' :
              'bg-[#2e4a65]'
            }`}>
              {tournament.status === 'setup' ? 'Setup' : tournament.status === 'in_progress' ? 'In Progress' : 'Completed'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Progress value={(completedMatches / totalMatches) * 100} className="flex-1" />
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
              <Button onClick={refreshTournamentParticipants} variant="outline" size="sm" className="border-[#2a4a6f] bg-[#142130] hover:bg-[#1e3a5f]">
                <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Update Participants</span>
                <span className="sm:hidden">Refresh</span>
              </Button>
            )}
            {isComplete && (
              <Button onClick={archiveTournament} className="bg-orange-600 hover:bg-orange-700">
                <History className="w-4 h-4 mr-2" />
                Archive & Complete
              </Button>
            )}
            <Button variant="outline" onClick={clearTournament} className="border-amber-700/60 text-red-400 bg-red-900/20 hover:bg-red-800/40 hover:border-amber-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Tournament
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Match Schedule by Group with Court Assignment */}
      {(tournament.groupOrder || []).map(groupId => {
        const group = getGroupById(groupId)
        const groupMatches = (tournament.matches || []).filter(m => m.groupId === groupId)
        
        return (
          <Card key={groupId} className={`border ${groupMatches[0]?.court === 'A' ? 'border-red-800/30' : 'border-[#1e3a5f]/30'}`}>
            <CardHeader className="p-3">
              <div className="flex items-center justify-between">
                {/* Left: Group info */}
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${groupMatches[0]?.court === 'A' ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30' : 'bg-[#1e3a5f]/30 text-[#7ab0e0] border border-[#1e3a5f]/50'}`}>
                    {groupMatches[0]?.court || 'A'}
                  </span>
                  <span className="text-white font-medium">{group?.name || groupId}</span>
                  {group?.isNonBogu && <span className="text-[10px] px-1.5 py-0.5 bg-orange-900/40 text-orange-300 rounded">判定</span>}
                  <span className="text-xs text-[#6b8fad]">{groupMatches.filter(m => m.status === 'completed').length}/{groupMatches.length}</span>
                </div>
                
                {/* Right: Court toggle */}
                <div className="flex rounded-lg overflow-hidden border border-[#1e3a5f]">
                  <button
                    className={`px-3 py-1 text-xs font-medium transition-colors ${groupMatches[0]?.court === 'A' ? 'bg-amber-600 text-white' : 'bg-[#1a2d42] text-[#8fb3d1] hover:bg-[#243a52]'}`}
                    onClick={() => setGroupCourt(groupId, 'A')}
                  >
                    A
                  </button>
                  <button
                    className={`px-3 py-1 text-xs font-medium transition-colors ${groupMatches[0]?.court === 'B' ? 'bg-[#1e3a5f] text-white' : 'bg-[#1a2d42] text-[#8fb3d1] hover:bg-[#243a52]/50'}`}
                    onClick={() => setGroupCourt(groupId, 'B')}
                  >
                    B
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72 pr-2">
                <div className="space-y-2">
                  {groupMatches.map((match, idx) => {
                    const p1 = getMemberById(match.player1Id)
                    const p2 = getMemberById(match.player2Id)
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
                          {/* Match number and court badge */}
                          <span className="text-[#6b8fad] text-xs w-5">#{idx + 1}</span>
                          <button
                            className={`w-6 h-6 rounded text-xs font-bold ${match.court === 'A' ? 'bg-amber-600 text-white' : 'bg-[#1e3a5f] text-white'}`}
                            onClick={() => swapMatchCourt(match.id)}
                          >
                            {match.court}
                          </button>
                          
                          {/* Players - stacked on mobile, inline on desktop */}
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
                        </div>
                        {/* Status indicators */}
                        {match.status === 'completed' && (
                          <span className={`text-xs px-2 py-0.5 rounded ${match.winner === 'player1' ? 'bg-red-900/50 text-red-400' : match.winner === 'player2' ? 'bg-[#243a52]/50 text-[#b8d4ec]' : 'bg-[#243a52] text-[#8fb3d1]'}`}>
                            {match.winner === 'draw' ? 'Draw' : 
                             match.winner === 'player1' ? `Win ${match.isHantei ? '(判定)' : match.player1Score.length + '-' + match.player2Score.length}` :
                             `Win ${match.isHantei ? '(判定)' : match.player1Score.length + '-' + match.player2Score.length}`}
                          </span>
                        )}
                        {match.status === 'in_progress' && (
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-600 text-white animate-pulse">Live</span>
                        )}
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
  isMobile,
  onSwitchPortal,
  getMemberById,
  getGroupById
}: { 
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
  isMobile: boolean
  onSwitchPortal: () => void
  getMemberById: (id: string) => Member | undefined
  getGroupById: (id: string) => Group | undefined
}) {
  const [selectedCourt, setSelectedCourt] = useState<'A' | 'B'>('A')
  const [lastMatchId, setLastMatchId] = useState<string | null>(null)
  
  const tournament = state.currentTournament
  
  const courtAMatches = tournament?.matches?.filter(m => m.court === 'A') || []
  const courtBMatches = tournament?.matches?.filter(m => m.court === 'B') || []
  
  const currentMatchA = courtAMatches.find(m => m.status !== 'completed')
  const currentMatchB = courtBMatches.find(m => m.status !== 'completed')
  
  const currentMatch = selectedCourt === 'A' ? currentMatchA : currentMatchB
  const currentMatches = selectedCourt === 'A' ? courtAMatches : courtBMatches
  
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
    if (selectedCourt === 'A') {
      setState(prev => ({ ...prev, timerRunningA: !prev.timerRunningA }))
    } else {
      setState(prev => ({ ...prev, timerRunningB: !prev.timerRunningB }))
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
    return directPoints + hansokuPoints
  }

  const p1EffectiveScore = getEffectiveScore(p1Score, p2Hansoku)
  const p2EffectiveScore = getEffectiveScore(p2Score, p1Hansoku)

  // Calculate max hansoku allowed (if opponent has points, max is 2 less per point)
  const getMaxHansoku = (ownScore: number[], opponentScore: number[], opponentHansoku: number) => {
    // Base: 4 hansoku max if no one scored
    // Each opponent direct point reduces max by 2
    // Each pair of own hansoku (that gave opponent a point) also counts
    const opponentDirectPoints = opponentScore.length
    const hansokuPointsGiven = Math.floor(opponentHansoku / 2)
    const totalOpponentPoints = opponentDirectPoints + hansokuPointsGiven
    
    if (totalOpponentPoints >= 2) return 0 // Opponent already won
    if (totalOpponentPoints === 1) return 1 // Can only get 1 more (2 would give opponent win)
    return 4 // No restrictions yet
  }

  const p1MaxHansoku = getMaxHansoku(p1Score, p2Score, p1Hansoku)
  const p2MaxHansoku = getMaxHansoku(p2Score, p1Score, p2Hansoku)

  const addScore = (player: 'player1' | 'player2', scoreType: number) => {
    if (!tournament || !currentMatch) return

    const updatedMatches = tournament.matches.map(m => {
      if (m.id === currentMatch.id) {
        return {
          ...m,
          status: 'in_progress' as const,
          player1Score: player === 'player1' ? [...m.player1Score, scoreType] : m.player1Score,
          player2Score: player === 'player2' ? [...m.player2Score, scoreType] : m.player2Score,
        }
      }
      return m
    })

    setState(prev => ({
      ...prev,
      currentTournament: { ...tournament, matches: updatedMatches }
    }))
  }

  const addHansoku = (player: 'player1' | 'player2') => {
    if (!tournament || !currentMatch) return
    
    const currentHansoku = player === 'player1' ? p1Hansoku : p2Hansoku
    const maxHansoku = player === 'player1' ? p1MaxHansoku : p2MaxHansoku
    
    if (currentHansoku >= maxHansoku) {
      toast.error(`Maximum hansoku reached for this player`)
      return
    }

    const newHansoku = currentHansoku + 1
    const opponent = player === 'player1' ? 'player2' : 'player1'
    
    // Check if this hansoku gives opponent a point (every 2nd hansoku)
    const givesPoint = newHansoku % 2 === 0

    const updatedMatches = tournament.matches.map(m => {
      if (m.id === currentMatch.id) {
        const update: Partial<Match> = {
          status: 'in_progress' as const,
          player1Hansoku: player === 'player1' ? newHansoku : m.player1Hansoku,
          player2Hansoku: player === 'player2' ? newHansoku : m.player2Hansoku,
        }
        
        // Add hansoku-derived point to opponent's score
        if (givesPoint) {
          if (opponent === 'player1') {
            update.player1Score = [...m.player1Score, 5] // 5 = Hansoku point
          } else {
            update.player2Score = [...m.player2Score, 5]
          }
        }
        
        return { ...m, ...update }
      }
      return m
    })

    setState(prev => ({
      ...prev,
      currentTournament: { ...tournament, matches: updatedMatches }
    }))

    if (givesPoint) {
      toast.success(`Hansoku! Point awarded to ${opponent === 'player1' ? 'AKA' : 'SHIRO'}`)
    }
  }

  const removeLastScore = (player: 'player1' | 'player2') => {
    if (!tournament || !currentMatch) return
    const scores = player === 'player1' ? p1Score : p2Score
    if (scores.length === 0) return

    const lastScore = scores[scores.length - 1]
    
    const updatedMatches = tournament.matches.map(m => {
      if (m.id === currentMatch.id) {
        const update: Partial<Match> = {}
        
        if (player === 'player1') {
          update.player1Score = m.player1Score.slice(0, -1)
          // If it was a hansoku point, also reduce opponent's hansoku count
          if (lastScore === 5) {
            update.player2Hansoku = Math.max(0, (m.player2Hansoku || 0) - 2)
          }
        } else {
          update.player2Score = m.player2Score.slice(0, -1)
          if (lastScore === 5) {
            update.player1Hansoku = Math.max(0, (m.player1Hansoku || 0) - 2)
          }
        }
        
        return { ...m, ...update }
      }
      return m
    })

    setState(prev => ({
      ...prev,
      currentTournament: { ...tournament, matches: updatedMatches }
    }))
  }

  const completeMatch = (winner: 'player1' | 'player2' | 'draw') => {
    if (!tournament || !currentMatch) return

    const updatedMatches = tournament.matches.map(m => {
      if (m.id === currentMatch.id) {
        return {
          ...m,
          status: 'completed' as const,
          winner: winner === 'draw' ? 'draw' : winner,
          actualDuration: timerSeconds,
        }
      }
      return m
    })

    setState(prev => ({
      ...prev,
      currentTournament: { ...tournament, matches: updatedMatches }
    }))
    
    toast.success(winner === 'draw' ? 'Match ended in draw' : `${winner === 'player1' ? 'AKA' : 'SHIRO'} wins!`)
  }

  // Render score display with circled letters
  const renderScoreDisplay = (scores: number[], opponentHansoku: number) => {
    const hansokuPoints = Math.floor(opponentHansoku / 2)
    const allPoints = [
      ...scores.map(s => scoreTypes.find(t => t.id === s)),
      ...Array(hansokuPoints).fill(scoreTypes.find(t => t.id === 5))
    ].filter(Boolean)
    
    return (
      <div className="flex items-center gap-1">
        {allPoints.map((type, i) => (
          <span key={i} className="text-2xl">{type?.circle}</span>
        ))}
        {allPoints.length === 0 && <span className="text-[#6b8fad] text-sm">No points</span>}
      </div>
    )
  }

  // Render hansoku indicator
  const renderHansokuIndicator = (count: number, max: number) => {
    return (
      <div className="flex items-center gap-1">
        {Array(count).fill(0).map((_, i) => (
          <span key={i} className="text-amber-500">△</span>
        ))}
        {count < max && <span className="text-[#4a6a8a]">△</span>}
      </div>
    )
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
            <img src="/renbu-logo.png" alt="Renbu" className="w-20 h-20 mx-auto opacity-50" />
            <p className="text-[#b8d4ec]">
              {tournament ? 'Tournament needs to be started from Admin Portal' : 'No tournament generated yet'}
            </p>
            <Button onClick={onSwitchPortal} variant="outline" className="border-orange-500 text-orange-400">
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
              <Button onClick={onSwitchPortal} variant="outline" className="border-orange-500 text-orange-400">
                Admin Portal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a1017] text-white">
      <Toaster theme="dark" position="top-center" />
      
      {/* Header */}
      <header className="bg-[#0f1a24] border-b border-[#1e3a5f] p-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <img src="/renbu-logo.png" alt="Renbu" className="w-8 h-8" />
            <span className="font-bold">Courtkeeper</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={selectedCourt === 'A' ? 'default' : 'outline'}
              onClick={() => setSelectedCourt('A')}
              className={selectedCourt === 'A' ? 'bg-amber-600' : 'border-[#2a4a6f]'}
            >
              Court A
            </Button>
            <Button
              size="sm"
              variant={selectedCourt === 'B' ? 'default' : 'outline'}
              onClick={() => setSelectedCourt('B')}
              className={selectedCourt === 'B' ? 'bg-[#1e3a5f]' : 'border-[#2a4a6f]'}
            >
              Court B
            </Button>
            <Button variant="ghost" size="sm" onClick={onSwitchPortal}>
              <ArrowLeftRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Match Info Bar */}
        <div className="bg-[#142130] rounded-xl p-4 border border-[#1e3a5f]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-lg font-bold ${selectedCourt === 'A' ? 'bg-amber-600' : 'bg-[#1e3a5f]'}`}>
                Court {selectedCourt}
              </span>
              <span className="px-3 py-1 rounded-lg bg-[#1e3a5f]/50 text-[#b8d4ec]">
                {group?.name || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={timerDuration} 
                onChange={(e) => updateMatchSettings('timerDuration', parseInt(e.target.value))}
                className="bg-[#1e3a5f]/50 border border-[#2a4a6f] rounded px-2 py-1 text-sm"
              >
                <option value={180}>3 min</option>
                <option value={240}>4 min</option>
                <option value={300}>5 min</option>
                <option value={120}>2 min</option>
              </select>
              <select 
                value={matchType} 
                onChange={(e) => updateMatchSettings('matchType', e.target.value)}
                className="bg-[#1e3a5f]/50 border border-[#2a4a6f] rounded px-2 py-1 text-sm"
              >
                <option value="sanbon">Sanbon</option>
                <option value="ippon">Ippon</option>
              </select>
            </div>
          </div>
        </div>

        {/* Player 1 (AKA/Red) */}
        <div className="bg-red-900/30 rounded-xl overflow-hidden border-2 border-red-800">
          <div className="bg-red-900/50 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="font-bold text-lg text-red-200">AKA</span>
              </div>
              <span className="text-xl font-bold text-white">
                {player1 ? formatDisplayName(player1, state.members, state.useFirstNamesOnly) : '?'}
              </span>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {/* Score Display */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {renderScoreDisplay(p1Score, p2Hansoku)}
              </div>
              <div className="border-l border-red-800/50 pl-4">
                {renderHansokuIndicator(p1Hansoku, p1MaxHansoku)}
              </div>
            </div>
            
            {/* Score Buttons */}
            {!currentMatch?.isHantei && (
              <>
                <div className="grid grid-cols-4 gap-2">
                  {scoreTypes.slice(0, 4).map(type => (
                    <Button
                      key={type.id}
                      onClick={() => addScore('player1', type.id)}
                      disabled={p1EffectiveScore >= winTarget}
                      className="h-14 text-lg font-bold bg-[#1e3a5f] hover:bg-[#2a4a6f]"
                    >
                      {type.letter}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => addHansoku('player1')}
                    disabled={p1Hansoku >= p1MaxHansoku}
                    className="flex-1 h-12 bg-amber-700 hover:bg-amber-600"
                  >
                    Hansoku △
                  </Button>
                  <Button
                    onClick={() => removeLastScore('player1')}
                    disabled={p1Score.length === 0}
                    variant="outline"
                    className="h-12 border-[#2a4a6f]"
                  >
                    Undo
                  </Button>
                </div>
              </>
            )}
            
            {/* Hantei Button */}
            {currentMatch?.isHantei && (
              <Button
                onClick={() => completeMatch('player1')}
                className="w-full h-16 text-xl bg-red-700 hover:bg-red-600"
              >
                <Award className="w-6 h-6 mr-2" />
                AKA Wins (判定)
              </Button>
            )}
          </div>
        </div>

        {/* Player 2 (SHIRO/White) */}
        <div className="bg-[#1e3a5f]/30 rounded-xl overflow-hidden border-2 border-[#4a7ab0]">
          <div className="bg-[#1e3a5f]/50 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-white"></span>
                <span className="font-bold text-lg text-blue-200">SHIRO</span>
              </div>
              <span className="text-xl font-bold text-white">
                {player2 ? formatDisplayName(player2, state.members, state.useFirstNamesOnly) : '?'}
              </span>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {/* Score Display */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {renderScoreDisplay(p2Score, p1Hansoku)}
              </div>
              <div className="border-l border-[#4a7ab0]/50 pl-4">
                {renderHansokuIndicator(p2Hansoku, p2MaxHansoku)}
              </div>
            </div>
            
            {/* Score Buttons */}
            {!currentMatch?.isHantei && (
              <>
                <div className="grid grid-cols-4 gap-2">
                  {scoreTypes.slice(0, 4).map(type => (
                    <Button
                      key={type.id}
                      onClick={() => addScore('player2', type.id)}
                      disabled={p2EffectiveScore >= winTarget}
                      className="h-14 text-lg font-bold bg-[#1e3a5f] hover:bg-[#2a4a6f]"
                    >
                      {type.letter}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => addHansoku('player2')}
                    disabled={p2Hansoku >= p2MaxHansoku}
                    className="flex-1 h-12 bg-amber-700 hover:bg-amber-600"
                  >
                    Hansoku △
                  </Button>
                  <Button
                    onClick={() => removeLastScore('player2')}
                    disabled={p2Score.length === 0}
                    variant="outline"
                    className="h-12 border-[#2a4a6f]"
                  >
                    Undo
                  </Button>
                </div>
              </>
            )}
            
            {/* Hantei Button */}
            {currentMatch?.isHantei && (
              <Button
                onClick={() => completeMatch('player2')}
                className="w-full h-16 text-xl bg-[#1e3a5f] hover:bg-[#2a4a6f]"
              >
                <Award className="w-6 h-6 mr-2" />
                SHIRO Wins (判定)
              </Button>
            )}
          </div>
        </div>

        {/* Timer */}
        <Card className={`bg-[#142130] border-2 ${timerSeconds >= timerDuration ? 'border-red-600 animate-pulse' : 'border-[#1e3a5f]'}`}>
          <CardContent className="p-4">
            <div className="text-center">
              <div className={`text-6xl font-mono font-bold ${timerSeconds >= timerDuration ? 'text-red-500' : 'text-white'}`}>
                {formatTime(timerSeconds)}
              </div>
              <Progress value={(timerSeconds / timerDuration) * 100} className="mt-3" />
              <p className="text-[#6b8fad] text-sm mt-2">
                {timerSeconds >= timerDuration ? 'Time expired!' : `Target: ${formatTime(timerDuration)}`}
              </p>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <Button
                size="lg"
                onClick={toggleTimer}
                className={timerRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}
              >
                {timerRunning ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                {timerRunning ? 'Pause' : 'Start'}
              </Button>
              <Button size="lg" variant="outline" onClick={resetTimer} className="border-[#2a4a6f]">
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Match Complete Buttons */}
        {!currentMatch?.isHantei && (
          <div className="grid grid-cols-3 gap-2">
            <Button
              size="lg"
              onClick={() => completeMatch('player1')}
              className="bg-red-700 hover:bg-red-600 h-14"
              disabled={p1EffectiveScore < winTarget && p2EffectiveScore < winTarget}
            >
              AKA Wins
            </Button>
            <Button
              size="lg"
              onClick={() => completeMatch('draw')}
              variant="outline"
              className="border-[#2a4a6f] h-14"
            >
              Draw
            </Button>
            <Button
              size="lg"
              onClick={() => completeMatch('player2')}
              className="bg-[#1e3a5f] hover:bg-[#2a4a6f] h-14"
              disabled={p1EffectiveScore < winTarget && p2EffectiveScore < winTarget}
            >
              SHIRO Wins
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}


// Type declaration for window.storage
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

