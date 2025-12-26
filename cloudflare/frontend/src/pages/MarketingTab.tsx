import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Upload, Send, Users, FileText, X, Target, 
  AlertTriangle, RefreshCw
} from '../components/Icons';
import { marketingApi } from '../services/api';

const SEGMENTS = ['GENEALOGY', 'GRIEF', 'PARENTING', 'TECH', 'ESTATE_PLANNING', 'PODCAST', 'OTHER'];
const PLATFORMS = ['INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'LINKEDIN', 'TWITTER', 'EMAIL', 'ALL'];
const INFLUENCER_STATUSES = ['NEW', 'CONTACTED', 'RESPONDED', 'INTERESTED', 'PARTNERED', 'DECLINED', 'UNSUBSCRIBED'];

const INFLUENCER_TEMPLATES: Record<string, { subject: string; body: string }> = {
  GENEALOGY: {
    subject: "Partnership Opportunity: Help Families Preserve Their Stories",
    body: `<p>Hi [Name],</p>
<p>I came across your work in the genealogy space and was genuinely impressed by how you help families connect with their roots.</p>
<p>I'm reaching out from Heirloom, a platform that helps people preserve their life stories, voice recordings, and letters for future generations. We're on a mission to ensure no family story is ever lost.</p>
<p>Given your audience's passion for family history, I thought there might be a natural fit for collaboration. We'd love to offer your community exclusive early access or a special partnership.</p>
<p>Would you be open to a quick chat about how we might work together?</p>
<p>Warm regards,<br>The Heirloom Team</p>`
  },
  GRIEF: {
    subject: "A Tool to Help Families Through Loss",
    body: `<p>Hi [Name],</p>
<p>Your work supporting people through grief has touched many lives, and I wanted to reach out with something that might resonate with your community.</p>
<p>Heirloom is a platform that helps people preserve their voice, stories, and letters for loved ones—creating a lasting presence that families can hold onto.</p>
<p>Many of our users are people who want to leave something meaningful behind, or families who wish they had more recordings of loved ones who've passed.</p>
<p>I'd love to explore how we might partner to bring this resource to people who could benefit from it.</p>
<p>With care,<br>The Heirloom Team</p>`
  },
  PARENTING: {
    subject: "Capture Your Family's Story Before It's Too Late",
    body: `<p>Hi [Name],</p>
<p>As a parent myself, I know how quickly time flies. One day they're taking their first steps, the next they're asking about grandparents they never met.</p>
<p>That's why I wanted to introduce you to Heirloom—a platform that helps families preserve voice recordings, stories, and letters for future generations.</p>
<p>Imagine your kids being able to hear your voice, your stories, your advice—even decades from now. That's what we're building.</p>
<p>I think your community would love this. Would you be interested in trying it out or exploring a partnership?</p>
<p>Best,<br>The Heirloom Team</p>`
  },
  TECH: {
    subject: "Heirloom: Digital Legacy Preservation Built on Cloudflare",
    body: `<p>Hi [Name],</p>
<p>I've been following your content on African tech innovation and thought you might find Heirloom interesting.</p>
<p>We're building a digital legacy platform that helps people preserve their stories, voice recordings, and letters for future generations—all running on Cloudflare's edge infrastructure for global performance.</p>
<p>The tech stack includes Workers, D1, R2, and Workers AI for transcription and emotion analysis. We're particularly focused on making this accessible across Africa.</p>
<p>Would love to chat about the technical architecture or explore a partnership.</p>
<p>Cheers,<br>The Heirloom Team</p>`
  },
  ESTATE_PLANNING: {
    subject: "Beyond Wills: The Emotional Side of Estate Planning",
    body: `<p>Hi [Name],</p>
<p>Your expertise in estate planning helps families prepare for the practical side of legacy. I wanted to introduce you to something that addresses the emotional side.</p>
<p>Heirloom is a platform that helps people preserve their voice, stories, and personal letters for loved ones—the things that can't be captured in a will but matter just as much.</p>
<p>Many estate planners are recommending Heirloom alongside traditional planning as a way to leave a complete legacy.</p>
<p>I'd love to explore how we might work together to serve your clients better.</p>
<p>Best regards,<br>The Heirloom Team</p>`
  },
  PODCAST: {
    subject: "Guest Pitch: The Future of Digital Legacy",
    body: `<p>Hi [Name],</p>
<p>I've been enjoying your podcast and thought your audience might be interested in a conversation about digital legacy and preserving family stories.</p>
<p>I'm from Heirloom, a platform that helps people record their life stories, voice messages, and letters for future generations. We've got some fascinating stories about why people are doing this and the technology behind it.</p>
<p>Topics we could cover: the psychology of legacy, AI in memory preservation, the "Dead Man's Switch" feature, or stories from users.</p>
<p>Would you be open to having us on?</p>
<p>Thanks,<br>The Heirloom Team</p>`
  },
};

export function MarketingTab() {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState<'influencers' | 'campaigns' | 'content' | 'signups'>('influencers');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showInfluencerModal, setShowInfluencerModal] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const { data: influencers, isLoading: loadingInfluencers } = useQuery({
    queryKey: ['marketing-influencers', selectedSegment, selectedStatus],
    queryFn: () => marketingApi.getInfluencers({ 
      segment: selectedSegment || undefined, 
      status: selectedStatus || undefined 
    }).then(r => r.data),
  });

  const { data: campaigns } = useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: () => marketingApi.getCampaigns().then(r => r.data),
    enabled: activeSubTab === 'campaigns',
  });

  const { data: creatorSignups } = useQuery({
    queryKey: ['marketing-creator-signups'],
    queryFn: () => marketingApi.getCreatorSignups().then(r => r.data),
    enabled: activeSubTab === 'signups',
  });

  const { data: content } = useQuery({
    queryKey: ['marketing-content'],
    queryFn: () => marketingApi.getContent().then(r => r.data),
    enabled: activeSubTab === 'content',
  });

  const importMutation = useMutation({
    mutationFn: (influencers: any[]) => marketingApi.importInfluencers(influencers),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-influencers'] });
      alert(`Imported ${data.data.imported} influencers, skipped ${data.data.skipped}`);
      setShowImportModal(false);
    },
  });

  const approveSignupMutation = useMutation({
    mutationFn: (id: string) => marketingApi.approveCreatorSignup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-creator-signups'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-influencers'] });
    },
  });

  const subTabs = [
    { id: 'influencers', label: 'Influencers', icon: Users },
    { id: 'campaigns', label: 'Campaigns', icon: Send },
    { id: 'content', label: 'Content Library', icon: FileText },
    { id: 'signups', label: 'Creator Signups', icon: Target },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl">Marketing Automation</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Upload size={16} />
            Import Influencers
          </button>
          <button
            onClick={() => setShowInfluencerModal(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Plus size={16} />
            Add Influencer
          </button>
          <button
            onClick={() => setShowCampaignModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Send size={16} />
            New Campaign
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-white/10 pb-2">
        {subTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSubTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t transition-all ${
              activeSubTab === id 
                ? 'bg-gold/20 text-gold border-b-2 border-gold' 
                : 'text-paper/50 hover:text-paper'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {activeSubTab === 'influencers' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="input w-48"
            >
              <option value="">All Segments</option>
              {SEGMENTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input w-48"
            >
              <option value="">All Statuses</option>
              {INFLUENCER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="text-paper/50 flex items-center">
              {influencers?.influencers?.length || 0} influencers
            </div>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-paper/50 font-normal">Name</th>
                  <th className="text-left py-3 px-4 text-paper/50 font-normal">Email</th>
                  <th className="text-left py-3 px-4 text-paper/50 font-normal">Platform</th>
                  <th className="text-left py-3 px-4 text-paper/50 font-normal">Segment</th>
                  <th className="text-left py-3 px-4 text-paper/50 font-normal">Status</th>
                  <th className="text-left py-3 px-4 text-paper/50 font-normal">Last Contact</th>
                </tr>
              </thead>
              <tbody>
                {loadingInfluencers ? (
                  <tr><td colSpan={6} className="text-center py-8 text-paper/50">Loading...</td></tr>
                ) : influencers?.influencers?.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-paper/50">No influencers yet. Import or add some!</td></tr>
                ) : (
                  influencers?.influencers?.map((inf: any) => (
                    <tr key={inf.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <div className="font-medium">{inf.name}</div>
                        {inf.handle && <div className="text-xs text-paper/50">@{inf.handle}</div>}
                      </td>
                      <td className="py-3 px-4 text-paper/70">{inf.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                          {inf.platform}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                          {inf.segment}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={inf.status} />
                      </td>
                      <td className="py-3 px-4 text-paper/50 text-sm">
                        {inf.last_contacted_at ? new Date(inf.last_contacted_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-paper/50 font-normal">Campaign</th>
                  <th className="text-left py-3 px-4 text-paper/50 font-normal">Type</th>
                  <th className="text-left py-3 px-4 text-paper/50 font-normal">Status</th>
                  <th className="text-left py-3 px-4 text-paper/50 font-normal">Sent</th>
                  <th className="text-left py-3 px-4 text-paper/50 font-normal">Opens</th>
                  <th className="text-left py-3 px-4 text-paper/50 font-normal">Created</th>
                </tr>
              </thead>
              <tbody>
                {campaigns?.campaigns?.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-paper/50">No campaigns yet</td></tr>
                ) : (
                  campaigns?.campaigns?.map((c: any) => (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-paper/50">{c.subject_line}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-gold/20 text-gold text-xs rounded">
                          {c.campaign_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3 px-4">{c.sent_count || 0}</td>
                      <td className="py-3 px-4">{c.open_count || 0}</td>
                      <td className="py-3 px-4 text-paper/50 text-sm">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'signups' && (
        <div className="space-y-4">
          <p className="text-paper/50">
            Creators who signed up through the public form. Approve them to add to your influencer database.
          </p>
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-paper/50 font-normal">Name</th>
                  <th className="text-left py-3 px-4 text-paper/50 font-normal">Email</th>
                  <th className="text-left py-3 px-4 text-paper/50 font-normal">Platform</th>
                  <th className="text-left py-3 px-4 text-paper/50 font-normal">Why Interested</th>
                  <th className="text-left py-3 px-4 text-paper/50 font-normal">Status</th>
                  <th className="text-right py-3 px-4 text-paper/50 font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {creatorSignups?.signups?.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-paper/50">No signups yet</td></tr>
                ) : (
                  creatorSignups?.signups?.map((s: any) => (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-medium">{s.name}</td>
                      <td className="py-3 px-4 text-paper/70">{s.email}</td>
                      <td className="py-3 px-4">{s.platform || '-'}</td>
                      <td className="py-3 px-4 text-paper/50 text-sm max-w-xs truncate">{s.why_interested || '-'}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {s.status === 'NEW' && (
                          <button
                            onClick={() => approveSignupMutation.mutate(s.id)}
                            disabled={approveSignupMutation.isPending}
                            className="btn btn-sm btn-primary"
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'content' && (
        <div className="space-y-4">
          <p className="text-paper/50">
            Store and manage your marketing content, captions, and templates.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content?.content?.length === 0 ? (
              <div className="col-span-full text-center py-8 text-paper/50">No content yet</div>
            ) : (
              content?.content?.map((c: any) => (
                <div key={c.id} className="card p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{c.title}</h4>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                      {c.platform}
                    </span>
                  </div>
                  <p className="text-paper/50 text-sm line-clamp-3">{c.caption || c.body}</p>
                  <div className="flex gap-2 mt-3">
                    <StatusBadge status={c.status} />
                    {c.theme && <span className="text-xs text-paper/40">{c.theme}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showImportModal && (
        <ImportInfluencersModal
          onClose={() => setShowImportModal(false)}
          onImport={(data) => importMutation.mutate(data)}
          isLoading={importMutation.isPending}
        />
      )}

      {showCampaignModal && (
        <CreateCampaignModal
          onClose={() => setShowCampaignModal(false)}
          influencers={influencers?.influencers || []}
        />
      )}

      {showInfluencerModal && (
        <AddInfluencerModal onClose={() => setShowInfluencerModal(false)} />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    NEW: 'bg-blue-500/20 text-blue-400',
    CONTACTED: 'bg-yellow-500/20 text-yellow-400',
    RESPONDED: 'bg-purple-500/20 text-purple-400',
    INTERESTED: 'bg-green-500/20 text-green-400',
    PARTNERED: 'bg-gold/20 text-gold',
    DECLINED: 'bg-red-500/20 text-red-400',
    UNSUBSCRIBED: 'bg-gray-500/20 text-gray-400',
    DRAFT: 'bg-gray-500/20 text-gray-400',
    SENDING: 'bg-yellow-500/20 text-yellow-400',
    COMPLETED: 'bg-green-500/20 text-green-400',
    APPROVED: 'bg-green-500/20 text-green-400',
    CONVERTED: 'bg-gold/20 text-gold',
  };
  return (
    <span className={`px-2 py-1 text-xs rounded ${colors[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {status}
    </span>
  );
}

function ImportInfluencersModal({ onClose, onImport, isLoading }: { 
  onClose: () => void; 
  onImport: (data: any[]) => void;
  isLoading: boolean;
}) {
  const [csvData, setCsvData] = useState('');
  const [previewData, setPreviewData] = useState<any[]>([]);

  const parseCSV = () => {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) return;
    
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: any = {};
      headers.forEach((h, i) => {
        if (h === 'name') obj.name = values[i];
        if (h === 'email') obj.email = values[i];
        if (h === 'platform') obj.platform = values[i]?.toUpperCase();
        if (h === 'handle') obj.handle = values[i];
        if (h === 'segment') obj.segment = values[i]?.toUpperCase();
        if (h === 'followers' || h === 'follower_count') obj.followerCount = parseInt(values[i]) || null;
        if (h === 'profile_url' || h === 'url') obj.profileUrl = values[i];
        if (h === 'notes') obj.notes = values[i];
      });
      return obj;
    }).filter(d => d.name && d.email);
    
    setPreviewData(data);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-void border border-white/10 rounded-lg w-full max-w-3xl p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl">Import Influencers from CSV</h3>
          <button onClick={onClose} className="text-paper/50 hover:text-paper">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-paper/70 mb-2">
              CSV Format: name, email, platform, handle, segment, followers, profile_url, notes
            </label>
            <textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder="name,email,platform,handle,segment,followers,profile_url,notes
John Doe,john@example.com,INSTAGRAM,johndoe,GENEALOGY,50000,https://instagram.com/johndoe,Family history expert"
              className="input w-full h-40 font-mono text-sm"
            />
          </div>

          <button onClick={parseCSV} className="btn btn-secondary">
            Preview Import
          </button>

          {previewData.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-paper/70">{previewData.length} records to import:</div>
              <div className="max-h-48 overflow-y-auto bg-white/[0.02] rounded p-2">
                {previewData.slice(0, 10).map((d, i) => (
                  <div key={i} className="text-sm py-1 border-b border-white/5">
                    {d.name} - {d.email} ({d.platform}, {d.segment})
                  </div>
                ))}
                {previewData.length > 10 && (
                  <div className="text-paper/50 text-sm py-1">...and {previewData.length - 10} more</div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button 
              onClick={() => onImport(previewData)} 
              disabled={previewData.length === 0 || isLoading}
              className="btn btn-primary flex items-center gap-2"
            >
              <Upload size={16} />
              {isLoading ? 'Importing...' : `Import ${previewData.length} Influencers`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateCampaignModal({ onClose, influencers }: { onClose: () => void; influencers: any[] }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'setup' | 'compose' | 'review'>('setup');
  const [formData, setFormData] = useState({
    name: '',
    campaignType: 'INFLUENCER_OUTREACH',
    subjectLine: '',
    targetSegment: '',
    selectedInfluencers: [] as string[],
    bodyHtml: '',
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const campaign = await marketingApi.createCampaign({
        name: formData.name,
        campaignType: formData.campaignType,
        subjectLine: formData.subjectLine,
        targetSegment: formData.targetSegment || undefined,
      });
      return campaign.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
    },
  });

  const sendMutation= useMutation({
    mutationFn: async (campaignId: string) => {
      return marketingApi.sendCampaign(campaignId, {
        segment: formData.targetSegment || undefined,
        influencerIds: formData.selectedInfluencers.length > 0 ? formData.selectedInfluencers : undefined,
        bodyHtml: formData.bodyHtml,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      alert(`Campaign sent! ${data.data.sentCount} emails sent, ${data.data.failedCount} failed.`);
      onClose();
    },
    onError: (error: any) => {
      alert(`Failed to send: ${error.response?.data?.error || error.message}`);
    },
  });

  const applyTemplate = (segment: string) => {
    const template = INFLUENCER_TEMPLATES[segment];
    if (template) {
      setFormData(prev => ({
        ...prev,
        subjectLine: template.subject,
        bodyHtml: template.body,
      }));
    }
  };

  const handleSend = async () => {
    const campaign = await createMutation.mutateAsync();
    await sendMutation.mutateAsync(campaign.id);
  };

  const filteredInfluencers = formData.targetSegment 
    ? influencers.filter(i => i.segment === formData.targetSegment)
    : influencers;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-void border border-white/10 rounded-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl">Create Email Campaign</h3>
          <button onClick={onClose} className="text-paper/50 hover:text-paper">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          {['setup', 'compose', 'review'].map((s, i) => (
            <div key={s} className={`flex items-center gap-2 ${step === s ? 'text-gold' : 'text-paper/50'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                step === s ? 'bg-gold text-void' : 'bg-white/10'
              }`}>{i + 1}</span>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </div>
          ))}
        </div>

        {step === 'setup' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-paper/70 mb-2">Campaign Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Genealogy Influencer Outreach - Dec 2024"
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-paper/70 mb-2">Target Segment (optional)</label>
              <select
                value={formData.targetSegment}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, targetSegment: e.target.value }));
                  if (e.target.value) applyTemplate(e.target.value);
                }}
                className="input w-full"
              >
                <option value="">All Segments</option>
                {SEGMENTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>

            <div className="p-4 bg-white/[0.02] rounded">
              <div className="text-sm text-paper/70 mb-2">
                {formData.targetSegment 
                  ? `${filteredInfluencers.length} influencers in ${formData.targetSegment} segment`
                  : `${influencers.length} total influencers`
                }
              </div>
              <div className="text-xs text-paper/50">
                Only influencers with status NEW, CONTACTED, RESPONDED, or INTERESTED will receive emails.
                Unsubscribed and declined contacts are automatically excluded.
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => setStep('compose')}
                disabled={!formData.name}
                className="btn btn-primary"
              >
                Next: Compose Email
              </button>
            </div>
          </div>
        )}

        {step === 'compose' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-paper/70 mb-2">Subject Line</label>
              <input
                type="text"
                value={formData.subjectLine}
                onChange={(e) => setFormData(prev => ({ ...prev, subjectLine: e.target.value }))}
                placeholder="e.g., Partnership Opportunity: Help Families Preserve Their Stories"
                className="input w-full"
              />
              <div className="text-xs text-paper/50 mt-1">Use [Name] to personalize with recipient's name</div>
            </div>

            <div>
              <label className="block text-sm text-paper/70 mb-2">Email Body (HTML)</label>
              <textarea
                value={formData.bodyHtml}
                onChange={(e) => setFormData(prev => ({ ...prev, bodyHtml: e.target.value }))}
                placeholder="<p>Hi [Name],</p><p>Your email content here...</p>"
                className="input w-full h-64 font-mono text-sm"
              />
              <div className="text-xs text-paper/50 mt-1">
                Use [Name] for personalization. Unsubscribe link is added automatically.
              </div>
            </div>

            {formData.targetSegment && INFLUENCER_TEMPLATES[formData.targetSegment] && (
              <button
                onClick={() => applyTemplate(formData.targetSegment)}
                className="btn btn-secondary text-sm"
              >
                <RefreshCw size={14} className="mr-2" />
                Reset to {formData.targetSegment} Template
              </button>
            )}

            <div className="flex justify-between">
              <button onClick={() => setStep('setup')} className="btn btn-secondary">Back</button>
              <button 
                onClick={() => setStep('review')}
                disabled={!formData.subjectLine || !formData.bodyHtml}
                className="btn btn-primary"
              >
                Next: Review & Send
              </button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <div className="p-4 bg-white/[0.02] rounded space-y-3">
              <div>
                <span className="text-paper/50">Campaign:</span> {formData.name}
              </div>
              <div>
                <span className="text-paper/50">Segment:</span> {formData.targetSegment || 'All'}
              </div>
              <div>
                <span className="text-paper/50">Recipients:</span> {filteredInfluencers.filter(i => 
                  !['UNSUBSCRIBED', 'DECLINED'].includes(i.status)
                ).length} influencers
              </div>
              <div>
                <span className="text-paper/50">Subject:</span> {formData.subjectLine}
              </div>
            </div>

            <div className="p-4 bg-white rounded">
              <div className="text-black text-sm" dangerouslySetInnerHTML={{ __html: formData.bodyHtml }} />
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded">
              <div className="flex items-center gap-2 text-yellow-400 mb-2">
                <AlertTriangle size={16} />
                <span className="font-medium">Ready to send?</span>
              </div>
              <p className="text-paper/70 text-sm">
                This will send emails to all eligible influencers immediately. 
                Emails include an unsubscribe link for compliance.
              </p>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep('compose')} className="btn btn-secondary">Back</button>
              <button 
                onClick={handleSend}
                disabled={createMutation.isPending || sendMutation.isPending}
                className="btn btn-primary flex items-center gap-2"
              >
                <Send size={16} />
                {createMutation.isPending || sendMutation.isPending ? 'Sending...' : 'Send Campaign'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AddInfluencerModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    platform: 'INSTAGRAM',
    handle: '',
    profileUrl: '',
    followerCount: '',
    segment: 'OTHER',
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: () => marketingApi.createInfluencer({
      ...formData,
      followerCount: formData.followerCount ? parseInt(formData.followerCount) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-influencers'] });
      onClose();
    },
    onError: (error: any) => {
      alert(`Failed to add: ${error.response?.data?.error || error.message}`);
    },
  });

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-void border border-white/10 rounded-lg w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl">Add Influencer</h3>
          <button onClick={onClose} className="text-paper/50 hover:text-paper">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-paper/70 mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-paper/70 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-paper/70 mb-2">Platform</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                className="input w-full"
              >
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-paper/70 mb-2">Segment</label>
              <select
                value={formData.segment}
                onChange={(e) => setFormData(prev => ({ ...prev, segment: e.target.value }))}
                className="input w-full"
              >
                {SEGMENTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-paper/70 mb-2">Handle</label>
              <input
                type="text"
                value={formData.handle}
                onChange={(e) => setFormData(prev => ({ ...prev, handle: e.target.value }))}
                placeholder="@username"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-paper/70 mb-2">Followers</label>
              <input
                type="number"
                value={formData.followerCount}
                onChange={(e) => setFormData(prev => ({ ...prev, followerCount: e.target.value }))}
                className="input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-paper/70 mb-2">Profile URL</label>
            <input
              type="url"
              value={formData.profileUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, profileUrl: e.target.value }))}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-paper/70 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="input w-full h-20"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button 
              onClick={() => createMutation.mutate()}
              disabled={!formData.name || !formData.email || createMutation.isPending}
              className="btn btn-primary"
            >
              {createMutation.isPending ? 'Adding...' : 'Add Influencer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketingTab;
