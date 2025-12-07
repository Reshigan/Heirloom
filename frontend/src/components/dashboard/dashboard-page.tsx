'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface DashboardStats {
  totalMemories: number;
  totalRecordings: number;
  totalLetters: number;
  totalRecipients: number;
  memoriesChange: number;
  recordingsChange: number;
  lettersChange: number;
}

interface Activity {
  id: string;
  type: 'memory' | 'voice' | 'letter';
  title: string;
  meta: string;
  time: string;
}

interface Delivery {
  id: string;
  recipient: string;
  trigger: string;
  status: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMemories: 0,
    totalRecordings: 0,
    totalLetters: 0,
    totalRecipients: 0,
    memoriesChange: 0,
    recordingsChange: 0,
    lettersChange: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [memoriesData, recipientsData, lettersData] = await Promise.all([
          apiClient.getMemories().catch(() => []),
          apiClient.getRecipients().catch(() => ({ recipients: [] })),
          apiClient.getAfterImGoneLetters().catch(() => []),
        ]);

        setStats({
          totalMemories: memoriesData.length,
          totalRecordings: 0,
          totalLetters: lettersData.length,
          totalRecipients: recipientsData.recipients.length,
          memoriesChange: 12,
          recordingsChange: 8,
          lettersChange: 3,
        });

        const recentActivities: Activity[] = memoriesData.slice(0, 5).map((memory: any) => ({
          id: memory.id,
          type: 'memory' as const,
          title: memory.title,
          meta: memory.type,
          time: new Date(memory.date).toLocaleDateString(),
        }));
        setActivities(recentActivities);

        const upcomingDeliveries: Delivery[] = lettersData.slice(0, 3).map((letter: any) => ({
          id: letter.id,
          recipient: letter.recipientName || 'Unknown',
          trigger: letter.triggerType || 'Manual',
          status: 'Sealed',
        }));
        setDeliveries(upcomingDeliveries);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-ring"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="font-display text-3xl text-cream-100 mb-2">
              Welcome back, {user?.name || 'there'}
            </h1>
            <p className="text-base text-black-100">
              Your legacy continues to grow
            </p>
          </div>
          <Link href="/app" className="btn btn-primary">
            Add Memory
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-black-700 border border-black-500 rounded-lg p-5 transition-all hover:border-gold-600">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-black-100">Total Memories</span>
              <div className="w-10 h-10 flex items-center justify-center bg-gold-500/10 rounded-md text-xl">
                📸
              </div>
            </div>
            <div className="font-display text-4xl font-semibold text-cream-100 mb-1">
              {stats.totalMemories}
            </div>
            <div className="flex items-center gap-1 text-sm text-success-400">
              <span>↑</span>
              <span>+{stats.memoriesChange}% this month</span>
            </div>
          </div>

          <div className="bg-black-700 border border-black-500 rounded-lg p-5 transition-all hover:border-gold-600">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-black-100">Voice Recordings</span>
              <div className="w-10 h-10 flex items-center justify-center bg-gold-500/10 rounded-md text-xl">
                🎙️
              </div>
            </div>
            <div className="font-display text-4xl font-semibold text-cream-100 mb-1">
              {stats.totalRecordings}
            </div>
            <div className="flex items-center gap-1 text-sm text-success-400">
              <span>↑</span>
              <span>+{stats.recordingsChange}% this month</span>
            </div>
          </div>

          <div className="bg-black-700 border border-black-500 rounded-lg p-5 transition-all hover:border-gold-600">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-black-100">Letters</span>
              <div className="w-10 h-10 flex items-center justify-center bg-gold-500/10 rounded-md text-xl">
                💌
              </div>
            </div>
            <div className="font-display text-4xl font-semibold text-cream-100 mb-1">
              {stats.totalLetters}
            </div>
            <div className="flex items-center gap-1 text-sm text-success-400">
              <span>↑</span>
              <span>+{stats.lettersChange}% this month</span>
            </div>
          </div>

