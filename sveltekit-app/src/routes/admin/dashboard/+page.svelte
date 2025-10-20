<script lang="ts">
  import { onMount } from 'svelte';
  import { adminStore } from '$lib/stores/admin';
  import { 
    Users, 
    FileText, 
    DollarSign, 
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Clock,
    Shield
  } from 'lucide-svelte';
  import Chart from '$lib/components/Chart.svelte';
  import StatsCard from '$lib/components/admin/StatsCard.svelte';
  import RecentActivity from '$lib/components/admin/RecentActivity.svelte';
  import SystemHealth from '$lib/components/admin/SystemHealth.svelte';

  let dashboardData: any = null;
  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      dashboardData = await adminStore.getDashboardData();
    } catch (err) {
      error = 'Failed to load dashboard data';
      console.error(err);
    } finally {
      loading = false;
    }
  });

  $: stats = dashboardData?.stats || {};
  $: charts = dashboardData?.charts || {};
  $: recentActivity = dashboardData?.recentActivity || [];
  $: systemHealth = dashboardData?.systemHealth || {};
  $: alerts = dashboardData?.alerts || [];
</script>

<svelte:head>
  <title>Admin Dashboard - Heirloom</title>
</svelte:head>

<div class="space-y-6">
  <!-- Page header -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-3xl font-bold text-base-content">Dashboard</h1>
      <p class="text-base-content/70 mt-1">Welcome back! Here's what's happening with your platform.</p>
    </div>
    <div class="flex gap-2">
      <button class="btn btn-outline">
        <Clock class="w-4 h-4 mr-2" />
        Last 24h
      </button>
      <button class="btn btn-primary">
        Export Report
      </button>
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center items-center h-64">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  {:else if error}
    <div class="alert alert-error">
      <AlertTriangle class="w-5 h-5" />
      <span>{error}</span>
    </div>
  {:else}
    <!-- Key metrics -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Total Users"
        value={stats.totalUsers}
        change={stats.userGrowth}
        icon={Users}
        color="primary"
      />
      <StatsCard
        title="Active Memories"
        value={stats.totalMemories}
        change={stats.memoryGrowth}
        icon={FileText}
        color="secondary"
      />
      <StatsCard
        title="Monthly Revenue"
        value={`$${stats.monthlyRevenue?.toLocaleString()}`}
        change={stats.revenueGrowth}
        icon={DollarSign}
        color="success"
      />
      <StatsCard
        title="Conversion Rate"
        value={`${stats.conversionRate}%`}
        change={stats.conversionChange}
        icon={TrendingUp}
        color="info"
      />
    </div>

    <!-- Alerts -->
    {#if alerts.length > 0}
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title text-error">
            <AlertTriangle class="w-5 h-5" />
            System Alerts
          </h2>
          <div class="space-y-3">
            {#each alerts as alert}
              <div class="alert" class:alert-error={alert.severity === 'high'} class:alert-warning={alert.severity === 'medium'} class:alert-info={alert.severity === 'low'}>
                <span>{alert.message}</span>
                <div class="flex gap-2">
                  <button class="btn btn-sm">View</button>
                  <button class="btn btn-sm btn-outline">Dismiss</button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}

    <!-- Charts and analytics -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- User growth chart -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">User Growth</h2>
          <Chart
            type="line"
            data={charts.userGrowth}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: { beginAtZero: true }
              }
            }}
          />
        </div>
      </div>

      <!-- Revenue chart -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">Revenue Trends</h2>
          <Chart
            type="bar"
            data={charts.revenue}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false }
              }
            }}
          />
        </div>
      </div>

      <!-- Memory types distribution -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">Memory Types</h2>
          <Chart
            type="doughnut"
            data={charts.memoryTypes}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' }
              }
            }}
          />
        </div>
      </div>

      <!-- Subscription tiers -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">Subscription Distribution</h2>
          <Chart
            type="pie"
            data={charts.subscriptions}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' }
              }
            }}
          />
        </div>
      </div>
    </div>

    <!-- Recent activity and system health -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent activity -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">Recent Activity</h2>
          <RecentActivity activities={recentActivity} />
        </div>
      </div>

      <!-- System health -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">
            <Shield class="w-5 h-5" />
            System Health
          </h2>
          <SystemHealth health={systemHealth} />
        </div>
      </div>
    </div>

    <!-- Top performing content -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title">Top Performing Content</h2>
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Memory Title</th>
                <th>Author</th>
                <th>Views</th>
                <th>Engagement</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each dashboardData?.topContent || [] as content}
                <tr>
                  <td>
                    <div class="font-medium">{content.title}</div>
                    <div class="text-sm text-base-content/70">{content.type}</div>
                  </td>
                  <td>{content.author}</td>
                  <td>
                    <div class="badge badge-primary">{content.views}</div>
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="w-16 bg-base-200 rounded-full h-2">
                        <div class="bg-success h-2 rounded-full" style="width: {content.engagement}%"></div>
                      </div>
                      <span class="text-sm">{content.engagement}%</span>
                    </div>
                  </td>
                  <td>{new Date(content.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div class="flex gap-1">
                      <button class="btn btn-xs btn-outline">View</button>
                      <button class="btn btn-xs btn-outline">Edit</button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h2 class="card-title">Quick Actions</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button class="btn btn-outline">
            <Users class="w-4 h-4 mr-2" />
            Manage Users
          </button>
          <button class="btn btn-outline">
            <FileText class="w-4 h-4 mr-2" />
            Review Content
          </button>
          <button class="btn btn-outline">
            <Shield class="w-4 h-4 mr-2" />
            Security Scan
          </button>
          <button class="btn btn-outline">
            <TrendingUp class="w-4 h-4 mr-2" />
            Generate Report
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>