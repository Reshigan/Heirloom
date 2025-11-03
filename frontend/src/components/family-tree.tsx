'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Heart, Calendar, MapPin, Award, ChevronDown, ChevronUp, Search, Filter, Maximize2, Minimize2 } from 'lucide-react'
import { mockFamilyMembers, FamilyMember } from '../data/mock-family-data'

interface FamilyTreeProps {
  onMemberSelect?: (member: FamilyMember) => void
}

const FamilyTree: React.FC<FamilyTreeProps> = ({ onMemberSelect }) => {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const [hoveredMember, setHoveredMember] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGeneration, setFilterGeneration] = useState<number | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showConnections, setShowConnections] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  const treeRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Filter members based on search and generation
  const filteredMembers = mockFamilyMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.occupation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.birthPlace.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGeneration = filterGeneration === null || member.generation === filterGeneration
    return matchesSearch && matchesGeneration
  })

  // Get unique generations for filter
  const generations = [...new Set(mockFamilyMembers.map(m => m.generation))].sort()

  // Handle member selection
  const handleMemberClick = (member: FamilyMember) => {
    setSelectedMember(member)
    onMemberSelect?.(member)
  }

  // Handle mouse events for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Handle zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoomLevel(prev => Math.max(0.5, Math.min(2, prev * delta)))
  }

  // Generate connection lines between family members
  const generateConnections = () => {
    const connections: JSX.Element[] = []
    
    filteredMembers.forEach(member => {
      // Draw lines to children
      member.childrenIds.forEach(childId => {
        const child = filteredMembers.find(m => m.id === childId)
        if (child) {
          const startX = member.position.x + 60 // Center of member card
          const startY = member.position.y + 80
          const endX = child.position.x + 60
          const endY = child.position.y + 20
          
          connections.push(
            <motion.line
              key={`${member.id}-${childId}`}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke="rgba(212, 175, 55, 0.3)"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          )
        }
      })

      // Draw lines to spouse
      member.spouseIds.forEach(spouseId => {
        const spouse = filteredMembers.find(m => m.id === spouseId)
        if (spouse && member.id < spouseId) { // Avoid duplicate lines
          const startX = member.position.x + 120
          const startY = member.position.y + 50
          const endX = spouse.position.x
          const endY = spouse.position.y + 50
          
          connections.push(
            <motion.line
              key={`${member.id}-${spouseId}-marriage`}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke="rgba(212, 175, 55, 0.5)"
              strokeWidth="3"
              strokeDasharray="5,5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />
          )
        }
      })
    })
    
    return connections
  }

  // Calculate age
  const calculateAge = (birthDate: string, deathDate?: string) => {
    const birth = new Date(birthDate)
    const end = deathDate ? new Date(deathDate) : new Date()
    return Math.floor((end.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  }

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-obsidian-900' : 'h-full'} overflow-hidden`}>
      {/* Enhanced Header Controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gold-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search family members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-obsidian-800/90 backdrop-blur-md border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-400/60 focus:outline-none focus:border-gold-400 focus:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all duration-300"
            />
          </div>
          
          <select
            value={filterGeneration || ''}
            onChange={(e) => setFilterGeneration(e.target.value ? parseInt(e.target.value) : null)}
            className="px-4 py-2 bg-obsidian-800/90 backdrop-blur-md border border-gold-500/30 rounded-lg text-gold-100 focus:outline-none focus:border-gold-400 focus:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all duration-300"
          >
            <option value="">All Generations</option>
            {generations.map(gen => (
              <option key={gen} value={gen}>Generation {gen}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => setShowConnections(!showConnections)}
            className="px-3 py-2 bg-obsidian-800/90 backdrop-blur-md border border-gold-500/30 rounded-lg text-gold-100 hover:border-gold-400 hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showConnections ? 'Hide' : 'Show'} Connections
          </motion.button>
          
          <motion.button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-obsidian-800/90 backdrop-blur-md border border-gold-500/30 rounded-lg text-gold-100 hover:border-gold-400 hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>

      {/* Family Tree Canvas */}
      <div
        ref={treeRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="relative"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            width: '2000px',
            height: '1000px'
          }}
        >
          {/* Connection Lines */}
          {showConnections && (
            <svg
              ref={svgRef}
              className="absolute inset-0 pointer-events-none"
              width="2000"
              height="1000"
            >
              {generateConnections()}
            </svg>
          )}

          {/* Family Members */}
          {filteredMembers.map((member, index) => (
            <motion.div
              key={member.id}
              className="absolute cursor-pointer"
              style={{
                left: member.position.x,
                top: member.position.y
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              onClick={() => handleMemberClick(member)}
              onMouseEnter={() => setHoveredMember(member.id)}
              onMouseLeave={() => setHoveredMember(null)}
            >
              <div className={`
                relative w-32 h-24 rounded-xl border-2 transition-all duration-500
                ${selectedMember?.id === member.id 
                  ? 'border-gold-400 bg-gradient-to-br from-gold-900/50 to-obsidian-800/70 shadow-[0_0_25px_rgba(212,175,55,0.4)]' 
                  : 'border-gold-500/40 bg-gradient-to-br from-obsidian-800/70 to-obsidian-900/90 hover:border-gold-400 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                }
                backdrop-blur-md
              `}>
                {/* Enhanced Member Avatar */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-obsidian-900 font-bold text-sm shadow-[0_0_15px_rgba(212,175,55,0.5)] border-2 border-obsidian-900">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>

                {/* Member Info */}
                <div className="pt-4 px-2 text-center">
                  <h3 className="text-gold-100 font-semibold text-xs leading-tight mb-1">
                    {member.name}
                  </h3>
                  <p className="text-gold-400/80 text-xs mb-1">
                    {member.occupation}
                  </p>
                  <p className="text-gold-500/60 text-xs">
                    {calculateAge(member.birthDate, member.deathDate)} years
                    {member.deathDate && ' ✝'}
                  </p>
                </div>

                {/* Enhanced Generation Indicator */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 text-obsidian-900 text-xs font-bold flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.4)] border border-obsidian-900">
                  {member.generation}
                </div>
              </div>

              {/* Hover Tooltip */}
              <AnimatePresence>
                {hoveredMember === member.id && (
                  <motion.div
                    className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-20"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="bg-obsidian-800/95 backdrop-blur-md border border-gold-500/40 rounded-lg p-3 min-w-64 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-gold-400" />
                        <span className="text-gold-100 text-sm">
                          {new Date(member.birthDate).getFullYear()}
                          {member.deathDate && ` - ${new Date(member.deathDate).getFullYear()}`}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-gold-400" />
                        <span className="text-gold-100 text-sm">{member.birthPlace}</span>
                      </div>
                      
                      <p className="text-gold-300/80 text-sm mb-2">{member.bio}</p>
                      
                      {member.achievements.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Award className="w-4 h-4 text-gold-400 mt-0.5" />
                          <div className="text-gold-100 text-sm">
                            {member.achievements.slice(0, 2).map((achievement, i) => (
                              <div key={i} className="text-xs text-gold-300/80">• {achievement}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Enhanced Selected Member Detail Panel */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            className="absolute bottom-4 right-4 w-80 bg-obsidian-800/95 backdrop-blur-md border border-gold-500/40 rounded-xl p-4 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gold-100 font-bold text-lg">{selectedMember.name}</h3>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-gold-400 hover:text-gold-300 transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold-400" />
                <span className="text-gold-100">
                  {new Date(selectedMember.birthDate).toLocaleDateString()}
                  {selectedMember.deathDate && ` - ${new Date(selectedMember.deathDate).toLocaleDateString()}`}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold-400" />
                <span className="text-gold-100">{selectedMember.birthPlace}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gold-400" />
                <span className="text-gold-100">{selectedMember.occupation}</span>
              </div>
              
              <p className="text-gold-300/80 mt-3">{selectedMember.bio}</p>
              
              {selectedMember.relationships.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-gold-100 font-semibold mb-2">Family Connections</h4>
                  <div className="space-y-1">
                    {selectedMember.relationships.slice(0, 4).map((rel, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <Heart className="w-3 h-3 text-gold-400" />
                        <span className="text-gold-300/80 capitalize">{rel.type}:</span>
                        <span className="text-gold-100">{rel.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedMember.memories.length > 0 && (
                <div className="mt-3">
                  <span className="text-gold-400 text-xs">
                    {selectedMember.memories.length} memories available
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Zoom Controls */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
        <motion.button
          onClick={() => setZoomLevel(prev => Math.min(2, prev * 1.2))}
          className="w-10 h-10 bg-obsidian-800/90 backdrop-blur-md border border-gold-500/30 rounded-lg text-gold-100 hover:border-gold-400 hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all duration-300 flex items-center justify-center font-bold text-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          +
        </motion.button>
        <motion.button
          onClick={() => setZoomLevel(prev => Math.max(0.5, prev * 0.8))}
          className="w-10 h-10 bg-obsidian-800/90 backdrop-blur-md border border-gold-500/30 rounded-lg text-gold-100 hover:border-gold-400 hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all duration-300 flex items-center justify-center font-bold text-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          −
        </motion.button>
        <motion.button
          onClick={() => {
            setZoomLevel(1)
            setPanOffset({ x: 0, y: 0 })
          }}
          className="w-10 h-10 bg-obsidian-800/90 backdrop-blur-md border border-gold-500/30 rounded-lg text-gold-100 hover:border-gold-400 hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all duration-300 flex items-center justify-center text-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ⌂
        </motion.button>
      </div>
    </div>
  )
}

export default FamilyTree
