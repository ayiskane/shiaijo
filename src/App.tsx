import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  ChevronLeft, ChevronRight, Menu, Swords, UserPlus, FileSpreadsheet,
  Circle, CheckCircle2, Table, History, RefreshCw,
  ArrowLeftRight, Timer, Award
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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center p-4">
        <Toaster theme="dark" position="top-center" />
        <div className="max-w-lg w-full space-y-6">
          <div className="text-center mb-8">
            <img 
              src="/renbu-logo.png" 
              alt="Renbu Kendo" 
              className="w-32 h-32 mx-auto mb-6 drop-shadow-lg"
            />
            <h1 className="text-4xl font-bold text-white mb-2">Renbu Monthly Shiai</h1>
            <p className="text-slate-300">Select your portal</p>
          </div>
          
          <Card 
            className="bg-slate-800 border-2 border-slate-700 cursor-pointer hover:border-orange-500 hover:bg-slate-700/80 transition-all duration-200"
            onClick={() => setPortal('admin')}
          >
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <Settings className="w-6 h-6 text-orange-500" />
                Admin Portal
              </CardTitle>
              <CardDescription className="text-slate-300">
                Manage members, groups, and tournament setup
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card 
            className="bg-slate-800 border-2 border-slate-700 cursor-pointer hover:border-orange-500 hover:bg-slate-700/80 transition-all duration-200"
            onClick={() => setPortal('courtkeeper')}
          >
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <Swords className="w-6 h-6 text-orange-500" />
                Courtkeeper Portal
              </CardTitle>
              <CardDescription className="text-slate-300">
                Run matches, keep score, and manage timer
              </CardDescription>
            </CardHeader>
          </Card>
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
    
    // Process groups in order
    groupOrder.forEach((groupId) => {
      const groupParticipants = participantsByGroup.get(groupId)
      if (!groupParticipants || groupParticipants.length < 2) return
      
      const group = getGroupById(groupId)
      const isHantei = group?.isNonBogu || false
      const matchPairs = generateRoundRobinWithRest(groupParticipants.map(p => p.id))
      
      matchPairs.forEach((pair, idx) => {
        allMatches.push({
          id: generateId(),
          groupId,
          player1Id: pair[0],
          player2Id: pair[1],
          player1Score: [],
          player2Score: [],
          winner: null,
          status: 'pending',
          court: idx % 2 === 0 ? 'A' : 'B',
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
    
    groupOrder.forEach((groupId) => {
      const groupParticipants = participantsByGroup.get(groupId)
      if (!groupParticipants || groupParticipants.length < 2) return
      
      const group = getGroupById(groupId)
      const isHantei = group?.isNonBogu || false
      const matchPairs = generateRoundRobinWithRest(groupParticipants.map(p => p.id))
      
      matchPairs.forEach((pair, idx) => {
        allMatches.push({
          id: generateId(),
          groupId,
          player1Id: pair[0],
          player2Id: pair[1],
          player1Score: [],
          player2Score: [],
          winner: null,
          status: 'pending',
          court: idx % 2 === 0 ? 'A' : 'B',
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

  const MobileNav = () => (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="bg-slate-800/50 border-slate-600 hover:bg-slate-700 md:hidden">
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-slate-900 border-slate-700">
        <SheetHeader>
          <SheetTitle className="text-white">Navigation</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-2 mt-6">
          {['members', 'guests', 'groups', 'tournament', 'standings', 'history'].map(tab => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'ghost'}
              className="justify-start"
              onClick={() => {
                setActiveTab(tab)
                setMobileNavOpen(false)
              }}
            >
              {tab === 'members' && <Users className="w-4 h-4 mr-2" />}
              {tab === 'guests' && <UserPlus className="w-4 h-4 mr-2" />}
              {tab === 'groups' && <Filter className="w-4 h-4 mr-2" />}
              {tab === 'tournament' && <Trophy className="w-4 h-4 mr-2" />}
              {tab === 'standings' && <Table className="w-4 h-4 mr-2" />}
              {tab === 'history' && <History className="w-4 h-4 mr-2" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <div className="min-h-screen bg-slate-950">
      <Toaster theme="dark" position="top-center" />
      
      <header className="bg-slate-900/95 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <MobileNav />
            <img src="/renbu-logo.png" alt="Renbu" className="w-8 h-8" />
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-white">Admin Portal</h1>
              <Badge className="bg-orange-600/20 text-orange-400 border border-orange-600/30 text-xs">
                {state.members.filter(m => m.isParticipating).length} participating
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white"
              onClick={async () => {
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
                    members: saved.members || prev.members,
                    groups: saved.groups || prev.groups,
                    guestRegistry: saved.guestRegistry || prev.guestRegistry,
                    currentTournament: tournament,
                    history: saved.history || prev.history,
                  }))
                  toast.success('Data synced from server')
                }
              }}
              title="Sync data"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onSwitchPortal}
              className="text-slate-400 hover:text-white text-sm"
            >
              Switch Portal
            </Button>
          </div>
        </div>
        
        {/* Desktop Tabs - Guests moved next to Members */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 hidden md:block">
          <TabsList className="bg-slate-800/50 p-1 gap-1">
            <TabsTrigger value="members" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-slate-400 px-3 py-1.5">
              <Users className="w-4 h-4 mr-2" />
              Members
            </TabsTrigger>
            <TabsTrigger value="guests" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-slate-400 px-3 py-1.5">
              <UserPlus className="w-4 h-4 mr-2" />
              Guests
            </TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-slate-400 px-3 py-1.5">
              <Filter className="w-4 h-4 mr-2" />
              Groups
            </TabsTrigger>
            <TabsTrigger value="tournament" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-slate-400 px-3 py-1.5">
              <Trophy className="w-4 h-4 mr-2" />
              Tournament
            </TabsTrigger>
            <TabsTrigger value="standings" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-slate-400 px-3 py-1.5">
              <Table className="w-4 h-4 mr-2" />
              Standings
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-slate-400 px-3 py-1.5">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <main className="p-4 max-w-7xl mx-auto">
        {activeTab === 'members' && (
          <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 h-10"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Select value={filterGroup} onValueChange={setFilterGroup}>
                  <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700 h-10">
                    <SelectValue placeholder="All Groups" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Groups</SelectItem>
                    {state.groups.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v: 'name' | 'group') => setSortBy(v)}>
                  <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700 h-10">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="name">Sort by Name</SelectItem>
                    <SelectItem value="group">Sort by Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons - Organized in groups */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Primary Actions */}
              <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-600 hover:bg-orange-700 h-9">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Add Member</DialogTitle>
                    <DialogDescription className="text-slate-400">Add a new member to the roster</DialogDescription>
                  </DialogHeader>
                  <AddMemberForm 
                    groups={state.groups} 
                    onAdd={(fn, ln, g) => {
                      addMember(fn, ln, g)
                      setShowAddMember(false)
                    }} 
                  />
                </DialogContent>
              </Dialog>

              <Dialog open={showBulkAdd} onOpenChange={setShowBulkAdd}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-700 h-9">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Import CSV
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Import from CSV</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Format: FirstName,LastName,GroupID (one per line)
                    </DialogDescription>
                  </DialogHeader>
                  <CSVImportForm onImport={(csv) => {
                    handleCSVImport(csv)
                    setShowBulkAdd(false)
                  }} />
                </DialogContent>
              </Dialog>

              <div className="h-6 w-px bg-slate-700 hidden sm:block" />

              {/* Selection Actions */}
              <div className="flex flex-wrap gap-2">
                {state.groups.slice(0, 4).map(g => (
                  <Button 
                    key={g.id}
                    variant="outline" 
                    size="sm"
                    className="border-slate-700 bg-slate-800/30 hover:bg-slate-700 h-8 text-xs"
                    onClick={() => selectByGroup(g.id)}
                  >
                    {g.name}
                  </Button>
                ))}
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-orange-700 bg-orange-950/30 hover:bg-orange-900/50 text-orange-400 h-8 text-xs"
                  onClick={() => {
                    const nonBoguGroupIds = state.groups.filter(g => g.isNonBogu).map(g => g.id)
                    setState(prev => ({
                      ...prev,
                      members: prev.members.map(m => ({
                        ...m,
                        isParticipating: nonBoguGroupIds.includes(m.group) ? true : m.isParticipating
                      }))
                    }))
                    toast.success('Selected Non-Bogu members')
                  }}
                >
                  Non-Bogu
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={deselectAll}
                  className="h-8 text-xs text-slate-400 hover:text-white"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              </div>

              <div className="h-6 w-px bg-slate-700 hidden sm:block" />

              {/* Utility Actions */}
              <Button 
                variant="outline" 
                size="sm" 
                className="border-emerald-800 text-emerald-400 bg-emerald-950/30 hover:bg-emerald-900/50 h-8"
                onClick={() => {
                  const testMembers = generateTestMembers()
                  setState(prev => ({ ...prev, members: [...prev.members, ...testMembers] }))
                  toast.success(`Added ${testMembers.length} test members`)
                }}
              >
                <Plus className="w-3 h-3 mr-1" />
                Test Data
              </Button>

              <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-red-900 text-red-400 bg-red-950/30 hover:bg-red-900/50 h-8">
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Clear All Members?</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      This will permanently delete all {state.members.length} members. This cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={clearAllMembers}>Clear All</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Members List */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <div className="divide-y divide-slate-800">
                    {filteredMembers.map(member => {
                       const group = getGroupById(member.group)
                       return (
                         <div 
                           key={member.id}
                           className="flex items-center gap-4 px-4 py-3 hover:bg-slate-800/50 transition-colors"
                         >
                           <Checkbox
                             checked={member.isParticipating}
                             onCheckedChange={() => toggleParticipation(member.id)}
                             className="border-slate-600"
                           />
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2">
                               <span className="text-white font-medium">
                                 {member.lastName}, {member.firstName}
                               </span>
                               {member.isGuest && (
                                 <Badge className="bg-purple-900/50 text-purple-300 text-[10px] px-1.5 py-0">Guest</Badge>
                               )}
                             </div>
                             {member.guestDojo && (
                               <span className="text-xs text-slate-500">{member.guestDojo}</span>
                             )}
                           </div>
                           <Badge 
                             variant="outline" 
                             className={`text-xs ${group?.isNonBogu ? 'border-orange-600 text-orange-400 bg-orange-950/30' : 'border-slate-600 text-slate-400'}`}
                           >
                             {group?.name || member.group}
                           </Badge>
                           <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => deleteMember(member.id)}
                             className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-950/30"
                           >
                             <Trash2 className="w-4 h-4" />
                           </Button>
                         </div>
                       )
                     })}
                    {filteredMembers.length === 0 && (
                      <div className="p-12 text-center text-slate-500">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No members found</p>
                        <p className="text-sm mt-1">Add members or load test data to get started</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'guests' && (
          <GuestsManager
            state={state}
            onAddGuest={addGuestMember}
            groups={state.groups}
          />
        )}

        {activeTab === 'groups' && (
          <GroupsManager state={state} setState={setState} />
        )}

        {activeTab === 'tournament' && (
          <TournamentManager
            state={state}
            setState={setState}
            getMemberById={getMemberById}
            getGroupById={getGroupById}
            generateTournament={generateTournament}
            refreshTournamentParticipants={refreshTournamentParticipants}
            archiveTournament={archiveTournament}
          />
        )}

        {activeTab === 'standings' && (
          <StandingsView state={state} getMemberById={getMemberById} getGroupById={getGroupById} />
        )}

        {activeTab === 'history' && (
          <HistoryView state={state} setState={setState} />
        )}
      </main>
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
      <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Group Settings</CardTitle>
          <CardDescription className="text-slate-300">
            Configure groups and their tournament rules. Non-bogu groups use hantei judging (no draws - 3 shinpan = always a winner).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="New group name..."
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              className="bg-slate-800 border-slate-600 focus:border-orange-500"
            />
            <Button onClick={addGroup} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Group
            </Button>
          </div>

          <Separator className="bg-slate-700/50" />

          <div className="space-y-3">
            {state.groups.map(group => {
              const memberCount = state.members.filter(m => m.group === group.id).length
              return (
                <div 
                  key={group.id}
                  className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-lg"
                >
                  {editingGroup?.id === group.id ? (
                    <Input
                      value={editingGroup.name}
                      onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
                      className="bg-slate-600/50 border-slate-600 flex-1"
                      autoFocus
                    />
                  ) : (
                    <div className="flex-1">
                      <span className="text-white font-medium">{group.name}</span>
                      <span className="text-slate-400 ml-2 text-sm">({memberCount} members)</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Label className="text-slate-300 text-sm">Non-Bogu</Label>
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
                        className="h-8 w-8 text-slate-300"
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
                        className="h-8 w-8 text-slate-300 hover:text-white"
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

      <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white text-lg">Tournament Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-slate-300">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800/40 rounded-lg">
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

  const moveMatchInQueue = (matchId: string, direction: 'up' | 'down') => {
    if (!tournament) return
    const matches = [...tournament.matches]
    const idx = matches.findIndex(m => m.id === matchId)
    if (idx === -1) return
    
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= matches.length) return
    
    [matches[idx], matches[newIdx]] = [matches[newIdx], matches[idx]]
    matches.forEach((m, i) => m.orderIndex = i)
    
    setState(prev => ({
      ...prev,
      currentTournament: { ...tournament, matches }
    }))
  }

  if (!tournament || !tournament.groupOrder) {
    return (
      <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Tournament Setup</CardTitle>
          <CardDescription className="text-slate-300">
            Generate a round-robin tournament. You can generate before selecting participants, then refresh to add them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 bg-slate-800/40 hover:bg-slate-600/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700/50 border-slate-600 bg-slate-800/40 hover:bg-slate-600/50">
                  {MONTHS.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Year</Label>
              <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 bg-slate-800/40 hover:bg-slate-600/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700/50 border-slate-600 bg-slate-800/40 hover:bg-slate-600/50">
                  {[2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
              <div className="text-3xl font-bold text-white">{state.members.length}</div>
              <div className="text-sm text-slate-300">Total Members</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
              <div className="text-3xl font-bold text-orange-400">
                {state.members.filter(m => m.isParticipating).length}
              </div>
              <div className="text-sm text-slate-300">Participating</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
              <div className="text-3xl font-bold text-white">{state.groups.length}</div>
              <div className="text-sm text-slate-300">Groups</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
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
              <div className="text-sm text-slate-300">Est. Matches</div>
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
                    className={`${g.isNonBogu ? 'border-orange-500 text-orange-400' : 'border-slate-600 text-slate-300'}`}
                  >
                    {g.name}: {count}
                  </Badge>
                )
              })}
            </div>
          </div>

          <Button 
            onClick={() => generateTournament(selectedMonth, selectedYear)}
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
  const isComplete = completedMatches === totalMatches
  const courtAMatches = (tournament.matches || []).filter(m => m.court === 'A')
  const courtBMatches = (tournament.matches || []).filter(m => m.court === 'B')

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">{tournament.name}</CardTitle>
              <CardDescription className="text-slate-300">
                {tournament.month} {tournament.year} • {tournament.status}
              </CardDescription>
            </div>
            <Badge className={
              tournament.status === 'setup' ? 'bg-yellow-600' :
              tournament.status === 'in_progress' ? 'bg-green-600' :
              'bg-slate-600/50'
            }>
              {tournament.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Progress value={(completedMatches / totalMatches) * 100} className="flex-1" />
            <span className="text-slate-300 text-sm">{completedMatches}/{totalMatches} matches</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-400">{courtAMatches.length}</div>
              <div className="text-sm text-slate-300">Court A Matches</div>
            </div>
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-slate-200">{courtBMatches.length}</div>
              <div className="text-sm text-slate-300">Court B Matches</div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {tournament.status === 'setup' && (
              <>
                <Button onClick={startTournament} className="bg-emerald-600 hover:bg-emerald-700">
                  <Play className="w-4 h-4 mr-2" />
                  Start Tournament
                </Button>
                <Button onClick={refreshTournamentParticipants} variant="outline" className="border-slate-600 bg-slate-800/40 hover:bg-slate-600/50">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Participants
                </Button>
              </>
            )}
            {tournament.status === 'in_progress' && !isComplete && (
              <>
                <Badge variant="outline" className="border-emerald-500/60 text-emerald-400 bg-emerald-900/20 px-4 py-2">
                  Tournament In Progress
                </Badge>
                <Button onClick={refreshTournamentParticipants} variant="outline" className="border-slate-600 bg-slate-800/40 hover:bg-slate-600/50">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Update Participants
                </Button>
              </>
            )}
            {isComplete && (
              <Button onClick={archiveTournament} className="bg-orange-600 hover:bg-orange-700">
                <History className="w-4 h-4 mr-2" />
                Archive & Complete
              </Button>
            )}
            <Button variant="outline" onClick={clearTournament} className="border-red-700/60 text-red-400 bg-red-900/20 hover:bg-red-800/40 hover:border-red-600">
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
          <Card key={groupId} className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                {group?.name || groupId}
                {group?.isNonBogu && <Badge className="bg-orange-900 text-orange-200">Hantei</Badge>}
                <Badge variant="outline" className="border-slate-600 text-slate-300 ml-auto">
                  {groupMatches.filter(m => m.status === 'completed').length}/{groupMatches.length}
                </Badge>
              </CardTitle>
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
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          match.status === 'completed' ? 'bg-slate-700/20' :
                          match.status === 'in_progress' ? 'bg-emerald-900/20 border border-emerald-800' :
                          'bg-slate-800/40'
                        }`}
                      >
                        <span className="text-slate-400 w-6">#{idx + 1}</span>
                        <Badge className={match.court === 'A' ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'}>
                          {match.court}
                        </Badge>
                        <div className="flex-1 flex items-center justify-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                            <span className={`${match.winner === 'player1' ? 'text-red-400 font-semibold' : 'text-white'} font-medium`}>
                              {p1?.firstName || '?'} {p1?.lastName || '?'}
                            </span>
                            {match.status !== 'pending' && !match.isHantei && (
                              <span className="text-red-400 font-mono text-sm">({match.player1Score.length})</span>
                            )}
                          </div>
                          <span className="text-slate-400 mx-3">vs</span>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-white inline-block"></span>
                            <span className={`${match.winner === 'player2' ? 'text-slate-200 font-semibold' : 'text-white'} font-medium`}>
                              {p2?.firstName || '?'} {p2?.lastName || '?'}
                            </span>
                            {match.status !== 'pending' && !match.isHantei && (
                              <span className="text-slate-300 font-mono text-sm">({match.player2Score.length})</span>
                            )}
                          </div>
                        </div>
                        {(tournament.status === 'setup' || (tournament.status === 'in_progress' && match.status === 'pending')) && (
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 h-8 w-8" onClick={() => swapMatchCourt(match.id)} title="Swap court">
                              <ArrowLeftRight className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 h-8 w-8" onClick={() => moveMatchInQueue(match.id, 'up')}>
                              <ChevronLeft className="w-3 h-3 rotate-90" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 h-8 w-8" onClick={() => moveMatchInQueue(match.id, 'down')}>
                              <ChevronRight className="w-3 h-3 rotate-90" />
                            </Button>
                          </div>
                        )}
                        {match.status === 'completed' && (
                          <Badge variant="outline" className={match.winner === 'player1' ? 'border-red-600 bg-red-950/50 text-red-400' : match.winner === 'player2' ? 'border-slate-400 bg-blue-950/50 text-slate-200' : 'border-slate-600'}>
                            {match.winner === 'draw' ? 'Draw' : 
                             match.winner === 'player1' ? `Win ${match.isHantei ? '(判定)' : match.player1Score.length + '-' + match.player2Score.length}` :
                             `Win ${match.isHantei ? '(判定)' : match.player1Score.length + '-' + match.player2Score.length}`}
                          </Badge>
                        )}
                        {match.status === 'in_progress' && (
                          <Badge className="bg-emerald-600 animate-pulse">Live</Badge>
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
      <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
        <CardContent className="p-8 text-center text-slate-400">
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
          className={selectedGroup === 'all' ? 'bg-amber-600' : 'border-slate-700'}
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
              className={selectedGroup === gId ? 'bg-amber-600' : 'border-slate-700'}
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
          <Card key={groupId} className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
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
                    <tr className="border-b border-slate-600 bg-slate-800/40 hover:bg-slate-600/50">
                      <th className="text-left text-slate-300 p-2 font-medium">#</th>
                      <th className="text-left text-slate-300 p-2 font-medium">Name</th>
                      <th className="text-center text-slate-300 p-2 font-medium">Pts</th>
                      <th className="text-center text-slate-300 p-2 font-medium">W</th>
                      {!group?.isNonBogu && <th className="text-center text-slate-300 p-2 font-medium">D</th>}
                      <th className="text-center text-slate-300 p-2 font-medium">L</th>
                      {!group?.isNonBogu && <th className="text-center text-slate-300 p-2 font-medium">Ippons</th>}
                      {groupMembers.map(m => (
                        <th key={m.id} className="text-center text-slate-300 p-2 font-medium text-xs">
                          {m.firstName.charAt(0)}{m.lastName.charAt(0)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((standing, idx) => (
                      <tr key={standing.playerId} className="border-b border-slate-800 hover:bg-slate-800/40">
                        <td className="p-2 text-slate-400">{idx + 1}</td>
                        <td className="p-2 text-white font-medium">{standing.playerName}</td>
                        <td className="p-2 text-center text-orange-400 font-bold">{standing.points}</td>
                        <td className="p-2 text-center text-green-400">{standing.wins}</td>
                        {!group?.isNonBogu && <td className="p-2 text-center text-slate-300">{standing.draws}</td>}
                        <td className="p-2 text-center text-red-400">{standing.losses}</td>
                        {!group?.isNonBogu && (
                          <td className="p-2 text-center text-slate-300">
                            {standing.ipponsScored}-{standing.ipponsAgainst}
                          </td>
                        )}
                        {groupMembers.map(m => {
                          if (m.id === standing.playerId) {
                            return <td key={m.id} className="p-2 text-center text-slate-600">-</td>
                          }
                          const result = standing.results.get(m.id)
                          let className = 'p-2 text-center '
                          if (result === 'W') className += 'text-green-400 bg-green-900/20'
                          else if (result === 'L') className += 'text-red-400 bg-red-900/20'
                          else if (result === 'D') className += 'text-slate-300 bg-slate-700/50'
                          else className += 'text-slate-600'
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
      <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
        <CardContent className="p-8 text-center text-slate-400">
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
            <Button variant="outline" className="border-slate-600 bg-slate-800/40 hover:bg-slate-600/50">
              <Upload className="w-4 h-4 mr-2" />
              Import Past History
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Import Tournament History</DialogTitle>
              <DialogDescription className="text-slate-300">
                Import past tournament data from CSV/Excel. Format: Month,Year,GroupName,Rank,PlayerName,Points,Wins,Losses,Draws
              </DialogDescription>
            </DialogHeader>
            <HistoryImportForm onImport={handleExcelImport} />
          </DialogContent>
        </Dialog>
      </div>

      {history.map(entry => (
        <Card key={entry.id} className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">{entry.name}</CardTitle>
                <CardDescription className="text-slate-300">{entry.date}</CardDescription>
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
                <div key={result.groupId} className="bg-slate-800/40 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-white font-medium">{result.groupName}</h4>
                    {result.isNonBogu && <Badge className="bg-orange-900 text-orange-200 text-xs">Hantei</Badge>}
                  </div>
                  <div className="space-y-2">
                    {result.standings.slice(0, 3).map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className={`w-6 text-center font-bold ${
                          idx === 0 ? 'text-orange-400' :
                          idx === 1 ? 'text-slate-300' :
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
          className="bg-slate-800 border-slate-600 focus:border-orange-500"
        />
      </div>
      <div className="space-y-2">
        <Label>Or paste data</Label>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          className="w-full h-40 bg-slate-700/50 border border-slate-700 rounded-md p-3 text-white text-sm font-mono"
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
          className="bg-slate-800 border-slate-600 focus:border-orange-500"
          placeholder="Enter first name"
        />
      </div>
      <div className="space-y-2">
        <Label>Last Name</Label>
        <Input 
          value={lastName} 
          onChange={(e) => setLastName(e.target.value)}
          className="bg-slate-800 border-slate-600 focus:border-orange-500"
          placeholder="Enter last name"
        />
      </div>
      <div className="space-y-2">
        <Label>Group</Label>
        <Select value={group} onValueChange={setGroup}>
          <SelectTrigger className="bg-slate-700/50 border-slate-600 bg-slate-800/40 hover:bg-slate-600/50">
            <SelectValue placeholder="Select group" />
          </SelectTrigger>
          <SelectContent className="bg-slate-700/50 border-slate-600 bg-slate-800/40 hover:bg-slate-600/50">
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
          className="bg-slate-800 border-slate-600 focus:border-orange-500"
        />
      </div>
      <div className="space-y-2">
        <Label>Or paste CSV content</Label>
        <textarea
          value={csvText}
          onChange={(e) => setCSVText(e.target.value)}
          className="w-full h-40 bg-slate-700/50 border border-slate-700 rounded-md p-3 text-white text-sm font-mono"
          placeholder="FirstName,LastName,Group&#10;John,Doe,A&#10;Jane,Smith,B"
        />
      </div>
      <DialogFooter>
        <Button 
          onClick={() => onImport(csvText)}
          className="bg-orange-600 hover:bg-orange-700"
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
      <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Guest Registry</CardTitle>
          <CardDescription className="text-slate-300">
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
              <DialogContent className="bg-slate-800/40 border-slate-700/50 backdrop-blur-sm">
                <DialogHeader>
                  <DialogTitle className="text-white">Add Guest</DialogTitle>
                  <DialogDescription className="text-slate-300">Add a guest from another dojo</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name *</Label>
                      <Input 
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        className="bg-slate-800 border-slate-600 focus:border-orange-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name *</Label>
                      <Input 
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        className="bg-slate-800 border-slate-600 focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Dojo</Label>
                    <Input 
                      value={dojo}
                      onChange={e => setDojo(e.target.value)}
                      className="bg-slate-800 border-slate-600 focus:border-orange-500"
                      placeholder="Guest's home dojo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Group *</Label>
                    <Select value={group} onValueChange={setGroup}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 bg-slate-800/40 hover:bg-slate-600/50">
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700/50 border-slate-600 bg-slate-800/40 hover:bg-slate-600/50">
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
                <div className="text-center text-slate-400 py-8">No guests in registry</div>
              ) : (
                state.guestRegistry.map(guest => {
                  const alreadyAdded = state.members.some(
                    m => m.firstName === guest.firstName && m.lastName === guest.lastName && m.isGuest
                  )
                  return (
                    <div 
                      key={guest.id}
                      className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg"
                    >
                      <div>
                        <span className="text-white">{guest.firstName} {guest.lastName}</span>
                        {guest.guestDojo && (
                          <span className="text-slate-400 text-sm ml-2">({guest.guestDojo})</span>
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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center p-4">
        <Toaster theme="dark" position="top-center" />
        <Card className="bg-slate-900 border-slate-700 max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-white text-center">No Active Tournament</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <img src="/renbu-logo.png" alt="Renbu" className="w-20 h-20 mx-auto opacity-50" />
            <p className="text-slate-300">
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
    { id: 1, name: 'Men', short: 'M', color: 'bg-blue-600 hover:bg-blue-700' },
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
          <h3 className={`font-semibold ${court === 'A' ? 'text-red-400' : 'text-slate-200'}`}>
            Court {court} ({pendingMatches.length} pending)
          </h3>
        </div>
        <ScrollArea className="h-[280px]">
          <div className="space-y-2 pr-2">
            {pendingMatches.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-4">No pending matches</p>
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
                    isCurrent ? 'bg-emerald-900/30 border border-emerald-700' : 'bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-400 text-xs">#{idx + 1}</span>
                    <Badge variant="outline" className="text-xs border-slate-400 bg-slate-800/40 hover:bg-slate-600/50">{matchGroup?.name || '?'}</Badge>
                    {isCurrent && <Circle className="w-3 h-3 text-emerald-500 animate-pulse ml-auto" />}
                  </div>
                  <div className="text-sm text-white text-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                    <span className="font-medium ml-1">{p1?.firstName || '?'} {p1?.lastName?.charAt(0) || ''}.</span>
                    <span className="text-slate-400 mx-2">vs</span>
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
                <Separator className="my-2 bg-slate-600/50" />
                <p className="text-xs text-slate-400">Completed ({completedMatches.length})</p>
                {completedMatches.slice(-5).reverse().map(match => {
                  const p1 = getMemberById(match.player1Id)
                  const p2 = getMemberById(match.player2Id)
                  return (
                    <div key={match.id} className="p-2 bg-slate-700/20 rounded text-sm text-center">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                      <span className={match.winner === 'player1' ? 'text-emerald-400 font-semibold ml-1' : 'text-white ml-1'}>
                        {p1?.firstName || '?'} {p1?.lastName?.charAt(0) || ''}.
                      </span>
                      <span className="text-slate-400 mx-2">vs</span>
                      <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
                      <span className={match.winner === 'player2' ? 'text-emerald-400 font-semibold ml-1' : 'text-white ml-1'}>
                        {p2?.firstName || '?'} {p2?.lastName?.charAt(0) || ''}.
                      </span>
                      <span className="text-slate-300 ml-2">
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
        <DialogContent className="bg-slate-900 border-slate-600 bg-slate-800/40 hover:bg-slate-600/50">
          <DialogHeader>
            <DialogTitle className="text-white text-center text-2xl">Match Winner!</DialogTitle>
          </DialogHeader>
          <div className={`p-8 rounded-lg text-center ${winnerColor === 'red' ? 'bg-red-900/30 border-2 border-red-600' : 'bg-slate-600/30 border-2 border-slate-400'}`}>
            <Award className={`w-16 h-16 mx-auto mb-4 ${winnerColor === 'red' ? 'text-red-400' : 'text-slate-200'}`} />
            <p className={`text-3xl font-bold ${winnerColor === 'red' ? 'text-red-400' : 'text-slate-200'}`}>
              {winnerPlayer?.firstName} {winnerPlayer?.lastName}
            </p>
            <p className="text-slate-300 mt-2">{winnerColor === 'red' ? 'AKA' : 'SHIRO'} Wins!</p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowWinnerPrompt({ show: false, winner: null })}>
              Continue Match
            </Button>
            <Button 
              onClick={() => completeMatch(showWinnerPrompt.winner!)}
              className={winnerColor === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-600/50 hover:bg-slate-500'}
            >
              Complete Match
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
      <Toaster theme="dark" position="top-center" />
      <WinnerPromptDialog />
      
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700/50 backdrop-blur-md px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/renbu-logo.png" alt="Renbu" className="w-8 h-8" />
            <h1 className="text-xl font-bold text-white">Courtkeeper</h1>
            <Badge className={selectedCourt === 'A' ? 'bg-red-600' : 'bg-slate-600/50'}>
              Court {selectedCourt}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={selectedCourt === 'A' ? 'default' : 'outline'}
              onClick={() => setSelectedCourt('A')}
              className={selectedCourt === 'A' ? 'bg-red-600 hover:bg-red-700' : 'border-slate-600'}
            >
              Court A
            </Button>
            <Button
              size="sm"
              variant={selectedCourt === 'B' ? 'default' : 'outline'}
              onClick={() => setSelectedCourt('B')}
              className={selectedCourt === 'B' ? 'bg-slate-600/50 hover:bg-slate-500' : 'border-slate-600'}
            >
              Court B
            </Button>
            <Button variant="ghost" className="h-8 w-8" size="sm" onClick={onSwitchPortal}>Exit</Button>
          </div>
        </div>
      </header>

      <main className={`p-4 ${!isMobile ? 'mr-80' : ''}`}>
        {!currentMatch ? (
          <Card className="bg-slate-800 border-slate-600 bg-slate-800/40 hover:bg-slate-600/50">
            <CardContent className="p-8 text-center">
              <Trophy className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <p className="text-white text-xl">
                {currentMatches.length === 0 
                  ? `No matches assigned to Court ${selectedCourt}`
                  : `All Court ${selectedCourt} matches complete!`}
              </p>
              <p className="text-slate-300 mt-2">
                {currentMatches.length === 0 
                  ? "Matches may be assigned to the other court"
                  : "Switch to the other court or view results"}
              </p>
              <div className="flex justify-center gap-4 mt-4">
                <Button
                  onClick={() => setSelectedCourt(selectedCourt === 'A' ? 'B' : 'A')}
                  className={selectedCourt === 'A' ? 'bg-slate-600/50 hover:bg-slate-500' : 'bg-red-600 hover:bg-red-700'}
                >
                  Switch to Court {selectedCourt === 'A' ? 'B' : 'A'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Timer Section */}
            <Card className={`bg-slate-800 border-2 mb-4 ${
              timerSeconds >= state.timerTarget ? 'border-red-600 animate-pulse' : 'border-slate-700'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-slate-300" />
                    <span className="text-slate-300">
                      {isHantei ? 'Hantei Match (3 min)' : 'Regular Match (3 min)'}
                    </span>
                  </div>
                  <Badge variant="outline" className="border-slate-400/60 bg-slate-800/50 border border-slate-700/30 bg-slate-800/40 hover:bg-slate-600/50">
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
                    className={timerRunning ? 'bg-orange-600 hover:bg-orange-700' : 'bg-emerald-600 hover:bg-emerald-700'}
                  >
                    {timerRunning ? <Pause className="w-5 h-5 mr-2 w-5 h-5 mr-2" /> : <Play />}
                    {timerRunning ? 'Pause' : 'Start'}
                  </Button>
                  <Button size="lg" variant="outline" onClick={resetTimer} className="border-slate-400 bg-slate-800/40 hover:bg-slate-600/50">
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Scoring Section */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Player 1 (Red/Aka) */}
              <Card className="bg-slate-800 border-2 border-red-800">
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
                                className={`${scoreType?.color || 'bg-slate-600/50'} cursor-pointer`}
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
                          className="border-slate-600 h-14"
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
              <Card className="bg-slate-800 border-2 border-slate-400">
                <CardHeader className="pb-2 bg-slate-700/30">
                  <CardTitle className="text-slate-200 text-center flex items-center justify-center gap-2">
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
                      className="w-full h-24 text-2xl bg-slate-600/50 hover:bg-slate-500"
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
                                className={`${scoreType?.color || 'bg-slate-600/50'} cursor-pointer`}
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
                          className="border-slate-600 h-14"
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
              <Card className="bg-slate-800 border-slate-600 bg-slate-800/40 hover:bg-slate-600/50">
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
                      className="border-slate-600 h-14"
                    >
                      Draw
                    </Button>
                    <Button
                      size="lg"
                      onClick={() => completeMatch('player2')}
                      className="bg-slate-600/50 hover:bg-slate-500 h-14"
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
        <aside className="fixed right-0 top-0 w-80 h-screen bg-slate-900 border-l border-slate-700 pt-14 overflow-y-auto">
          <div className="p-4 space-y-6">
            {renderCourtQueue('A', courtAMatches)}
            <Separator className="bg-slate-600/50" />
            {renderCourtQueue('B', courtBMatches)}
          </div>
        </aside>
      )}

      {/* Court Queue Sheet (Mobile) */}
      {isMobile && (
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              className="fixed bottom-4 right-4 rounded-full w-14 h-14 bg-orange-600 hover:bg-orange-700 shadow-lg"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-slate-900 border-slate-600 backdrop-blur-md h-[70vh]">
            <SheetHeader>
              <SheetTitle className="text-white">Match Queues</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4 overflow-y-auto">
              {renderCourtQueue('A', courtAMatches)}
              <Separator className="bg-slate-600/50" />
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

