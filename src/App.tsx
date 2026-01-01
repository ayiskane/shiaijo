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
  Menu, Swords, UserPlus, FileSpreadsheet,
  Circle, CheckCircle2, Table, History, RefreshCw,
  ArrowLeftRight, Timer, Award, ChevronLeft, Layers
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
  player1Score: number[]
  player2Score: number[]
  winner: string | null
  status: 'pending' | 'in_progress' | 'completed'
  court: 'A' | 'B'
  isHantei: boolean
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
}

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9)

// Test data generation
const generateTestMembers = (): Member[] => {
  const firstNames = [
    'Kenji', 'Yuki', 'Takeshi', 'Haruto', 'Sota', 'Ren', 'Hiroshi', 'Daiki',
    'Sakura', 'Aiko', 'Mei', 'Hana', 'Yui', 'Mika', 'Emi', 'Nana',
    'James', 'Michael', 'David', 'Chris', 'Alex', 'Ryan', 'Kevin', 'Brian',
    'Sarah', 'Emily', 'Jessica', 'Amanda', 'Nicole', 'Ashley', 'Rachel', 'Laura'
  ]
  const lastNames = [
    'Tanaka', 'Yamamoto', 'Suzuki', 'Watanabe', 'Ito', 'Nakamura', 'Kobayashi', 'Kato',
    'Yoshida', 'Yamada', 'Sasaki', 'Yamaguchi', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi',
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson'
  ]
  const groups = ['A', 'B', 'C', 'D', 'NonBogu']
  
  const members: Member[] = []
  const usedNames = new Set<string>()
  
  // Generate 4-6 members per group
  groups.forEach(groupId => {
    const count = Math.floor(Math.random() * 3) + 4 // 4-6 members
    for (let i = 0; i < count; i++) {
      let firstName, lastName, fullName
      do {
        firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
        lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
        fullName = `${firstName} ${lastName}`
      } while (usedNames.has(fullName))
      
      usedNames.add(fullName)
      members.push({
        id: generateId(),
        firstName,
        lastName,
        group: groupId,
        isGuest: false,
        isParticipating: true, // Auto-select for tournament
      })
    }
  })
  
  return members
}

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
  members: Member[]
): PlayerStanding[] => {
  const groupMatches = matches.filter(m => m.groupId === groupId && m.status === 'completed')
  const groupMembers = members.filter(m => m.group === groupId && m.isParticipating)
  
  const standings: Map<string, PlayerStanding> = new Map()
  
  groupMembers.forEach(member => {
    standings.set(member.id, {
      playerId: member.id,
      playerName: `${member.firstName} ${member.lastName}`,
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
          let tournament = saved.currentTournament
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
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a24] via-[#13131a] to-[#1a1a24] flex flex-col items-center justify-center">
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
      <div className="min-h-screen bg-[#13131a] flex items-center justify-center p-4">
        <Toaster theme="dark" position="top-center" />
        <div className="max-w-md w-full space-y-8">
          {/* Logo & Title */}
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Layers className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Shiaijo</h1>
            <p className="text-zinc-500">Tournament Manager</p>
          </div>
          
          {/* Portal Cards */}
          <div className="space-y-4">
            <button 
              onClick={() => setPortal('admin')}
              className="w-full bg-[#1e1e2a] border border-white/5 rounded-2xl p-5 text-left hover:border-orange-500/50 hover:bg-[#252532] transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center group-hover:from-orange-500/30 group-hover:to-orange-600/20 transition-colors">
                  <Settings className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Admin Portal</h2>
                  <p className="text-sm text-zinc-500">Manage members, groups & tournament</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => setPortal('courtkeeper')}
              className="w-full bg-[#1e1e2a] border border-white/5 rounded-2xl p-5 text-left hover:border-purple-500/50 hover:bg-[#252532] transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-purple-600/20 transition-colors">
                  <Swords className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Courtkeeper Portal</h2>
                  <p className="text-sm text-zinc-500">Run matches & keep score</p>
                </div>
              </div>
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-zinc-600">Renbu Kendo Club</p>
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterGroup, setFilterGroup] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'group'>('name')
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

  const generateTournament = (selectedMonth: string, selectedYear: number) => {
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
          winner: null,
          status: 'pending',
          court,
          isHantei,
          orderIndex: globalOrderIndex++,
        })
      })
    })
    
    // Allow empty tournament - can be refreshed later with participants
    const tournament: Tournament = {
      id: generateId(),
      name: `Renbu Monthly Shiai - ${selectedMonth} ${selectedYear}`,
      date: new Date().toISOString().split('T')[0],
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
          winner: null,
          status: 'pending',
          court,
          isHantei,
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
      const standings = calculateStandings(groupId, state.currentTournament!.matches, state.members)
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
    <div className="min-h-screen bg-[#13131a] text-white">
      <Toaster theme="dark" position="top-center" />
      
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#1a1a24] border-b border-white/5 flex items-center justify-between px-4 z-30 md:hidden">
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-zinc-400 hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold">Shiaijo</span>
        </div>
        <button className="p-2 text-zinc-400 hover:text-white">
          <Search className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-[#1a1a24] z-50 md:hidden flex flex-col transform transition-transform duration-300 ${mobileMenuOpen ? 'tranzinc-x-0' : '-tranzinc-x-full'}`}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold">Shiaijo</h1>
              <p className="text-xs text-zinc-500">Tournament Manager</p>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-white/5">
          <div className="bg-[#1e1e2a] border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Session</span>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{state.members.filter(m => m.isParticipating).length}</span>
              <span className="text-zinc-500 text-sm">participating</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <p className="px-4 mb-2 text-xs text-zinc-500 uppercase tracking-wider">Menu</p>
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
              onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                activeTab === item.id 
                  ? 'text-orange-400 bg-gradient-to-r from-orange-500/15 to-transparent border-l-[3px] border-orange-500' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${activeTab === item.id ? 'bg-orange-500/20' : 'bg-zinc-800'}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => { setMobileMenuOpen(false); onSwitchPortal(); }}
            className="w-full py-3 px-4 text-sm bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center gap-2 font-medium shadow-lg shadow-purple-500/20"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Courtkeeper Mode
          </button>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col fixed h-full bg-[#1a1a24] border-r border-white/5 transition-all duration-300 z-20 ${sidebarCollapsed ? 'w-[72px]' : 'w-64'}`}>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-bold">Shiaijo</h1>
                <p className="text-xs text-zinc-500">Tournament Manager</p>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center hover:bg-zinc-700 transition z-10"
        >
          <ChevronLeft className={`w-3 h-3 text-zinc-400 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {!sidebarCollapsed && (
          <div className="p-4 border-b border-white/5">
            <div className="bg-[#1e1e2a] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Session</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{state.members.filter(m => m.isParticipating).length}</span>
                <span className="text-zinc-500 text-sm">participating</span>
              </div>
              <div className="flex gap-4 mt-2">
                <div>
                  <span className="text-green-400 text-sm font-semibold">{state.currentTournament?.matches?.filter(m => m.status === 'completed').length || 0}</span>
                  <span className="text-zinc-500 text-xs ml-1">done</span>
                </div>
                <div>
                  <span className="text-amber-400 text-sm font-semibold">{state.currentTournament?.matches?.filter(m => m.status !== 'completed').length || 0}</span>
                  <span className="text-zinc-500 text-xs ml-1">left</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 py-4 overflow-y-auto">
          {!sidebarCollapsed && <p className="px-4 mb-2 text-xs text-zinc-500 uppercase tracking-wider">Menu</p>}
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
                  ? 'text-orange-400 bg-gradient-to-r from-orange-500/15 to-transparent border-l-[3px] border-orange-500' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${activeTab === item.id ? 'bg-orange-500/20' : 'bg-zinc-800'}`}>
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
            className={`w-full py-3 px-4 text-sm bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl flex items-center justify-center gap-2 font-medium transition shadow-lg shadow-purple-500/20 ${sidebarCollapsed ? 'px-0' : ''}`}
          >
            <ArrowLeftRight className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>Courtkeeper</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-14 md:pt-0 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-64'}`}>
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-zinc-500 text-sm mb-1 hidden md:block">Welcome back</p>
              <h2 className="text-xl md:text-2xl font-bold capitalize">{activeTab}</h2>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 bg-zinc-800/50 border border-zinc-700/50 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/50"
                />
              </div>
              <button 
                onClick={async () => {
                  const saved = await loadFromStorage()
                  if (saved) {
                    let tournament = saved.currentTournament
                    if (tournament) {
                      tournament = { ...tournament, matches: tournament.matches || [], groups: tournament.groups || [], groupOrder: tournament.groupOrder || [] }
                    }
                    setState(prev => ({ ...prev, members: saved.members || prev.members, groups: saved.groups || prev.groups, guestRegistry: saved.guestRegistry || prev.guestRegistry, currentTournament: tournament, history: saved.history || prev.history }))
                    toast.success('Synced')
                  }
                }}
                className="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'members' && (
            <MembersTab
              state={state}
              setState={setState}
              filteredMembers={filteredMembers}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterGroup={filterGroup}
              setFilterGroup={setFilterGroup}
              sortBy={sortBy}
              setSortBy={setSortBy}
              showAddMember={showAddMember}
              setShowAddMember={setShowAddMember}
              showBulkAdd={showBulkAdd}
              setShowBulkAdd={setShowBulkAdd}
              showClearConfirm={showClearConfirm}
              setShowClearConfirm={setShowClearConfirm}
              addMember={addMember}
              deleteMember={deleteMember}
              clearAllMembers={clearAllMembers}
              toggleParticipation={toggleParticipation}
              selectByGroup={selectByGroup}
              deselectAll={deselectAll}
              handleCSVImport={handleCSVImport}
              getGroupById={getGroupById}
            />
          )}
          {activeTab === 'guests' && (
            <GuestsTab
              state={state}
              setState={setState}
              addGuestMember={addGuestMember}
              getGroupById={getGroupById}
            />
          )}
          {activeTab === 'groups' && (
            <GroupsManager state={state} setState={setState} />
          )}
          {activeTab === 'tournament' && (
            <TournamentManager state={state} setState={setState} getMemberById={getMemberById} getGroupById={getGroupById} />
          )}
          {activeTab === 'standings' && (
            <StandingsView state={state} getMemberById={getMemberById} getGroupById={getGroupById} />
          )}
          {activeTab === 'history' && (
            <HistoryView state={state} setState={setState} />
          )}
        </div>
      </main>
    </div>
  )
}

