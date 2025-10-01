'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User, Plus, Edit3, Heart, Users, Calendar, X, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface FamilyMember {
  id: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  photo?: string;
  relationship: string;
  x: number;
  y: number;
  generation: number;
  spouse?: string;
  children: string[];
  parents: string[];
}

interface FamilyTreeProps {
  onClose?: () => void;
}

export default function FamilyTree({ onClose }: FamilyTreeProps) {
  const [members, setMembers] = useState<FamilyMember[]>([
    {
      id: '1',
      name: 'Robert Johnson',
      birthDate: '1925-05-12',
      deathDate: '1995-08-20',
      relationship: 'Grandfather',
      x: 300,
      y: 80,
      generation: 0,
      children: ['3', '4'],
      parents: []
    },
    {
      id: '2',
      name: 'Mary Johnson',
      birthDate: '1928-11-03',
      deathDate: '2001-03-15',
      relationship: 'Grandmother',
      x: 500,
      y: 80,
      generation: 0,
      children: ['3', '4'],
      parents: []
    },
    {
      id: '3',
      name: 'David Johnson',
      birthDate: '1955-07-22',
      relationship: 'Father',
      x: 250,
      y: 220,
      generation: 1,
      spouse: '5',
      children: ['6', '7'],
      parents: ['1', '2']
    },
    {
      id: '4',
      name: 'Susan Wilson',
      birthDate: '1958-02-14',
      relationship: 'Aunt',
      x: 600,
      y: 220,
      generation: 1,
      children: ['8'],
      parents: ['1', '2']
    },
    {
      id: '5',
      name: 'Linda Johnson',
      birthDate: '1957-09-08',
      relationship: 'Mother',
      x: 450,
      y: 220,
      generation: 1,
      spouse: '3',
      children: ['6', '7'],
      parents: []
    },
    {
      id: '6',
      name: 'Sarah Johnson',
      birthDate: '1985-03-15',
      relationship: 'Self',
      x: 300,
      y: 380,
      generation: 2,
      children: [],
      parents: ['3', '5']
    },
    {
      id: '7',
      name: 'Michael Johnson',
      birthDate: '1987-11-28',
      relationship: 'Brother',
      x: 500,
      y: 380,
      generation: 2,
      children: [],
      parents: ['3', '5']
    },
    {
      id: '8',
      name: 'Emma Wilson',
      birthDate: '1990-06-10',
      relationship: 'Cousin',
      x: 650,
      y: 380,
      generation: 2,
      children: [],
      parents: ['4']
    }
  ]);

  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const renderConnections = () => {
    const connections: React.ReactElement[] = [];

    members.forEach(member => {
      // Draw lines to children
      member.children.forEach(childId => {
        const child = members.find(m => m.id === childId);
        if (child) {
          connections.push(
            <line
              key={`${member.id}-${childId}`}
              x1={member.x}
              y1={member.y + 40}
              x2={child.x}
              y2={child.y - 10}
              stroke="rgba(74, 144, 226, 0.4)"
              strokeWidth="2"
              className="transition-all duration-300"
            />
          );
        }
      });

      // Draw line to spouse
      if (member.spouse) {
        const spouse = members.find(m => m.id === member.spouse);
        if (spouse) {
          connections.push(
            <line
              key={`${member.id}-spouse-${member.spouse}`}
              x1={member.x + 40}
              y1={member.y + 20}
              x2={spouse.x - 40}
              y2={spouse.y + 20}
              stroke="rgba(107, 70, 193, 0.6)"
              strokeWidth="3"
              strokeDasharray="5,5"
              className="transition-all duration-300"
            />
          );
        }
      }
    });

    return connections;
  };

  const MemberCard = ({ member }: { member: FamilyMember }) => {
    const isSelected = selectedMember === member.id;
    const age = member.deathDate 
      ? new Date(member.deathDate).getFullYear() - new Date(member.birthDate || '').getFullYear()
      : new Date().getFullYear() - new Date(member.birthDate || '').getFullYear();

    return (
      <g
        transform={`translate(${member.x}, ${member.y})`}
        className="cursor-pointer transition-all duration-300 hover:scale-110"
        onClick={() => setSelectedMember(isSelected ? null : member.id)}
      >
        {/* Glow Effect */}
        <rect
          x="-65"
          y="-35"
          width="130"
          height="90"
          rx="15"
          fill="rgba(255, 215, 0, 0.1)"
          filter="blur(8px)"
          opacity="0"
          className="hover:opacity-100 transition-opacity duration-300"
        />
        
        {/* Card Background */}
        <rect
          x="-60"
          y="-30"
          width="120"
          height="80"
          rx="12"
          fill="rgba(0, 0, 0, 0.9)"
          stroke={isSelected ? "#FFD700" : "rgba(255, 215, 0, 0.3)"}
          strokeWidth={isSelected ? "3" : "1"}
          className="transition-all duration-300 hover:fill-[rgba(255,215,0,0.1)] hover:stroke-[#FFD700]"
          filter="drop-shadow(0 4px 20px rgba(255, 215, 0, 0.2))"
        />

        {/* Photo/Avatar */}
        <circle
          cx="0"
          cy="-10"
          r="15"
          fill="linear-gradient(135deg, #FFD700 0%, #FFA500 100%)"
        />
        <circle
          cx="0"
          cy="-10"
          r="12"
          fill="#000000"
        />
        {member.photo ? (
          <image
            href={member.photo}
            x="-12"
            y="-22"
            width="24"
            height="24"
            clipPath="circle(12px at 12px 12px)"
          />
        ) : (
          <User
            x="-6"
            y="-16"
            width="12"
            height="12"
            fill="#FFD700"
          />
        )}

        {/* Name */}
        <text
          x="0"
          y="20"
          textAnchor="middle"
          fill="#FFD700"
          fontSize="10"
          fontWeight="bold"
          className="font-display"
        >
          {member.name.length > 12 ? member.name.substring(0, 12) + '...' : member.name}
        </text>

        {/* Relationship */}
        <text
          x="0"
          y="32"
          textAnchor="middle"
          fill="rgba(255, 215, 0, 0.7)"
          fontSize="8"
        >
          {member.relationship}
        </text>

        {/* Age */}
        {member.birthDate && (
          <text
            x="0"
            y="42"
            textAnchor="middle"
            fill="rgba(255, 215, 0, 0.5)"
            fontSize="7"
          >
            {member.deathDate ? `${age} years` : `Age ${age}`}
          </text>
        )}

        {/* Selection Indicator */}
        {isSelected && (
          <circle
            cx="0"
            cy="0"
            r="70"
            fill="none"
            stroke="#FFD700"
            strokeWidth="2"
            strokeDasharray="5,5"
            opacity="0.5"
            className="animate-spin-slow"
          />
        )}
      </g>
    );
  };

  const selectedMemberData = selectedMember ? members.find(m => m.id === selectedMember) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex z-50">
      {/* Main Tree View */}
      <div className="flex-1 relative overflow-hidden">
        {/* Controls */}
        <div className="absolute top-4 left-4 z-10 flex space-x-2">
          <button
            onClick={handleZoomIn}
            className="bg-glass-bg backdrop-blur-lg border border-glass-border text-gold p-2 rounded-lg hover:bg-gold/10 transition-colors"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="bg-glass-bg backdrop-blur-lg border border-glass-border text-gold p-2 rounded-lg hover:bg-gold/10 transition-colors"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-secondary-gradient text-black p-2 rounded-lg hover:scale-105 transition-transform"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-glass-bg backdrop-blur-lg border border-glass-border text-gold p-2 rounded-lg hover:bg-gold/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* SVG Tree */}
        <svg
          ref={svgRef}
          className="w-full h-full cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Connections */}
            {renderConnections()}
            
            {/* Members */}
            {members.map(member => (
              <MemberCard key={member.id} member={member} />
            ))}
          </g>
        </svg>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 bg-glass-bg backdrop-blur-lg border border-glass-border rounded-lg p-3 text-gold/80 text-sm">
          <div className="flex items-center space-x-2 mb-1">
            <Move className="w-4 h-4" />
            <span>Drag to pan • Click members for details</span>
          </div>
        </div>
      </div>

      {/* Member Details Panel */}
      {selectedMemberData && (
        <div className="w-80 bg-glass-bg backdrop-blur-lg border-l border-glass-border p-6 overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-display font-bold text-gold">Member Details</h3>
            <button
              onClick={() => setSelectedMember(null)}
              className="text-gold/60 hover:text-gold transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Member Info */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-secondary-gradient p-1 mx-auto mb-3">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                  {selectedMemberData.photo ? (
                    <img src={selectedMemberData.photo} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User className="w-10 h-10 text-gold" />
                  )}
                </div>
              </div>
              <h4 className="text-lg font-display font-bold text-gold">{selectedMemberData.name}</h4>
              <p className="text-gold/80">{selectedMemberData.relationship}</p>
            </div>

            {/* Birth/Death Dates */}
            {selectedMemberData.birthDate && (
              <div className="bg-black-light border border-gold/20 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4 text-gold" />
                  <span className="text-gold font-medium">Life Dates</span>
                </div>
                <p className="text-gold/80">
                  Born: {new Date(selectedMemberData.birthDate).toLocaleDateString()}
                </p>
                {selectedMemberData.deathDate && (
                  <p className="text-gold/80">
                    Died: {new Date(selectedMemberData.deathDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Family Connections */}
            <div className="bg-black-light border border-gold/20 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-4 h-4 text-gold" />
                <span className="text-gold font-medium">Family Connections</span>
              </div>
              
              {selectedMemberData.parents.length > 0 && (
                <div className="mb-2">
                  <p className="text-gold/60 text-sm">Parents:</p>
                  {selectedMemberData.parents.map(parentId => {
                    const parent = members.find(m => m.id === parentId);
                    return parent ? (
                      <p key={parentId} className="text-gold/80 ml-2">• {parent.name}</p>
                    ) : null;
                  })}
                </div>
              )}

              {selectedMemberData.spouse && (
                <div className="mb-2">
                  <p className="text-gold/60 text-sm">Spouse:</p>
                  <p className="text-gold/80 ml-2">• {members.find(m => m.id === selectedMemberData.spouse)?.name}</p>
                </div>
              )}

              {selectedMemberData.children.length > 0 && (
                <div>
                  <p className="text-gold/60 text-sm">Children:</p>
                  {selectedMemberData.children.map(childId => {
                    const child = members.find(m => m.id === childId);
                    return child ? (
                      <p key={childId} className="text-gold/80 ml-2">• {child.name}</p>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button className="flex-1 bg-secondary-gradient text-black py-2 rounded-lg hover:scale-105 transition-transform font-semibold">
                <Edit3 className="w-4 h-4 inline mr-2" />
                Edit
              </button>
              <button className="flex-1 border border-gold/30 text-gold py-2 rounded-lg hover:border-gold transition-colors">
                <Heart className="w-4 h-4 inline mr-2" />
                Memories
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}