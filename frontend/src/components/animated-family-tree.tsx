'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { 
  Users, 
  User, 
  Heart, 
  Plus, 
  Search, 
  Filter, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Key,
  Crown,
  Baby,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Camera,
  Edit,
  Trash2,
  Link,
  UserPlus,
  TreePine,
  Star,
  Shield
} from 'lucide-react'
import LegacyTokenSystem from './legacy-token-system'

interface FamilyMember {
  id: string
  name: string
  birthDate?: string
  deathDate?: string
  birthPlace?: string
  photo?: string
  relationship: string
  generation: number
  position: { x: number; y: number }
  parents?: string[]
  children?: string[]
  spouse?: string
  isDeceased: boolean
  hasLegacyToken: boolean
  legacyTokenUsed?: boolean
  bio?: string
  occupation?: string
  achievements?: string[]
  memories: number
  isPatriarch?: boolean
  isMatriarch?: boolean
}

interface Connection {
  id: string
  from: string
  to: string
  type: 'parent' | 'spouse' | 'child'
  color: string
}

interface AnimatedFamilyTreeProps {
  isOpen: boolean
  onClose: () => void
  members: FamilyMember[]
}

export default function AnimatedFamilyTree({ isOpen, onClose, members: initialMembers }: AnimatedFamilyTreeProps) {
  const [members, setMembers] = useState<FamilyMember[]>(initialMembers || [])
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterGeneration, setFilterGeneration] = useState<number | 'all'>('all')
  const [showDeceased, setShowDeceased] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [treePosition, setTreePosition] = useState({ x: 0, y: 0 })
  const [showLegacySystem, setShowLegacySystem] = useState(false)
  const [addingMember, setAddingMember] = useState(false)
  
  const treeRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Mock data for demonstration
  useEffect(() => {
    if (!initialMembers || initialMembers.length === 0) {
      setMembers([
        {
          id: '1',
          name: 'Robert Smith',
          birthDate: '1925-03-15',
          deathDate: '2010-08-22',
          birthPlace: 'Springfield, IL',
          relationship: 'Great Grandfather',
          generation: 1,
          position: { x: 400, y: 50 },
          children: ['2', '3'],
          isDeceased: true,
          hasLegacyToken: true,
          legacyTokenUsed: true,
          bio: 'World War II veteran and beloved family patriarch',
          occupation: 'Factory Foreman',
          achievements: ['Purple Heart', 'Community Leader'],
          memories: 45,
          isPatriarch: true
        },
        {
          id: '2',
          name: 'Mary Smith',
          birthDate: '1950-07-10',
          birthPlace: 'Springfield, IL',
          relationship: 'Grandmother',
          generation: 2,
          position: { x: 200, y: 200 },
          parents: ['1'],
          children: ['4', '5'],
          spouse: '6',
          isDeceased: false,
          hasLegacyToken: true,
          bio: 'Retired teacher and family historian',
          occupation: 'Elementary School Teacher',
          achievements: ['Teacher of the Year 1985', 'Community Volunteer'],
          memories: 78,
          isMatriarch: true
        },
        {
          id: '3',
          name: 'John Smith',
          birthDate: '1952-11-20',
          birthPlace: 'Springfield, IL',
          relationship: 'Uncle',
          generation: 2,
          position: { x: 600, y: 200 },
          parents: ['1'],
          children: ['7'],
          spouse: '8',
          isDeceased: false,
          hasLegacyToken: true,
          bio: 'Successful businessman and family supporter',
          occupation: 'Business Owner',
          memories: 32
        },
        {
          id: '4',
          name: 'David Smith',
          birthDate: '1975-04-05',
          birthPlace: 'Chicago, IL',
          relationship: 'Father',
          generation: 3,
          position: { x: 100, y: 350 },
          parents: ['2', '6'],
          children: ['9'],
          spouse: '10',
          isDeceased: false,
          hasLegacyToken: true,
          bio: 'Software engineer and devoted father',
          occupation: 'Software Engineer',
          memories: 156
        },
        {
          id: '5',
          name: 'Sarah Johnson',
          birthDate: '1978-09-12',
          birthPlace: 'Chicago, IL',
          relationship: 'Aunt',
          generation: 3,
          position: { x: 300, y: 350 },
          parents: ['2', '6'],
          children: ['11', '12'],
          spouse: '13',
          isDeceased: false,
          hasLegacyToken: true,
          bio: 'Doctor and medical researcher',
          occupation: 'Pediatrician',
          memories: 89
        },
        {
          id: '6',
          name: 'William Smith',
          birthDate: '1948-12-03',
          deathDate: '2018-06-15',
          birthPlace: 'Springfield, IL',
          relationship: 'Grandfather',
          generation: 2,
          position: { x: 200, y: 150 },
          children: ['4', '5'],
          spouse: '2',
          isDeceased: true,
          hasLegacyToken: true,
          legacyTokenUsed: true,
          bio: 'Korean War veteran and loving grandfather',
          occupation: 'Mechanic',
          memories: 67
        },
        {
          id: '9',
          name: 'You',
          birthDate: '2000-01-15',
          birthPlace: 'Chicago, IL',
          relationship: 'Self',
          generation: 4,
          position: { x: 100, y: 500 },
          parents: ['4', '10'],
          isDeceased: false,
          hasLegacyToken: true,
          bio: 'Current family member creating memories',
          occupation: 'Student',
          memories: 234
        }
      ])

      // Generate connections
      setConnections([
        { id: 'c1', from: '1', to: '2', type: 'parent', color: '#2563EB' },
        { id: 'c2', from: '1', to: '3', type: 'parent', color: '#2563EB' },
        { id: 'c3', from: '2', to: '6', type: 'spouse', color: '#EC4899' },
        { id: 'c4', from: '2', to: '4', type: 'parent', color: '#2563EB' },
        { id: 'c5', from: '2', to: '5', type: 'parent', color: '#2563EB' },
        { id: 'c6', from: '6', to: '4', type: 'parent', color: '#2563EB' },
        { id: 'c7', from: '6', to: '5', type: 'parent', color: '#2563EB' },
        { id: 'c8', from: '4', to: '9', type: 'parent', color: '#2563EB' }
      ])
    }
  }, [initialMembers])

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.occupation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.bio?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesGeneration = filterGeneration === 'all' || member.generation === filterGeneration
    const matchesDeceased = showDeceased || !member.isDeceased
    
    return matchesSearch && matchesGeneration && matchesDeceased
  })

  const handleZoom = (direction: 'in' | 'out') => {
    setZoomLevel(prev => {
      const newZoom = direction === 'in' ? prev * 1.2 : prev / 1.2
      return Math.max(0.5, Math.min(3, newZoom))
    })
  }

  const resetView = () => {
    setZoomLevel(1)
    setTreePosition({ x: 0, y: 0 })
  }

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setTreePosition(prev => ({
      x: prev.x + info.delta.x,
      y: prev.y + info.delta.y
    }))
  }

  const addFamilyMember = () => {
    setAddingMember(true)
  }

  const getMemberIcon = (member: FamilyMember) => {
    if (member.isPatriarch) return <Crown className="w-4 h-4 text-yellow-600" />
    if (member.isMatriarch) return <Crown className="w-4 h-4 text-pink-600" />
    if (member.generation === 4) return <Baby className="w-4 h-4 text-blue-600" />
    return <User className="w-4 h-4" />
  }

  const getGenerationColor = (generation: number) => {
    const colors = [
      '#7C3AED', // Purple - Generation 1
      '#2563EB', // Blue - Generation 2  
      '#10B981', // Emerald - Generation 3
      '#F59E0B', // Amber - Generation 4
      '#EC4899', // Pink - Generation 5
    ]
    return colors[generation - 1] || '#6B7280'
  }

  if (!isOpen) return null

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="absolute inset-4 bg-gradient-to-br from-charcoal via-obsidian to-charcoal rounded-2xl shadow-2xl border border-gold-500/30 overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-gold-600/20 via-gold-500/20 to-gold-600/20 border-b border-gold-500/30 p-6 text-pearl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.div
                  className="w-12 h-12 bg-gold-500/20 border border-gold-500/30 rounded-full flex items-center justify-center"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <TreePine className="w-6 h-6 text-gold-400" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-gold-400">Family Tree</h2>
                  <p className="text-pearl/70">{filteredMembers.length} family members</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={() => setShowLegacySystem(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gold-500/20 border border-gold-500/30 rounded-lg hover:bg-gold-500/30 transition-colors text-gold-400"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Key className="w-4 h-4" />
                  <span>Legacy Tokens</span>
                </motion.button>
                
                <button
                  onClick={onClose}
                  className="w-8 h-8 bg-gold-500/20 border border-gold-500/30 rounded-full flex items-center justify-center hover:bg-gold-500/30 transition-colors text-gold-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-obsidian-800/40 border-b border-gold-500/20 p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gold-400" />
                <input
                  type="text"
                  placeholder="Search family members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-obsidian-900/60 border border-gold-500/20 rounded-lg text-gold-100 placeholder-gold-400/40 focus:ring-2 focus:ring-gold-400/20 focus:border-gold-400/60"
                />
              </div>

              {/* Generation Filter */}
              <select
                value={filterGeneration}
                onChange={(e) => setFilterGeneration(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="px-3 py-2 bg-obsidian-900/60 border border-gold-500/20 rounded-lg text-gold-100 focus:ring-2 focus:ring-gold-400/20 focus:border-gold-400/60"
              >
                <option value="all">All Generations</option>
                <option value={1}>Generation 1</option>
                <option value={2}>Generation 2</option>
                <option value={3}>Generation 3</option>
                <option value={4}>Generation 4</option>
              </select>

              {/* Show Deceased Toggle */}
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showDeceased}
                  onChange={(e) => setShowDeceased(e.target.checked)}
                  className="rounded border-gold-500/30 text-gold-400 focus:ring-gold-400/20"
                />
                <span className="text-sm text-pearl/70">Show Deceased</span>
              </label>

              {/* Zoom Controls */}
              <div className="flex items-center space-x-1 bg-obsidian-900/60 border border-gold-500/20 rounded-lg">
                <button
                  onClick={() => handleZoom('out')}
                  className="p-2 text-gold-400 hover:bg-obsidian-800/40 transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <div className="px-2 py-1 text-sm text-gold-400 border-x border-gold-500/20">
                  {Math.round(zoomLevel * 100)}%
                </div>
                <button
                  onClick={() => handleZoom('in')}
                  className="p-2 text-gold-400 hover:bg-obsidian-800/40 transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={resetView}
                  className="p-2 text-gold-400 hover:bg-obsidian-800/40 transition-colors border-l border-gold-500/20"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Add Member */}
              <motion.button
                onClick={addFamilyMember}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 rounded-lg hover:shadow-lg hover:shadow-gold-400/20 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Member</span>
              </motion.button>
            </div>
          </div>

          {/* Family Tree Canvas */}
          <div ref={containerRef} className="flex-1 overflow-hidden relative bg-gradient-to-br from-obsidian-900 to-charcoal">
            <motion.div
              ref={treeRef}
              className="absolute inset-0 cursor-move"
              drag
              onDrag={handleDrag}
              dragMomentum={false}
              style={{
                scale: zoomLevel,
                x: treePosition.x,
                y: treePosition.y
              }}
            >
              {/* Connection Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {connections.map((connection) => {
                  const fromMember = members.find(m => m.id === connection.from)
                  const toMember = members.find(m => m.id === connection.to)
                  
                  if (!fromMember || !toMember) return null
                  
                  const shouldShow = filteredMembers.includes(fromMember) && filteredMembers.includes(toMember)
                  if (!shouldShow) return null

                  return (
                    <motion.line
                      key={connection.id}
                      x1={fromMember.position.x + 40}
                      y1={fromMember.position.y + 40}
                      x2={toMember.position.x + 40}
                      y2={toMember.position.y + 40}
                      stroke={connection.color}
                      strokeWidth={connection.type === 'spouse' ? 3 : 2}
                      strokeDasharray={connection.type === 'spouse' ? '5,5' : 'none'}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.6 }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  )
                })}
              </svg>

              {/* Family Members */}
              {filteredMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  className="absolute cursor-pointer group"
                  style={{
                    left: member.position.x,
                    top: member.position.y
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                  onClick={() => setSelectedMember(member)}
                  whileHover={{ scale: 1.1, z: 10 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Member Card */}
                  <div className={`w-20 h-20 rounded-full border-4 border-gold-500/30 shadow-lg flex items-center justify-center text-white relative overflow-hidden ${
                    member.isDeceased ? 'opacity-75' : ''
                  }`}
                  style={{ backgroundColor: getGenerationColor(member.generation) }}
                  >
                    {/* Photo or Icon */}
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      getMemberIcon(member)
                    )}

                    {/* Legacy Token Indicator */}
                    {member.hasLegacyToken && (
                      <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                        member.legacyTokenUsed ? 'bg-gold-400' : 'bg-gold-500'
                      }`}>
                        {member.legacyTokenUsed ? (
                          <Shield className="w-3 h-3 text-obsidian-900" />
                        ) : (
                          <Key className="w-3 h-3 text-obsidian-900" />
                        )}
                      </div>
                    )}

                    {/* Deceased Indicator */}
                    {member.isDeceased && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-1 h-8 bg-pearl/80 transform rotate-45"></div>
                      </div>
                    )}

                    {/* Memory Count */}
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center text-xs font-bold text-obsidian-900">
                      {member.memories}
                    </div>
                  </div>

                  {/* Name Label */}
                  <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-center">
                    <div className="bg-obsidian-800/90 border border-gold-500/30 rounded-lg shadow-md px-2 py-1 text-xs font-medium text-gold-300 whitespace-nowrap">
                      {member.name}
                    </div>
                    <div className="text-xs text-gold-400 mt-1">
                      {member.relationship}
                    </div>
                  </div>

                  {/* Hover Details */}
                  <motion.div
                    className="absolute top-28 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-obsidian-800/95 to-charcoal/95 border border-gold-500/30 rounded-lg shadow-xl p-4 min-w-64 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-20"
                    initial={{ y: 10, opacity: 0 }}
                    whileHover={{ y: 0, opacity: 1 }}
                  >
                    <h4 className="font-semibold text-gold-400 mb-2">{member.name}</h4>
                    
                    <div className="space-y-2 text-sm">
                      {member.birthDate && (
                        <div className="flex items-center space-x-2 text-pearl/70">
                          <Calendar className="w-3 h-3 text-gold-400" />
                          <span>
                            Born: {new Date(member.birthDate).toLocaleDateString()}
                            {member.deathDate && ` - ${new Date(member.deathDate).toLocaleDateString()}`}
                          </span>
                        </div>
                      )}
                      
                      {member.birthPlace && (
                        <div className="flex items-center space-x-2 text-pearl/70">
                          <MapPin className="w-3 h-3 text-gold-400" />
                          <span>{member.birthPlace}</span>
                        </div>
                      )}
                      
                      {member.occupation && (
                        <div className="flex items-center space-x-2 text-pearl/70">
                          <User className="w-3 h-3 text-gold-400" />
                          <span>{member.occupation}</span>
                        </div>
                      )}

                      {member.bio && (
                        <p className="text-pearl/70 text-xs mt-2">{member.bio}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gold-500/20">
                      <div className="flex items-center space-x-1 text-xs text-gold-400">
                        <Camera className="w-3 h-3" />
                        <span>{member.memories} memories</span>
                      </div>
                      
                      {member.hasLegacyToken && (
                        <div className={`flex items-center space-x-1 text-xs ${
                          member.legacyTokenUsed ? 'text-gold-400' : 'text-gold-500'
                        }`}>
                          <Key className="w-3 h-3" />
                          <span>{member.legacyTokenUsed ? 'Token Used' : 'Has Token'}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Member Detail Modal */}
          <AnimatePresence>
            {selectedMember && (
              <motion.div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedMember(null)}
              >
                <motion.div
                  className="bg-gradient-to-br from-obsidian-900/95 to-charcoal/95 border border-gold-500/30 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div 
                    className="p-6 text-pearl border-b border-gold-500/30"
                    style={{ background: `linear-gradient(135deg, ${getGenerationColor(selectedMember.generation)}40, ${getGenerationColor(selectedMember.generation)}20)` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gold-500/20 border border-gold-500/30 rounded-full flex items-center justify-center">
                          {selectedMember.photo ? (
                            <img src={selectedMember.photo} alt={selectedMember.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            getMemberIcon(selectedMember)
                          )}
                        </div>
                        <div>
                          <h3 className="text-2xl font-serif font-bold text-gold-400">{selectedMember.name}</h3>
                          <p className="text-pearl/70">{selectedMember.relationship}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedMember(null)}
                        className="w-8 h-8 bg-gold-500/20 border border-gold-500/30 rounded-full flex items-center justify-center hover:bg-gold-500/30 transition-colors text-gold-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gold-400 mb-2">Personal Information</h4>
                          <div className="space-y-2 text-sm">
                            {selectedMember.birthDate && (
                              <div className="flex items-center space-x-2 text-pearl/70">
                                <Calendar className="w-4 h-4 text-gold-400" />
                                <span>
                                  Born: {new Date(selectedMember.birthDate).toLocaleDateString()}
                                  {selectedMember.deathDate && ` - ${new Date(selectedMember.deathDate).toLocaleDateString()}`}
                                </span>
                              </div>
                            )}
                            
                            {selectedMember.birthPlace && (
                              <div className="flex items-center space-x-2 text-pearl/70">
                                <MapPin className="w-4 h-4 text-gold-400" />
                                <span>{selectedMember.birthPlace}</span>
                              </div>
                            )}
                            
                            {selectedMember.occupation && (
                              <div className="flex items-center space-x-2 text-pearl/70">
                                <User className="w-4 h-4 text-gold-400" />
                                <span>{selectedMember.occupation}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {selectedMember.bio && (
                          <div>
                            <h4 className="font-semibold text-gold-400 mb-2">Biography</h4>
                            <p className="text-pearl/70 text-sm">{selectedMember.bio}</p>
                          </div>
                        )}

                        {selectedMember.achievements && selectedMember.achievements.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gold-400 mb-2">Achievements</h4>
                            <div className="space-y-1">
                              {selectedMember.achievements.map((achievement, index) => (
                                <div key={index} className="flex items-center space-x-2 text-sm text-pearl/70">
                                  <Star className="w-3 h-3 text-gold-400" />
                                  <span>{achievement}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gold-400 mb-2">Family Connections</h4>
                          <div className="space-y-2 text-sm">
                            <div className="text-pearl/70">Generation {selectedMember.generation}</div>
                            
                            {selectedMember.parents && selectedMember.parents.length > 0 && (
                              <div>
                                <span className="font-medium">Parents: </span>
                                {selectedMember.parents.map(parentId => {
                                  const parent = members.find(m => m.id === parentId)
                                  return parent?.name
                                }).filter(Boolean).join(', ')}
                              </div>
                            )}
                            
                            {selectedMember.spouse && (
                              <div>
                                <span className="font-medium">Spouse: </span>
                                {members.find(m => m.id === selectedMember.spouse)?.name}
                              </div>
                            )}
                            
                            {selectedMember.children && selectedMember.children.length > 0 && (
                              <div>
                                <span className="font-medium">Children: </span>
                                {selectedMember.children.map(childId => {
                                  const child = members.find(m => m.id === childId)
                                  return child?.name
                                }).filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gold-400 mb-2">Legacy Status</h4>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-pearl/70">
                              <Camera className="w-4 h-4 text-gold-400" />
                              <span className="text-sm">{selectedMember.memories} memories preserved</span>
                            </div>
                            
                            {selectedMember.hasLegacyToken && (
                              <div className={`flex items-center space-x-2 ${
                                selectedMember.legacyTokenUsed ? 'text-gold-400' : 'text-gold-500'
                              }`}>
                                <Key className="w-4 h-4" />
                                <span className="text-sm">
                                  {selectedMember.legacyTokenUsed 
                                    ? 'Legacy token has been used to preserve memories'
                                    : 'Legacy token available for posthumous access'
                                  }
                                </span>
                              </div>
                            )}
                            
                            {selectedMember.isDeceased && (
                              <div className="flex items-center space-x-2 text-pearl/70">
                                <Heart className="w-4 h-4 text-gold-400" />
                                <span className="text-sm">Remembered with love</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Legacy Token System */}
      <LegacyTokenSystem
        isOpen={showLegacySystem}
        onClose={() => setShowLegacySystem(false)}
        currentProfileId="current-user"
      />
    </>
  )
}