// Members Tab Component
function MembersTab({
  state,
  setState,
  filteredMembers,
  searchQuery,
  setSearchQuery,
  filterGroup,
  setFilterGroup,
  sortBy,
  setSortBy,
  showAddMember,
  setShowAddMember,
  showBulkAdd,
  setShowBulkAdd,
  showClearConfirm,
  setShowClearConfirm,
  addMember,
  deleteMember,
  clearAllMembers,
  toggleParticipation,
  selectByGroup,
  deselectAll,
  handleCSVImport,
  getGroupById,
}: {
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
  filteredMembers: Member[]
  searchQuery: string
  setSearchQuery: (q: string) => void
  filterGroup: string
  setFilterGroup: (g: string) => void
  sortBy: 'name' | 'group'
  setSortBy: (s: 'name' | 'group') => void
  showAddMember: boolean
  setShowAddMember: (s: boolean) => void
  showBulkAdd: boolean
  setShowBulkAdd: (s: boolean) => void
  showClearConfirm: boolean
  setShowClearConfirm: (s: boolean) => void
  addMember: (firstName: string, lastName: string, group: string) => void
  deleteMember: (id: string) => void
  clearAllMembers: () => void
  toggleParticipation: (id: string) => void
  selectByGroup: (groupId: string) => void
  deselectAll: () => void
  handleCSVImport: (csvText: string) => void
  getGroupById: (id: string) => Group | undefined
}) {
  const [newFirstName, setNewFirstName] = useState('')
  const [newLastName, setNewLastName] = useState('')
  const [newGroup, setNewGroup] = useState(state.groups[0]?.id || '')
  const [csvText, setCsvText] = useState('')

  const participatingCount = state.members.filter(m => m.isParticipating).length
  const totalMatches = state.currentTournament?.matches?.length || 0
  const completedMatches = state.currentTournament?.matches?.filter(m => m.status === 'completed').length || 0

    return (
    <div className="space-y-4 md:space-y-6">
      {/* Mobile Stats */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        <div className="bg-[#1e1e2a] border border-white/5 rounded-xl p-4">
          <p className="text-zinc-500 text-xs mb-1">Participants</p>
          <p className="text-2xl font-bold">{participatingCount}</p>
        </div>
        <div className="bg-[#1e1e2a] border border-white/5 rounded-xl p-4">
          <p className="text-zinc-500 text-xs mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-400">{completedMatches}</p>
        </div>
      </div>

      {/* Desktop Stats Cards */}
      <div className="hidden md:grid grid-cols-4 gap-4">
        <div className="bg-[#1e1e2a] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Total</p>
              <p className="text-3xl font-bold">{totalMatches}</p>
              <p className="text-zinc-500 text-sm mt-1">matches</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          {totalMatches > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full" style={{width: `${Math.round((completedMatches / totalMatches) * 100)}%`}}></div>
              </div>
              <span className="text-xs text-orange-400 font-medium">{Math.round((completedMatches / totalMatches) * 100)}%</span>
            </div>
          )}
        </div>

        <div className="bg-[#1e1e2a] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Completed</p>
              <p className="text-3xl font-bold text-green-400">{completedMatches}</p>
              <p className="text-zinc-500 text-sm mt-1">matches</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-[#1e1e2a] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Court A</p>
              <p className="text-3xl font-bold text-amber-400">{state.currentTournament?.matches?.filter(m => m.court === 'A').length || 0}</p>
              <p className="text-zinc-500 text-sm mt-1">queued</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
              <span className="text-amber-500 font-bold text-xl">A</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1e1e2a] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Court B</p>
              <p className="text-3xl font-bold text-zinc-300">{state.currentTournament?.matches?.filter(m => m.court === 'B').length || 0}</p>
              <p className="text-zinc-500 text-sm mt-1">queued</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-600/20 to-zinc-700/10 flex items-center justify-center">
              <span className="text-zinc-400 font-bold text-xl">B</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions & Filters */}
      <div className="bg-[#1e1e2a] border border-white/5 rounded-xl md:rounded-2xl p-3 md:p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          {/* Add Button */}
          <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
            <DialogTrigger asChild>
              <button className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20">
                <Plus className="w-4 h-4" />
                Add Member
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#1e1e2a] border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-white">Add Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">First Name</Label>
                  <Input value={newFirstName} onChange={e => setNewFirstName(e.target.value)} className="bg-zinc-800 border-zinc-700" placeholder="First name" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Last Name</Label>
                  <Input value={newLastName} onChange={e => setNewLastName(e.target.value)} className="bg-zinc-800 border-zinc-700" placeholder="Last name" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Group</Label>
                  <Select value={newGroup} onValueChange={setNewGroup}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {state.groups.map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddMember(false)} className="border-zinc-700">Cancel</Button>
                <Button onClick={() => { addMember(newFirstName, newLastName, newGroup); setNewFirstName(''); setNewLastName(''); setShowAddMember(false); }} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:bg-orange-700">Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showBulkAdd} onOpenChange={setShowBulkAdd}>
            <DialogTrigger asChild>
              <button className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm text-zinc-300 flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                Import
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#1e1e2a] border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-white">Import Members</DialogTitle>
                <DialogDescription className="text-zinc-400">Paste CSV: FirstName,LastName,Group</DialogDescription>
              </DialogHeader>
              <textarea 
                value={csvText} 
                onChange={e => setCsvText(e.target.value)} 
                className="w-full h-40 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm"
                placeholder="John,Doe,Group A&#10;Jane,Smith,Group B"
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowBulkAdd(false)} className="border-zinc-700">Cancel</Button>
                <Button onClick={() => { handleCSVImport(csvText); setCsvText(''); setShowBulkAdd(false); }} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:bg-orange-700">Import</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="hidden md:block h-6 w-px bg-zinc-700"></div>

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 md:flex-wrap">
            <button 
              onClick={() => setFilterGroup('all')}
              className={`px-3 md:px-4 py-2 text-xs md:text-sm rounded-lg md:rounded-xl font-medium whitespace-nowrap transition-colors ${filterGroup === 'all' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
            >
              All
            </button>
            {state.groups.map(g => (
              <button 
                key={g.id}
                onClick={() => setFilterGroup(g.id)}
                className={`px-3 md:px-4 py-2 text-xs md:text-sm rounded-lg md:rounded-xl whitespace-nowrap transition-colors ${filterGroup === g.id ? (g.isNonBogu ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30') : (g.isNonBogu ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700')}`}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Select Row */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
          <span className="text-xs text-zinc-500">Quick:</span>
          {state.groups.map(g => (
            <button 
              key={g.id}
              onClick={() => selectByGroup(g.id)}
              className="px-2 py-1 text-xs rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
            >
              +{g.name}
            </button>
          ))}
          <button onClick={deselectAll} className="px-2 py-1 text-xs rounded text-zinc-500 hover:text-zinc-300 transition-colors">Clear</button>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-[#1e1e2a] border border-white/5 rounded-xl md:rounded-2xl overflow-hidden">
        {/* Mobile Member Cards */}
        <div className="md:hidden divide-y divide-white/5">
          {filteredMembers.slice(0, 20).map((member) => {
            const group = getGroupById(member.group)
            return (
              <div key={member.id} className="p-4 flex items-center gap-3">
                <Checkbox 
                  checked={member.isParticipating} 
                  onCheckedChange={() => toggleParticipation(member.id)}
                  className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{member.lastName}, {member.firstName}</p>
                  <p className={`text-xs ${group?.isNonBogu ? 'text-amber-400' : 'text-zinc-500'}`}>{group?.name || member.group}</p>
                </div>
                <span className={`w-2 h-2 rounded-full ${member.isParticipating ? 'bg-green-500' : 'bg-zinc-600'}`}></span>
              </div>
            )
          })}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <div className="px-5 py-3 bg-zinc-800/30 border-b border-white/5 flex items-center gap-4">
            <Checkbox className="w-4 h-4 rounded bg-zinc-700 border-zinc-600" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider flex-1">Member</span>
            <span className="text-xs text-zinc-500 uppercase tracking-wider w-24">Group</span>
            <span className="text-xs text-zinc-500 uppercase tracking-wider w-28">Status</span>
            <span className="text-xs text-zinc-500 uppercase tracking-wider w-20 text-right">Actions</span>
          </div>

          <div className="divide-y divide-white/5">
            {filteredMembers.map((member) => {
              const group = getGroupById(member.group)
              return (
                <div key={member.id} className="px-5 py-4 flex items-center gap-4 hover:bg-zinc-800/30 transition cursor-pointer">
                  <Checkbox 
                    checked={member.isParticipating} 
                    onCheckedChange={() => toggleParticipation(member.id)}
                    className="w-4 h-4 rounded bg-zinc-700 border-zinc-600 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{member.lastName}, {member.firstName}</p>
                    <p className="text-xs text-zinc-500">{member.isGuest ? 'Guest' : 'Member'}</p>
                  </div>
                  <span className={`w-24 px-3 py-1 text-xs rounded-lg text-center ${group?.isNonBogu ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-300'}`}>
                    {group?.name || member.group}
                  </span>
                  <span className={`w-28 px-3 py-1 text-xs rounded-lg text-center flex items-center justify-center gap-1 ${member.isParticipating ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${member.isParticipating ? 'bg-green-500' : 'bg-zinc-500'}`}></span>
                    {member.isParticipating ? 'Participating' : 'Not selected'}
                  </span>
                  <div className="w-20 flex justify-end">
                    <button onClick={() => deleteMember(member.id)} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 md:px-5 py-3 md:py-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs md:text-sm text-zinc-500">{filteredMembers.length} of {state.members.length} members</span>
          <span className="text-xs md:text-sm text-orange-400">{participatingCount} participating</span>
        </div>
      </div>

      {/* Clear All Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="bg-[#1e1e2a] border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Clear All Members?</DialogTitle>
            <DialogDescription className="text-zinc-400">This will remove all {state.members.length} members. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearConfirm(false)} className="border-zinc-700">Cancel</Button>
            <Button variant="destructive" onClick={clearAllMembers}>Clear All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dev tools */}
      <details className="text-sm">
        <summary className="text-zinc-500 cursor-pointer hover:text-zinc-400">Dev tools</summary>
        <div className="flex gap-2 mt-2">
          <button 
            onClick={() => {
              const testMembers: Member[] = []
              const firstNames = ['Amanda', 'Alex', 'Sakura', 'Kenji', 'Yuki', 'Mei', 'Takeshi', 'Nana', 'Rachel', 'Brian', 'Emily', 'Sota', 'Nicole', 'Ren', 'Ashley']
              const lastNames = ['Suzuki', 'Tanaka', 'Johnson', 'Kimura', 'Yamada', 'Smith', 'Ito', 'Miller', 'Yoshida', 'Williams']
              for (let i = 0; i < 25; i++) {
                testMembers.push({
                  id: generateId(),
                  firstName: firstNames[i % firstNames.length],
                  lastName: lastNames[i % lastNames.length],
                  group: state.groups[i % state.groups.length]?.id || 'group-a',
                  isGuest: false,
                  isParticipating: true,
                })
              }
              setState(prev => ({ ...prev, members: [...prev.members, ...testMembers] }))
              toast.success('Added 25 test members')
            }}
            className="px-3 py-1.5 text-xs rounded bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/50"
          >
            + Test Data
          </button>
          <button onClick={() => setShowClearConfirm(true)} className="px-3 py-1.5 text-xs rounded bg-red-900/30 text-red-400 border border-red-800/50 hover:bg-red-900/50">
            Clear All
          </button>
        </div>
      </details>
    </div>
  )
}

