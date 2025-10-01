'use client';

import React, { useState } from 'react';
import { User, Edit3, Camera, Mail, Phone, MapPin, Calendar, Heart, Users, Settings, Save, X } from 'lucide-react';

interface UserProfileProps {
  onClose?: () => void;
}

interface UserData {
  name: string;
  email: string;
  phone: string;
  location: string;
  birthdate: string;
  bio: string;
  avatar: string;
  familyRole: string;
  joinDate: string;
  memoriesCount: number;
  connectionsCount: number;
}

export default function UserProfile({ onClose }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    birthdate: '1985-03-15',
    bio: 'Family historian and memory keeper. I love collecting and preserving our family stories for future generations.',
    avatar: '/api/placeholder/150/150',
    familyRole: 'Daughter',
    joinDate: '2023-01-15',
    memoriesCount: 127,
    connectionsCount: 23
  });

  const [editData, setEditData] = useState<UserData>(userData);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(userData);
  };

  const handleSave = () => {
    setUserData(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(userData);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof UserData, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const stats = [
    { label: 'Memories Shared', value: userData.memoriesCount, icon: Heart },
    { label: 'Family Connections', value: userData.connectionsCount, icon: Users },
    { label: 'Years Active', value: new Date().getFullYear() - new Date(userData.joinDate).getFullYear(), icon: Calendar }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-glass-bg backdrop-blur-lg border border-glass-border rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-display font-bold text-gold">Profile</h2>
          <div className="flex space-x-2">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center space-x-2 bg-secondary-gradient text-black px-4 py-2 rounded-lg hover:scale-105 transition-transform font-semibold"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 border border-gold/30 text-gold px-4 py-2 rounded-lg hover:border-gold transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 bg-secondary-gradient text-black px-4 py-2 rounded-lg hover:scale-105 transition-transform font-semibold"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
              </div>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="text-gold/60 hover:text-gold transition-colors p-2"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 mb-8">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-secondary-gradient p-1">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                {userData.avatar ? (
                  <img src={userData.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-gold" />
                )}
              </div>
            </div>
            {isEditing && (
              <button className="absolute bottom-0 right-0 bg-secondary-gradient text-black p-2 rounded-full hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1 text-center md:text-left">
            {isEditing ? (
              <input
                type="text"
                value={editData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="text-2xl font-display font-bold text-gold bg-transparent border-b border-gold/30 focus:border-gold focus:outline-none mb-2 w-full"
              />
            ) : (
              <h3 className="text-2xl font-display font-bold text-gold mb-2">{userData.name}</h3>
            )}
            
            <p className="text-gold/80 mb-1">{userData.familyRole}</p>
            <p className="text-gold/60 text-sm">Member since {new Date(userData.joinDate).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-black-light border border-gold/20 rounded-xl p-4 text-center">
              <stat.icon className="w-6 h-6 text-gold mx-auto mb-2" />
              <div className="text-2xl font-bold text-gold mb-1">{stat.value}</div>
              <div className="text-gold/60 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Contact Information */}
        <div className="space-y-6">
          <h4 className="text-xl font-display font-semibold text-gold mb-4">Contact Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-gold/80 mb-2">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full bg-black-light border border-gold/30 rounded-lg px-3 py-2 text-gold focus:border-gold focus:outline-none transition-colors"
                />
              ) : (
                <p className="text-gold">{userData.email}</p>
              )}
            </div>

            <div>
              <label className="flex items-center text-gold/80 mb-2">
                <Phone className="w-4 h-4 mr-2" />
                Phone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full bg-black-light border border-gold/30 rounded-lg px-3 py-2 text-gold focus:border-gold focus:outline-none transition-colors"
                />
              ) : (
                <p className="text-gold">{userData.phone}</p>
              )}
            </div>

            <div>
              <label className="flex items-center text-gold/80 mb-2">
                <MapPin className="w-4 h-4 mr-2" />
                Location
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full bg-black-light border border-gold/30 rounded-lg px-3 py-2 text-gold focus:border-gold focus:outline-none transition-colors"
                />
              ) : (
                <p className="text-gold">{userData.location}</p>
              )}
            </div>

            <div>
              <label className="flex items-center text-gold/80 mb-2">
                <Calendar className="w-4 h-4 mr-2" />
                Birth Date
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.birthdate}
                  onChange={(e) => handleInputChange('birthdate', e.target.value)}
                  className="w-full bg-black-light border border-gold/30 rounded-lg px-3 py-2 text-gold focus:border-gold focus:outline-none transition-colors"
                />
              ) : (
                <p className="text-gold">{new Date(userData.birthdate).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="flex items-center text-gold/80 mb-2">
              <User className="w-4 h-4 mr-2" />
              Bio
            </label>
            {isEditing ? (
              <textarea
                value={editData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                className="w-full bg-black-light border border-gold/30 rounded-lg px-3 py-2 text-gold focus:border-gold focus:outline-none transition-colors resize-none"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-gold">{userData.bio}</p>
            )}
          </div>

          {/* Family Role */}
          <div>
            <label className="flex items-center text-gold/80 mb-2">
              <Users className="w-4 h-4 mr-2" />
              Family Role
            </label>
            {isEditing ? (
              <select
                value={editData.familyRole}
                onChange={(e) => handleInputChange('familyRole', e.target.value)}
                className="w-full bg-black-light border border-gold/30 rounded-lg px-3 py-2 text-gold focus:border-gold focus:outline-none transition-colors"
              >
                <option value="Parent">Parent</option>
                <option value="Child">Child</option>
                <option value="Grandparent">Grandparent</option>
                <option value="Grandchild">Grandchild</option>
                <option value="Sibling">Sibling</option>
                <option value="Spouse">Spouse</option>
                <option value="Aunt/Uncle">Aunt/Uncle</option>
                <option value="Cousin">Cousin</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <p className="text-gold">{userData.familyRole}</p>
            )}
          </div>
        </div>

        {/* Privacy Settings */}
        {!isEditing && (
          <div className="mt-8 pt-6 border-t border-gold/20">
            <button className="flex items-center space-x-2 text-gold/80 hover:text-gold transition-colors">
              <Settings className="w-4 h-4" />
              <span>Privacy & Settings</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}