          <div className="bg-black-700 border border-black-500 rounded-lg p-5 transition-all hover:border-gold-600">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-black-100">Recipients</span>
              <div className="w-10 h-10 flex items-center justify-center bg-gold-500/10 rounded-md text-xl">
                👥
              </div>
            </div>
            <div className="font-display text-4xl font-semibold text-cream-100 mb-1">
              {stats.totalRecipients}
            </div>
            <div className="text-sm text-black-100">
              Trusted contacts
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link
            href="/app"
            className="flex flex-col items-center text-center p-6 bg-black-700 border border-black-500 rounded-lg cursor-pointer transition-all hover:border-gold-500 hover:-translate-y-0.5 hover:shadow-gold-sm"
          >
            <div className="w-14 h-14 flex items-center justify-center bg-gold-500/10 border border-gold-600 rounded-full text-2xl mb-4">
              📸
            </div>
            <div className="text-base font-semibold text-cream-100 mb-1">Add Memory</div>
            <div className="text-sm text-black-100">Photos & stories</div>
          </Link>

          <Link
            href="/app/voice"
            className="flex flex-col items-center text-center p-6 bg-black-700 border border-black-500 rounded-lg cursor-pointer transition-all hover:border-gold-500 hover:-translate-y-0.5 hover:shadow-gold-sm"
          >
            <div className="w-14 h-14 flex items-center justify-center bg-gold-500/10 border border-gold-600 rounded-full text-2xl mb-4">
              🎙️
            </div>
            <div className="text-base font-semibold text-cream-100 mb-1">Record Voice</div>
            <div className="text-sm text-black-100">Share your story</div>
          </Link>

          <Link
            href="/app/letters"
            className="flex flex-col items-center text-center p-6 bg-black-700 border border-black-500 rounded-lg cursor-pointer transition-all hover:border-gold-500 hover:-translate-y-0.5 hover:shadow-gold-sm"
          >
            <div className="w-14 h-14 flex items-center justify-center bg-gold-500/10 border border-gold-600 rounded-full text-2xl mb-4">
              💌
            </div>
            <div className="text-base font-semibold text-cream-100 mb-1">Write Letter</div>
            <div className="text-sm text-black-100">For the future</div>
          </Link>

          <Link
            href="/app/recipients"
            className="flex flex-col items-center text-center p-6 bg-black-700 border border-black-500 rounded-lg cursor-pointer transition-all hover:border-gold-500 hover:-translate-y-0.5 hover:shadow-gold-sm"
          >
            <div className="w-14 h-14 flex items-center justify-center bg-gold-500/10 border border-gold-600 rounded-full text-2xl mb-4">
              👥
            </div>
            <div className="text-base font-semibold text-cream-100 mb-1">Add Recipient</div>
            <div className="text-sm text-black-100">Manage contacts</div>
          </Link>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-xl text-cream-100">Recent Activity</h2>
              <Link href="/app" className="text-sm text-gold-500 hover:underline">
                View all
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 bg-black-700 border border-black-500 rounded-lg transition-all hover:border-gold-600"
                  >
                    <div className={`w-11 h-11 flex items-center justify-center rounded-md text-xl flex-shrink-0 ${
                      activity.type === 'memory' ? 'bg-gold-500/10' :
                      activity.type === 'voice' ? 'bg-success-500/10' :
                      'bg-info-500/10'
                    }`}>
                      {activity.type === 'memory' ? '📸' : activity.type === 'voice' ? '🎙️' : '💌'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-medium text-cream-100 mb-1 truncate">
                        {activity.title}
                      </div>
                      <div className="text-sm text-black-100">{activity.meta}</div>
                    </div>
                    <div className="text-sm text-black-200 flex-shrink-0">{activity.time}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-black-100">
                  No recent activity yet. Start by adding your first memory!
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Deliveries */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-xl text-cream-100">Upcoming Deliveries</h2>
              <Link href="/app/letters" className="text-sm text-gold-500 hover:underline">
                View all
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {deliveries.length > 0 ? (
                deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-center gap-3 p-4 bg-black-700 border border-black-500 rounded-lg"
                  >
                    <div className="text-2xl">💌</div>
                    <div className="flex-1">
                      <div className="text-base font-medium text-cream-100">{delivery.recipient}</div>
                      <div className="text-sm text-black-100">{delivery.trigger}</div>
                    </div>
                    <div className="px-3 py-1 text-xs font-semibold uppercase rounded-full bg-gold-500/15 text-gold-500">
                      {delivery.status}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-sm text-black-100">
                  No scheduled deliveries
                </div>
              )}
            </div>

            {deliveries.length === 0 && (
              <div className="mt-4 p-4 bg-black-700 border border-black-500 rounded-lg text-center">
                <p className="text-sm text-black-100 mb-3">
                  Create your first letter to be delivered in the future
                </p>
                <Link href="/app/letters" className="btn btn-secondary btn-sm">
                  Write a Letter
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