// Guests Tab Component  
function GuestsTab({
  state,
  setState,
  addGuestMember,
  getGroupById,
}: {
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
  addGuestMember: (firstName: string, lastName: string, group: string, guestDojo?: string) => void
  getGroupById: (id: string) => Group | undefined
}) {
  const [showAddGuest, setShowAddGuest] = useState(false)
  const [guestFirstName, setGuestFirstName] = useState('')
  const [guestLastName, setGuestLastName] = useState('')
  const [guestGroup, setGuestGroup] = useState(state.groups[0]?.id || '')
  const [guestDojo, setGuestDojo] = useState('')

  const guests = state.members.filter(m => m.isGuest)

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Actions */}
      <div className="bg-[#1e1e2a] border border-white/5 rounded-xl md:rounded-2xl p-3 md:p-4">
        <Dialog open={showAddGuest} onOpenChange={setShowAddGuest}>
          <DialogTrigger asChild>
            <button className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-purple-500/20">
              <Plus className="w-4 h-4" />
              Add Guest
            </button>
          </DialogTrigger>
          <DialogContent className="bg-[#1e1e2a] border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white">Add Guest</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">First Name</Label>
                <Input value={guestFirstName} onChange={e => setGuestFirstName(e.target.value)} className="bg-zinc-800 border-zinc-700" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Last Name</Label>
                <Input value={guestLastName} onChange={e => setGuestLastName(e.target.value)} className="bg-zinc-800 border-zinc-700" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Group</Label>
                <Select value={guestGroup} onValueChange={setGuestGroup}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {state.groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Dojo (optional)</Label>
                <Input value={guestDojo} onChange={e => setGuestDojo(e.target.value)} className="bg-zinc-800 border-zinc-700" placeholder="Guest's home dojo" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddGuest(false)} className="border-zinc-700">Cancel</Button>
              <Button onClick={() => { addGuestMember(guestFirstName, guestLastName, guestGroup, guestDojo); setGuestFirstName(''); setGuestLastName(''); setGuestDojo(''); setShowAddGuest(false); }} className="bg-purple-600 hover:bg-purple-700">Add Guest</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Guests List */}
      <div className="bg-[#1e1e2a] border border-white/5 rounded-xl md:rounded-2xl overflow-hidden">
        <div className="px-5 py-3 bg-zinc-800/30 border-b border-white/5">
          <span className="text-sm font-medium">Guests ({guests.length})</span>
        </div>
        <div className="divide-y divide-white/5">
          {guests.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">No guests added yet</div>
          ) : (
            guests.map((guest) => {
              const group = getGroupById(guest.group)
              return (
                <div key={guest.id} className="px-5 py-4 flex items-center gap-4 hover:bg-zinc-800/30 transition">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">{guest.firstName[0]}{guest.lastName[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{guest.lastName}, {guest.firstName}</p>
                    <p className="text-xs text-zinc-500">{guest.guestDojo || 'Guest'}</p>
                  </div>
                  <span className="px-3 py-1 text-xs rounded-lg bg-zinc-800 text-zinc-300">{group?.name}</span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Guest Registry */}
      {state.guestRegistry.length > 0 && (
        <div className="bg-[#1e1e2a] border border-white/5 rounded-xl md:rounded-2xl overflow-hidden">
          <div className="px-5 py-3 bg-zinc-800/30 border-b border-white/5">
            <span className="text-sm font-medium">Guest Registry ({state.guestRegistry.length})</span>
          </div>
          <div className="divide-y divide-white/5">
            {state.guestRegistry.map(guest => (
              <div key={guest.id} className="px-5 py-3 flex items-center gap-3 text-sm">
                <span className="text-zinc-300">{guest.lastName}, {guest.firstName}</span>
                {guest.guestDojo && <span className="text-zinc-500">({guest.guestDojo})</span>}
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
  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [newGroupName, setNewGroupName] = useState('')

  const addGroup = () => {
    if (!newGroupName.trim()) return
    const newGroup: Group = {
      id: generateId(),
      name: newGroupName.trim(),
      isNonBogu: false,
    }
    setState(prev => ({ ...prev, groups: [...prev.groups, newGroup] }))
    setNewGroupName('')
    toast.success(`Group "${newGroupName}" added`)
  }

  const deleteGroup = (id: string) => {
    setState(prev => ({ ...prev, groups: prev.groups.filter(g => g.id !== id) }))
    toast.success('Group deleted')
  }

  const updateGroupName = (id: string, name: string) => {
    setState(prev => ({
      ...prev,
      groups: prev.groups.map(g => g.id === id ? { ...g, name } : g)
    }))
    setEditingGroup(null)
    toast.success('Group renamed')
  }

  const toggleNonBogu = (id: string) => {
    setState(prev => ({
      ...prev,
      groups: prev.groups.map(g => g.id === id ? { ...g, isNonBogu: !g.isNonBogu } : g)
    }))
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Add New Group */}
      <div className="bg-[#1e1e2a] border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-5">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Add New Group</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Group name..."
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            className="bg-zinc-800 border-zinc-700 focus:border-orange-500"
            onKeyDown={e => e.key === 'Enter' && addGroup()}
          />
          <button onClick={addGroup} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-orange-500/20">
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Groups List */}
      <div className="bg-[#1e1e2a] border border-white/5 rounded-xl md:rounded-2xl overflow-hidden">
        <div className="px-5 py-3 bg-zinc-800/30 border-b border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Groups ({state.groups.length})</span>
            <span className="text-xs text-zinc-500">Drag to reorder • Odd = Court A, Even = Court B</span>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {state.groups.map((group, groupIndex) => {
            const memberCount = state.members.filter(m => m.group === group.id).length
            const isCourtA = groupIndex % 2 === 0
            
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
                className={`px-5 py-4 flex items-center gap-4 hover:bg-zinc-800/30 transition cursor-move border-l-4 ${isCourtA ? 'border-l-amber-500' : 'border-l-zinc-500'}`}
              >
                {/* Court Badge */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${isCourtA ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-700 text-zinc-400'}`}>
                  {isCourtA ? 'A' : 'B'}
                </div>

                {/* Order Number */}
                <span className="text-xs text-zinc-500 w-4">#{groupIndex + 1}</span>

                {/* Group Name */}
                <div className="flex-1">
                  {editingGroup === group.id ? (
                    <Input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onBlur={() => updateGroupName(group.id, editName)}
                      onKeyDown={e => e.key === 'Enter' && updateGroupName(group.id, editName)}
                      className="h-8 bg-zinc-800 border-zinc-700 text-sm"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="font-medium cursor-pointer hover:text-orange-400 transition-colors"
                      onClick={() => { setEditingGroup(group.id); setEditName(group.name); }}
                    >
                      {group.name}
                    </span>
                  )}
                </div>

                {/* Member Count */}
                <span className="text-xs text-zinc-500">{memberCount} members</span>

                {/* Non-Bogu Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">判定</span>
                  <Switch
                    checked={group.isNonBogu}
                    onCheckedChange={() => toggleNonBogu(group.id)}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>

                {/* Delete */}
                <button 
                  onClick={() => deleteGroup(group.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Court Assignment Info */}
      <div className="bg-[#1e1e2a] border border-white/5 rounded-xl p-4">
        <h4 className="text-sm font-medium text-zinc-300 mb-3">Court Assignment Preview</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center">A</span>
              <span className="text-sm text-zinc-400">Court A</span>
            </div>
            {state.groups.filter((_, i) => i % 2 === 0).map(g => (
              <div key={g.id} className="text-sm text-zinc-300 pl-8">{g.name}</div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded bg-zinc-700 text-zinc-400 text-xs font-bold flex items-center justify-center">B</span>
              <span className="text-sm text-zinc-400">Court B</span>
            </div>
            {state.groups.filter((_, i) => i % 2 === 1).map(g => (
              <div key={g.id} className="text-sm text-zinc-300 pl-8">{g.name}</div>
            ))}
          </div>
        </div>
      </div>
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
  generateTournament: (month: string, year: number) => void
  refreshTournamentParticipants: () => void
  archiveTournament: () => void
}) {
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
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
      <Card className="bg-[#1e1e2a] border-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Tournament Setup</CardTitle>
          <CardDescription className="text-zinc-300">
            Generate a round-robin tournament. You can generate before selecting participants, then refresh to add them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="bg-zinc-700/50 border-zinc-600 bg-[#1e1e2a] hover:bg-zinc-600/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-700/50 border-zinc-600 bg-[#1e1e2a] hover:bg-zinc-600/50">
                  {MONTHS.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Year</Label>
              <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="bg-zinc-700/50 border-zinc-600 bg-[#1e1e2a] hover:bg-zinc-600/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-700/50 border-zinc-600 bg-[#1e1e2a] hover:bg-zinc-600/50">
                  {[2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-800/50 rounded-xl p-4 text-center border border-white/5">
              <div className="text-3xl font-bold text-white">{state.members.length}</div>
              <div className="text-sm text-zinc-300">Total Members</div>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4 text-center border border-white/5">
              <div className="text-3xl font-bold text-orange-400">
                {state.members.filter(m => m.isParticipating).length}
              </div>
              <div className="text-sm text-zinc-300">Participating</div>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4 text-center border border-white/5">
              <div className="text-3xl font-bold text-white">{state.groups.length}</div>
              <div className="text-sm text-zinc-300">Groups</div>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4 text-center border border-white/5">
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
              <div className="text-sm text-zinc-300">Est. Matches</div>
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
                    className={`${g.isNonBogu ? 'border-orange-500 text-orange-400' : 'border-zinc-600 text-zinc-300'}`}
                  >
                    {g.name}: {count}
                  </Badge>
                )
              })}
            </div>
          </div>

          <Button 
            onClick={() => generateTournament(selectedMonth, selectedYear)}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:bg-orange-700"
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
      <Card className="bg-[#1e1e2a] border-white/5 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-white text-lg sm:text-xl">{tournament.name}</CardTitle>
              <CardDescription className="text-zinc-400 text-sm">
                {tournament.month} {tournament.year}
              </CardDescription>
            </div>
            <Badge className={`text-sm px-3 py-1 ${
              tournament.status === 'setup' ? 'bg-yellow-600' :
              tournament.status === 'in_progress' ? 'bg-emerald-600' :
              'bg-zinc-600'
            }`}>
              {tournament.status === 'setup' ? 'Setup' : tournament.status === 'in_progress' ? 'In Progress' : 'Completed'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Progress value={(completedMatches / totalMatches) * 100} className="flex-1" />
            <span className="text-zinc-300 text-sm">{completedMatches}/{totalMatches} matches</span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-2 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-amber-400">{courtAMatches.length}</div>
              <div className="text-xs sm:text-sm text-zinc-400">Court A</div>
            </div>
            <div className="bg-zinc-700/30 border border-white/5 rounded-lg p-2 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-zinc-300">{courtBMatches.length}</div>
              <div className="text-xs sm:text-sm text-zinc-400">Court B</div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {tournament.status === 'setup' && (
              <>
                <Button onClick={startTournament} className="bg-emerald-600 hover:bg-emerald-700">
                  <Play className="w-4 h-4 mr-2" />
                  Start Tournament
                </Button>
                <Button onClick={refreshTournamentParticipants} variant="outline" className="border-zinc-600 bg-[#1e1e2a] hover:bg-zinc-600/50">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Participants
                </Button>
              </>
            )}
            {tournament.status === 'in_progress' && !isComplete && (
              <Button onClick={refreshTournamentParticipants} variant="outline" size="sm" className="border-zinc-600 bg-[#1e1e2a] hover:bg-zinc-600/50">
                <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Update Participants</span>
                <span className="sm:hidden">Refresh</span>
              </Button>
            )}
            {isComplete && (
              <Button onClick={archiveTournament} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:bg-orange-700">
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
          <Card key={groupId} className={`border ${groupMatches[0]?.court === 'A' ? 'border-red-800/30' : 'border-zinc-700/30'}`}>
            <CardHeader className="p-3">
              <div className="flex items-center justify-between">
                {/* Left: Group info */}
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${groupMatches[0]?.court === 'A' ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30' : 'bg-zinc-600/20 text-zinc-400 border border-zinc-600/30'}`}>
                    {groupMatches[0]?.court || 'A'}
                  </span>
                  <span className="text-white font-medium">{group?.name || groupId}</span>
                  {group?.isNonBogu && <span className="text-[10px] px-1.5 py-0.5 bg-orange-900/40 text-orange-300 rounded">判定</span>}
                  <span className="text-xs text-zinc-500">{groupMatches.filter(m => m.status === 'completed').length}/{groupMatches.length}</span>
                </div>
                
                {/* Right: Court toggle */}
                <div className="flex rounded-lg overflow-hidden border border-zinc-700">
                  <button
                    className={`px-3 py-1 text-xs font-medium transition-colors ${groupMatches[0]?.court === 'A' ? 'bg-amber-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                    onClick={() => setGroupCourt(groupId, 'A')}
                  >
                    A
                  </button>
                  <button
                    className={`px-3 py-1 text-xs font-medium transition-colors ${groupMatches[0]?.court === 'B' ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700/50'}`}
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
                          match.status === 'completed' ? 'bg-zinc-700/20' :
                          match.status === 'in_progress' ? 'bg-emerald-900/20 border border-emerald-700' :
                          'bg-[#1e1e2a]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {/* Match number and court badge */}
                          <span className="text-zinc-500 text-xs w-5">#{idx + 1}</span>
                          <button
                            className={`w-6 h-6 rounded text-xs font-bold ${match.court === 'A' ? 'bg-amber-600 text-white' : 'bg-zinc-600 text-white'}`}
                            onClick={() => swapMatchCourt(match.id)}
                          >
                            {match.court}
                          </button>
                          
                          {/* Players - stacked on mobile, inline on desktop */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 text-sm">
                              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
                              <span className={`truncate ${match.winner === 'player1' ? 'text-red-400 font-semibold' : 'text-white'}`}>
                                {p1?.firstName || '?'}
                              </span>
                              <span className="text-zinc-500 mx-1">vs</span>
                              <span className="w-2 h-2 rounded-full bg-white flex-shrink-0"></span>
                              <span className={`truncate ${match.winner === 'player2' ? 'text-zinc-200 font-semibold' : 'text-white'}`}>
                                {p2?.firstName || '?'}
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* Status indicators */}
                        {match.status === 'completed' && (
                          <span className={`text-xs px-2 py-0.5 rounded ${match.winner === 'player1' ? 'bg-red-900/50 text-red-400' : match.winner === 'player2' ? 'bg-zinc-700/50 text-zinc-300' : 'bg-zinc-700 text-zinc-400'}`}>
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
      <Card className="bg-[#1e1e2a] border-white/5 backdrop-blur-sm">
        <CardContent className="p-8 text-center text-zinc-400">
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
          className={selectedGroup === 'all' ? 'bg-amber-600' : 'border-zinc-700'}
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
              className={selectedGroup === gId ? 'bg-amber-600' : 'border-zinc-700'}
            >
              {group?.name || gId}
            </Button>
          )
        })}
      </div>

      {groupsToShow.map(groupId => {
        const group = getGroupById(groupId)
        const standings = calculateStandings(groupId, state.currentTournament!.matches, state.members)
        const groupMembers = state.members.filter(m => m.group === groupId && m.isParticipating)
        
        if (standings.length === 0) return null

        return (
          <Card key={groupId} className="bg-[#1e1e2a] border-white/5 backdrop-blur-sm">
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
                    <tr className="border-b border-zinc-600 bg-[#1e1e2a] hover:bg-zinc-600/50">
                      <th className="text-left text-zinc-300 p-2 font-medium">#</th>
                      <th className="text-left text-zinc-300 p-2 font-medium">Name</th>
                      <th className="text-center text-zinc-300 p-2 font-medium">Pts</th>
                      <th className="text-center text-zinc-300 p-2 font-medium">W</th>
                      {!group?.isNonBogu && <th className="text-center text-zinc-300 p-2 font-medium">D</th>}
                      <th className="text-center text-zinc-300 p-2 font-medium">L</th>
                      {!group?.isNonBogu && <th className="text-center text-zinc-300 p-2 font-medium">Ippons</th>}
                      {groupMembers.map(m => (
                        <th key={m.id} className="text-center text-zinc-300 p-2 font-medium text-xs">
                          {m.firstName.charAt(0)}{m.lastName.charAt(0)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((standing, idx) => (
                      <tr key={standing.playerId} className="border-b border-white/5 hover:bg-[#1e1e2a]">
                        <td className="p-2 text-zinc-400">{idx + 1}</td>
                        <td className="p-2 text-white font-medium">{standing.playerName}</td>
                        <td className="p-2 text-center text-orange-400 font-bold">{standing.points}</td>
                        <td className="p-2 text-center text-green-400">{standing.wins}</td>
                        {!group?.isNonBogu && <td className="p-2 text-center text-zinc-300">{standing.draws}</td>}
                        <td className="p-2 text-center text-red-400">{standing.losses}</td>
                        {!group?.isNonBogu && (
                          <td className="p-2 text-center text-zinc-300">
                            {standing.ipponsScored}-{standing.ipponsAgainst}
                          </td>
                        )}
                        {groupMembers.map(m => {
                          if (m.id === standing.playerId) {
                            return <td key={m.id} className="p-2 text-center text-zinc-600">-</td>
                          }
                          const result = standing.results.get(m.id)
                          let className = 'p-2 text-center '
                          if (result === 'W') className += 'text-green-400 bg-green-900/20'
                          else if (result === 'L') className += 'text-red-400 bg-red-900/20'
                          else if (result === 'D') className += 'text-zinc-300 bg-zinc-700/50'
                          else className += 'text-zinc-600'
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
      <Card className="bg-[#1e1e2a] border-white/5 backdrop-blur-sm">
        <CardContent className="p-8 text-center text-zinc-400">
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
            <Button variant="outline" className="border-zinc-600 bg-[#1e1e2a] hover:bg-zinc-600/50">
              <Upload className="w-4 h-4 mr-2" />
              Import Past History
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1e1e2a] border-white/5 backdrop-blur-sm max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Import Tournament History</DialogTitle>
              <DialogDescription className="text-zinc-300">
                Import past tournament data from CSV/Excel. Format: Month,Year,GroupName,Rank,PlayerName,Points,Wins,Losses,Draws
              </DialogDescription>
            </DialogHeader>
            <HistoryImportForm onImport={handleExcelImport} />
          </DialogContent>
        </Dialog>
      </div>

      {history.map(entry => (
        <Card key={entry.id} className="bg-[#1e1e2a] border-white/5 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">{entry.name}</CardTitle>
                <CardDescription className="text-zinc-300">{entry.date}</CardDescription>
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
                <div key={result.groupId} className="bg-[#1e1e2a] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-white font-medium">{result.groupName}</h4>
                    {result.isNonBogu && <Badge className="bg-orange-900 text-orange-200 text-xs">Hantei</Badge>}
                  </div>
                  <div className="space-y-2">
                    {result.standings.slice(0, 3).map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className={`w-6 text-center font-bold ${
                          idx === 0 ? 'text-orange-400' :
                          idx === 1 ? 'text-zinc-300' :
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
          className="bg-zinc-800 border-zinc-600 focus:border-orange-500"
        />
      </div>
      <div className="space-y-2">
        <Label>Or paste data</Label>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          className="w-full h-40 bg-zinc-700/50 border border-zinc-700 rounded-md p-3 text-white text-sm font-mono"
          placeholder="Month,Year,GroupName,Rank,PlayerName,Points,Wins,Losses,Draws&#10;January,2025,Group A,1,John Doe,6,3,0,0&#10;January,2025,Group A,2,Jane Smith,4,2,1,0"
        />
      </div>
      <DialogFooter>
        <Button 
          onClick={() => onImport(importText)}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:bg-orange-700"
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
          className="bg-zinc-800 border-zinc-600 focus:border-orange-500"
          placeholder="Enter first name"
        />
      </div>
      <div className="space-y-2">
        <Label>Last Name</Label>
        <Input 
          value={lastName} 
          onChange={(e) => setLastName(e.target.value)}
          className="bg-zinc-800 border-zinc-600 focus:border-orange-500"
          placeholder="Enter last name"
        />
      </div>
      <div className="space-y-2">
        <Label>Group</Label>
        <Select value={group} onValueChange={setGroup}>
          <SelectTrigger className="bg-zinc-700/50 border-zinc-600 bg-[#1e1e2a] hover:bg-zinc-600/50">
            <SelectValue placeholder="Select group" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-700/50 border-zinc-600 bg-[#1e1e2a] hover:bg-zinc-600/50">
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
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:bg-orange-700"
        >
          Add Member
        </Button>
      </DialogFooter>
    </div>
  )
}

// CSV Import Form
function CSVImportForm({ onImport }: { onImport: (csv: string) => void }) {
  const [csvText, setCSVText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setCSVText(event.target?.result as string)
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Upload CSV File</Label>
        <Input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="bg-zinc-800 border-zinc-600 focus:border-orange-500"
        />
      </div>
      <div className="space-y-2">
        <Label>Or paste CSV content</Label>
        <textarea
          value={csvText}
          onChange={(e) => setCSVText(e.target.value)}
          className="w-full h-40 bg-zinc-700/50 border border-zinc-700 rounded-md p-3 text-white text-sm font-mono"
          placeholder="FirstName,LastName,Group&#10;John,Doe,A&#10;Jane,Smith,B"
        />
      </div>
      <DialogFooter>
        <Button 
          onClick={() => onImport(csvText)}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:bg-orange-700"
          disabled={!csvText.trim()}
        >
          <Upload className="w-4 h-4 mr-2" />
          Import
        </Button>
      </DialogFooter>
    </div>
  )
}

// Guests Manager
function GuestsManager({ 
  state, 
  onAddGuest,
  groups,
}: { 
  state: AppState
  onAddGuest: (firstName: string, lastName: string, group: string, guestDojo?: string) => void
  groups: Group[]
}) {
  const [showAddGuest, setShowAddGuest] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dojo, setDojo] = useState('')
  const [group, setGroup] = useState(groups[0]?.id || '')

  const handleAddGuest = () => {
    if (!firstName || !lastName || !group) {
      toast.error('Please fill required fields')
      return
    }
    onAddGuest(firstName, lastName, group, dojo || undefined)
    setFirstName('')
    setLastName('')
    setDojo('')
    setShowAddGuest(false)
  }

  const addFromRegistry = (guest: Member) => {
    onAddGuest(guest.firstName, guest.lastName, guest.group, guest.guestDojo)
  }

  return (
    <div className="space-y-4">
      <Card className="bg-[#1e1e2a] border-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Guest Registry</CardTitle>
          <CardDescription className="text-zinc-300">
            Previously registered guests from other dojos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Dialog open={showAddGuest} onOpenChange={setShowAddGuest}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add New Guest
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1e1e2a] border-white/5 backdrop-blur-sm">
                <DialogHeader>
                  <DialogTitle className="text-white">Add Guest</DialogTitle>
                  <DialogDescription className="text-zinc-300">Add a guest from another dojo</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name *</Label>
                      <Input 
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        className="bg-zinc-800 border-zinc-600 focus:border-orange-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name *</Label>
                      <Input 
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        className="bg-zinc-800 border-zinc-600 focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Dojo</Label>
                    <Input 
                      value={dojo}
                      onChange={e => setDojo(e.target.value)}
                      className="bg-zinc-800 border-zinc-600 focus:border-orange-500"
                      placeholder="Guest's home dojo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Group *</Label>
                    <Select value={group} onValueChange={setGroup}>
                      <SelectTrigger className="bg-zinc-700/50 border-zinc-600 bg-[#1e1e2a] hover:bg-zinc-600/50">
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-700/50 border-zinc-600 bg-[#1e1e2a] hover:bg-zinc-600/50">
                        {groups.map(g => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name} {g.isNonBogu && '(Hantei)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddGuest} className="bg-purple-600 hover:bg-purple-700">
                      Add Guest
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <ScrollArea className="h-72 pr-2">
            <div className="space-y-2">
              {state.guestRegistry.length === 0 ? (
                <div className="text-center text-zinc-400 py-8">No guests in registry</div>
              ) : (
                state.guestRegistry.map(guest => {
                  const alreadyAdded = state.members.some(
                    m => m.firstName === guest.firstName && m.lastName === guest.lastName && m.isGuest
                  )
                  return (
                    <div 
                      key={guest.id}
                      className="flex items-center justify-between p-3 bg-[#1e1e2a] rounded-lg"
                    >
                      <div>
                        <span className="text-white">{guest.firstName} {guest.lastName}</span>
                        {guest.guestDojo && (
                          <span className="text-zinc-400 text-sm ml-2">({guest.guestDojo})</span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={alreadyAdded ? 'secondary' : 'default'}
                        disabled={alreadyAdded}
                        onClick={() => addFromRegistry(guest)}
                        className={alreadyAdded ? '' : 'bg-purple-600 hover:bg-purple-700'}
                      >
                        {alreadyAdded ? 'Added' : 'Add to Roster'}
                      </Button>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
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
  const [showWinnerPrompt, setShowWinnerPrompt] = useState<{show: boolean, winner: 'player1' | 'player2' | null}>({show: false, winner: null})
  
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
  const isHantei = currentMatch?.isHantei || false

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

  const addScore = (player: 'player1' | 'player2', scoreType: number) => {
    if (!tournament || !currentMatch) return

    const updatedMatches = (tournament.matches || []).map(m => {
      if (m.id === currentMatch.id) {
        const newScore = player === 'player1' 
          ? [...m.player1Score, scoreType]
          : [...m.player2Score, scoreType]
        
        return {
          ...m,
          status: 'in_progress' as const,
          player1Score: player === 'player1' ? newScore : m.player1Score,
          player2Score: player === 'player2' ? newScore : m.player2Score,
        }
      }
      return m
    })

    setState(prev => ({
      ...prev,
      currentTournament: { ...tournament, matches: updatedMatches }
    }))
    
    // Check for winner after scoring
    const updatedMatch = updatedMatches.find(m => m.id === currentMatch.id)
    if (updatedMatch) {
      const p1Score = updatedMatch.player1Score.length
      const p2Score = updatedMatch.player2Score.length
      if (p1Score >= 2) {
        setShowWinnerPrompt({ show: true, winner: 'player1' })
      } else if (p2Score >= 2) {
        setShowWinnerPrompt({ show: true, winner: 'player2' })
      }
    }
  }

  const removeScore = (player: 'player1' | 'player2', index: number) => {
    if (!tournament || !currentMatch) return

    const updatedMatches = (tournament.matches || []).map(m => {
      if (m.id === currentMatch.id) {
        return {
          ...m,
          player1Score: player === 'player1' 
            ? m.player1Score.filter((_, i) => i !== index) 
            : m.player1Score,
          player2Score: player === 'player2' 
            ? m.player2Score.filter((_, i) => i !== index) 
            : m.player2Score,
        }
      }
      return m
    })

    setState(prev => ({
      ...prev,
      currentTournament: { ...tournament, matches: updatedMatches }
    }))
  }

  const undoScore = (player: 'player1' | 'player2') => {
    if (!tournament || !currentMatch) return
    const scores = player === 'player1' ? currentMatch.player1Score : currentMatch.player2Score
    if (scores.length > 0) {
      removeScore(player, scores.length - 1)
    }
  }

  const completeMatch = (winner: 'player1' | 'player2' | 'draw') => {
    if (!tournament || !currentMatch) return

    const updatedMatches = (tournament.matches || []).map(m => {
      if (m.id === currentMatch.id) {
        return { ...m, status: 'completed' as const, winner }
      }
      return m
    })

    setState(prev => ({
      ...prev,
      currentTournament: { ...tournament, matches: updatedMatches },
      timerSecondsA: selectedCourt === 'A' ? 0 : prev.timerSecondsA,
      timerSecondsB: selectedCourt === 'B' ? 0 : prev.timerSecondsB,
      timerRunningA: selectedCourt === 'A' ? false : prev.timerRunningA,
      timerRunningB: selectedCourt === 'B' ? false : prev.timerRunningB,
    }))

    setShowWinnerPrompt({ show: false, winner: null })
    toast.success('Match completed!')
  }

  const swapMatchToCourt = (matchId: string, newCourt: 'A' | 'B') => {
    if (!tournament) return
    setState(prev => ({
      ...prev,
      currentTournament: {
        ...tournament,
        matches: (tournament.matches || []).map(m => 
          m.id === matchId ? { ...m, court: newCourt } : m
        )
      }
    }))
    toast.success(`Match moved to Court ${newCourt}`)
  }

  const moveInQueue = (matchId: string, direction: 'up' | 'down') => {
    if (!tournament) return
    const courtMatches = currentMatches.filter(m => m.status === 'pending')
    const idx = courtMatches.findIndex(m => m.id === matchId)
    if (idx === -1) return
    
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= courtMatches.length) return
    
    const allMatches = [...tournament.matches]
    const match1 = allMatches.find(m => m.id === matchId)!
    const match2Idx = allMatches.findIndex(m => m.id === courtMatches[newIdx].id)
    
    if (match1 && match2Idx !== -1) {
      const tempOrder = match1.orderIndex
      match1.orderIndex = allMatches[match2Idx].orderIndex
      allMatches[match2Idx].orderIndex = tempOrder
    }
    
    setState(prev => ({
      ...prev,
      currentTournament: { ...tournament, matches: allMatches }
    }))
  }

  // No tournament or not started
  if (!tournament || tournament.status !== 'in_progress') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a24] via-[#13131a] to-[#1a1a24] flex items-center justify-center p-4">
        <Toaster theme="dark" position="top-center" />
        <Card className="bg-[#1a1a24] border-zinc-700 max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-white text-center">No Active Tournament</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <img src="/renbu-logo.png" alt="Renbu" className="w-20 h-20 mx-auto opacity-50" />
            <p className="text-zinc-300">
              {tournament ? 'Tournament needs to be started from Admin Portal' : 'No tournament has been generated yet'}
            </p>
            <Button onClick={onSwitchPortal} variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500/10">
              Go to Admin Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const player1 = currentMatch ? getMemberById(currentMatch.player1Id) : null
  const player2 = currentMatch ? getMemberById(currentMatch.player2Id) : null

  const scoreTypes = [
    { id: 1, name: 'Men', short: 'M', color: 'bg-zinc-600 hover:bg-zinc-700' },
    { id: 2, name: 'Kote', short: 'K', color: 'bg-green-600 hover:bg-green-700' },
    { id: 3, name: 'Do', short: 'D', color: 'bg-purple-600 hover:bg-purple-700' },
    { id: 4, name: 'Tsuki', short: 'T', color: 'bg-cyan-600 hover:bg-cyan-700' },
    { id: 5, name: 'Hansoku', short: 'H', color: 'bg-yellow-600 hover:bg-yellow-700' },
  ]

  // Render queue for a court
  const renderCourtQueue = (court: 'A' | 'B', matches: Match[]) => {
    const pendingMatches = matches.filter(m => m.status !== 'completed').sort((a, b) => a.orderIndex - b.orderIndex)
    const completedMatches = matches.filter(m => m.status === 'completed')
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className={`font-semibold ${court === 'A' ? 'text-red-400' : 'text-zinc-200'}`}>
            Court {court} ({pendingMatches.length} pending)
          </h3>
        </div>
        <ScrollArea className="h-[280px]">
          <div className="space-y-2 pr-2">
            {pendingMatches.length === 0 && (
              <p className="text-zinc-400 text-sm text-center py-4">No pending matches</p>
            )}
            {pendingMatches.map((match, idx) => {
              const p1 = getMemberById(match.player1Id)
              const p2 = getMemberById(match.player2Id)
              const matchGroup = getGroupById(match.groupId)
              const isCurrent = match.status === 'in_progress' || idx === 0
              
              return (
                <div
                  key={match.id}
                  className={`p-3 rounded-lg ${
                    isCurrent ? 'bg-emerald-900/30 border border-emerald-700' : 'bg-[#1e1e2a]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-zinc-400 text-xs">#{idx + 1}</span>
                    <Badge variant="outline" className="text-xs border-zinc-400 bg-[#1e1e2a] hover:bg-zinc-600/50">{matchGroup?.name || '?'}</Badge>
                    {isCurrent && <Circle className="w-3 h-3 text-emerald-500 animate-pulse ml-auto" />}
                  </div>
                  <div className="text-sm text-white text-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                    <span className="font-medium ml-1">{p1?.firstName || '?'} {p1?.lastName?.charAt(0) || ''}.</span>
                    <span className="text-zinc-400 mx-2">vs</span>
                    <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
                    <span className="font-medium ml-1">{p2?.firstName || '?'} {p2?.lastName?.charAt(0) || ''}.</span>
                  </div>
                  <div className="flex gap-1 mt-2 justify-center">
                    <Button 
                      size="sm" 
                      variant="ghost" className="h-8 w-8 h-7 text-xs"
                      onClick={() => swapMatchToCourt(match.id, court === 'A' ? 'B' : 'A')}
                    >
                      <ArrowLeftRight className="w-3 h-3 mr-1" />
                      {court === 'A' ? 'B' : 'A'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" className="h-8 w-8 h-7 text-xs"
                      onClick={() => moveInQueue(match.id, 'up')}
                      disabled={idx === 0}
                    >
                      ↑
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" className="h-8 w-8 h-7 text-xs"
                      onClick={() => moveInQueue(match.id, 'down')}
                      disabled={idx === pendingMatches.length - 1}
                    >
                      ↓
                    </Button>
                  </div>
                </div>
              )
            })}
            {completedMatches.length > 0 && (
              <>
                <Separator className="my-2 bg-zinc-600/50" />
                <p className="text-xs text-zinc-400">Completed ({completedMatches.length})</p>
                {completedMatches.slice(-5).reverse().map(match => {
                  const p1 = getMemberById(match.player1Id)
                  const p2 = getMemberById(match.player2Id)
                  return (
                    <div key={match.id} className="p-2 bg-zinc-700/20 rounded text-sm text-center">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                      <span className={match.winner === 'player1' ? 'text-emerald-400 font-semibold ml-1' : 'text-white ml-1'}>
                        {p1?.firstName || '?'} {p1?.lastName?.charAt(0) || ''}.
                      </span>
                      <span className="text-zinc-400 mx-2">vs</span>
                      <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
                      <span className={match.winner === 'player2' ? 'text-emerald-400 font-semibold ml-1' : 'text-white ml-1'}>
                        {p2?.firstName || '?'} {p2?.lastName?.charAt(0) || ''}.
                      </span>
                      <span className="text-zinc-300 ml-2">
                        {match.isHantei ? '(判定)' : `${match.player1Score.length}-${match.player2Score.length}`}
                      </span>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    )
  }

  // Winner Prompt Dialog
  const WinnerPromptDialog = () => {
    if (!showWinnerPrompt.show || !showWinnerPrompt.winner || !currentMatch) return null
    
    const winnerPlayer = showWinnerPrompt.winner === 'player1' ? player1 : player2
    const winnerColor = showWinnerPrompt.winner === 'player1' ? 'red' : 'white'
    
    return (
      <Dialog open={showWinnerPrompt.show} onOpenChange={() => setShowWinnerPrompt({ show: false, winner: null })}>
        <DialogContent className="bg-[#1a1a24] border-zinc-600 bg-[#1e1e2a] hover:bg-zinc-600/50">
          <DialogHeader>
            <DialogTitle className="text-white text-center text-2xl">Match Winner!</DialogTitle>
          </DialogHeader>
          <div className={`p-8 rounded-lg text-center ${winnerColor === 'red' ? 'bg-red-900/30 border-2 border-amber-600' : 'bg-zinc-600/30 border-2 border-zinc-400'}`}>
            <Award className={`w-16 h-16 mx-auto mb-4 ${winnerColor === 'red' ? 'text-red-400' : 'text-zinc-200'}`} />
            <p className={`text-3xl font-bold ${winnerColor === 'red' ? 'text-red-400' : 'text-zinc-200'}`}>
              {winnerPlayer?.firstName} {winnerPlayer?.lastName}
            </p>
            <p className="text-zinc-300 mt-2">{winnerColor === 'red' ? 'AKA' : 'SHIRO'} Wins!</p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowWinnerPrompt({ show: false, winner: null })}>
              Continue Match
            </Button>
            <Button 
              onClick={() => completeMatch(showWinnerPrompt.winner!)}
              className={winnerColor === 'red' ? 'bg-amber-600 hover:bg-red-700' : 'bg-zinc-600/50 hover:bg-zinc-500'}
            >
              Complete Match
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a24] via-[#13131a] to-[#1a1a24]">
      <Toaster theme="dark" position="top-center" />
      <WinnerPromptDialog />
      
      {/* Header */}
      <header className="bg-[#1a1a24] border-b border-white/5 backdrop-blur-md px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/renbu-logo.png" alt="Renbu" className="w-8 h-8" />
            <h1 className="text-xl font-bold text-white">Courtkeeper</h1>
            <Badge className={selectedCourt === 'A' ? 'bg-amber-600' : 'bg-zinc-600/50'}>
              Court {selectedCourt}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={selectedCourt === 'A' ? 'default' : 'outline'}
              onClick={() => setSelectedCourt('A')}
              className={selectedCourt === 'A' ? 'bg-amber-600 hover:bg-red-700' : 'border-zinc-600'}
            >
              Court A
            </Button>
            <Button
              size="sm"
              variant={selectedCourt === 'B' ? 'default' : 'outline'}
              onClick={() => setSelectedCourt('B')}
              className={selectedCourt === 'B' ? 'bg-zinc-600/50 hover:bg-zinc-500' : 'border-zinc-600'}
            >
              Court B
            </Button>
            <Button variant="ghost" className="h-8 w-8" size="sm" onClick={onSwitchPortal}>Exit</Button>
          </div>
        </div>
      </header>

      <main className={`p-4 ${!isMobile ? 'mr-80' : ''}`}>
        {!currentMatch ? (
          <Card className="bg-zinc-800 border-zinc-600 bg-[#1e1e2a] hover:bg-zinc-600/50">
            <CardContent className="p-8 text-center">
              <Trophy className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <p className="text-white text-xl">
                {currentMatches.length === 0 
                  ? `No matches assigned to Court ${selectedCourt}`
                  : `All Court ${selectedCourt} matches complete!`}
              </p>
              <p className="text-zinc-300 mt-2">
                {currentMatches.length === 0 
                  ? "Matches may be assigned to the other court"
                  : "Switch to the other court or view results"}
              </p>
              <div className="flex justify-center gap-4 mt-4">
                <Button
                  onClick={() => setSelectedCourt(selectedCourt === 'A' ? 'B' : 'A')}
                  className={selectedCourt === 'A' ? 'bg-zinc-600/50 hover:bg-zinc-500' : 'bg-amber-600 hover:bg-red-700'}
                >
                  Switch to Court {selectedCourt === 'A' ? 'B' : 'A'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Timer Section */}
            <Card className={`bg-zinc-800 border-2 mb-4 ${
              timerSeconds >= state.timerTarget ? 'border-amber-600 animate-pulse' : 'border-zinc-700'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-zinc-300" />
                    <span className="text-zinc-300">
                      {isHantei ? 'Hantei Match (3 min)' : 'Regular Match (3 min)'}
                    </span>
                  </div>
                  <Badge variant="outline" className="border-zinc-400/60 bg-zinc-800/50 border border-zinc-700/30 bg-[#1e1e2a] hover:bg-zinc-600/50">
                    {group?.name || 'Unknown Group'}
                  </Badge>
                </div>
                <div className="text-center my-4">
                  <div className={`text-7xl font-mono font-bold ${
                    timerSeconds >= state.timerTarget ? 'text-red-500' : 'text-white'
                  }`}>
                    {formatTime(timerSeconds)}
                  </div>
                  <Progress 
                    value={(timerSeconds / state.timerTarget) * 100} 
                    className="mt-3"
                  />
                </div>
                <div className="flex justify-center gap-4">
                  <Button
                    size="lg"
                    onClick={toggleTimer}
                    className={timerRunning ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:bg-orange-700' : 'bg-emerald-600 hover:bg-emerald-700'}
                  >
                    {timerRunning ? <Pause className="w-5 h-5 mr-2 w-5 h-5 mr-2" /> : <Play />}
                    {timerRunning ? 'Pause' : 'Start'}
                  </Button>
                  <Button size="lg" variant="outline" onClick={resetTimer} className="border-zinc-400 bg-[#1e1e2a] hover:bg-zinc-600/50">
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Scoring Section */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Player 1 (Red/Aka) */}
              <Card className="bg-zinc-800 border-2 border-red-800">
                <CardHeader className="pb-2 bg-red-900/30">
                  <CardTitle className="text-red-400 text-center flex items-center justify-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                    AKA
                  </CardTitle>
                  <CardDescription className="text-center text-white text-lg font-semibold">
                    {player1?.firstName || '?'} {player1?.lastName || '?'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {isHantei ? (
                    <Button
                      size="lg"
                      className="w-full h-24 text-2xl bg-red-700 hover:bg-red-600"
                      onClick={() => completeMatch('player1')}
                    >
                      <Award className="w-8 h-8 mr-2" />
                      AKA Wins
                    </Button>
                  ) : (
                    <>
                      <div className="text-center mb-4">
                        <div className="text-6xl font-bold text-white">{currentMatch.player1Score.length}</div>
                        <div className="flex justify-center gap-1 mt-2 min-h-[32px] flex-wrap">
                          {currentMatch.player1Score.map((s, i) => {
                            const scoreType = scoreTypes.find(t => t.id === s)
                            return (
                              <Badge 
                                key={i} 
                                className={`${scoreType?.color || 'bg-zinc-600/50'} cursor-pointer`}
                                onClick={() => removeScore('player1', i)}
                              >
                                {scoreType?.short || '?'}
                                <X className="w-3 h-3 ml-1" />
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {scoreTypes.map(type => (
                          <Button
                            key={type.id}
                            size="lg"
                            className={`${type.color} h-14 text-lg font-bold`}
                            onClick={() => addScore('player1', type.id)}
                          >
                            {type.short}
                          </Button>
                        ))}
                        <Button
                          size="lg"
                          variant="outline"
                          className="border-zinc-600 h-14"
                          onClick={() => undoScore('player1')}
                          disabled={currentMatch.player1Score.length === 0}
                        >
                          Undo
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Player 2 (White/Shiro) */}
              <Card className="bg-zinc-800 border-2 border-zinc-400">
                <CardHeader className="pb-2 bg-zinc-700/30">
                  <CardTitle className="text-zinc-200 text-center flex items-center justify-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-white inline-block"></span>
                    SHIRO
                  </CardTitle>
                  <CardDescription className="text-center text-white text-lg font-semibold">
                    {player2?.firstName || '?'} {player2?.lastName || '?'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {isHantei ? (
                    <Button
                      size="lg"
                      className="w-full h-24 text-2xl bg-zinc-600/50 hover:bg-zinc-500"
                      onClick={() => completeMatch('player2')}
                    >
                      <Award className="w-8 h-8 mr-2" />
                      SHIRO Wins
                    </Button>
                  ) : (
                    <>
                      <div className="text-center mb-4">
                        <div className="text-6xl font-bold text-white">{currentMatch.player2Score.length}</div>
                        <div className="flex justify-center gap-1 mt-2 min-h-[32px] flex-wrap">
                          {currentMatch.player2Score.map((s, i) => {
                            const scoreType = scoreTypes.find(t => t.id === s)
                            return (
                              <Badge 
                                key={i} 
                                className={`${scoreType?.color || 'bg-zinc-600/50'} cursor-pointer`}
                                onClick={() => removeScore('player2', i)}
                              >
                                {scoreType?.short || '?'}
                                <X className="w-3 h-3 ml-1" />
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {scoreTypes.map(type => (
                          <Button
                            key={type.id}
                            size="lg"
                            className={`${type.color} h-14 text-lg font-bold`}
                            onClick={() => addScore('player2', type.id)}
                          >
                            {type.short}
                          </Button>
                        ))}
                        <Button
                          size="lg"
                          variant="outline"
                          className="border-zinc-600 h-14"
                          onClick={() => undoScore('player2')}
                          disabled={currentMatch.player2Score.length === 0}
                        >
                          Undo
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Match Actions */}
            {!isHantei && (
              <Card className="bg-zinc-800 border-zinc-600 bg-[#1e1e2a] hover:bg-zinc-600/50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      size="lg"
                      onClick={() => completeMatch('player1')}
                      className="bg-red-700 hover:bg-red-600 h-14"
                    >
                      AKA Wins
                    </Button>
                    <Button
                      size="lg"
                      onClick={() => completeMatch('draw')}
                      variant="outline"
                      className="border-zinc-600 h-14"
                    >
                      Draw
                    </Button>
                    <Button
                      size="lg"
                      onClick={() => completeMatch('player2')}
                      className="bg-zinc-600/50 hover:bg-zinc-500 h-14"
                    >
                      SHIRO Wins
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      {/* Court Queue Sidebar (Desktop) */}
      {!isMobile && (
        <aside className="fixed right-0 top-0 w-80 h-screen bg-[#1a1a24] border-l border-zinc-700 pt-14 overflow-y-auto">
          <div className="p-4 space-y-6">
            {renderCourtQueue('A', courtAMatches)}
            <Separator className="bg-zinc-600/50" />
            {renderCourtQueue('B', courtBMatches)}
          </div>
        </aside>
      )}

      {/* Court Queue Sheet (Mobile) */}
      {isMobile && (
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              className="fixed bottom-4 right-4 rounded-full w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:bg-orange-700 shadow-lg"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-[#1a1a24] border-zinc-600 backdrop-blur-md h-[70vh]">
            <SheetHeader>
              <SheetTitle className="text-white">Match Queues</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4 overflow-y-auto">
              {renderCourtQueue('A', courtAMatches)}
              <Separator className="bg-zinc-600/50" />
              {renderCourtQueue('B', courtBMatches)}
            </div>
          </SheetContent>
        </Sheet>
      )}
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

