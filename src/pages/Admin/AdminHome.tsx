// /admin — a tela inicial: tráfego, leads, cadastros e o mapa de cliques.
//
// Era o bloco `activeTab === 'dashboard'` de Dashboard.tsx. Virou página
// própria quando o painel passou a ter rotas (AdminLayout): assim o analytics
// só carrega quando alguém abre o dashboard, e não a cada visita ao painel.

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend
} from 'recharts';
import WorldMap from '../../components/WorldMap';
import styles from './Admin.module.css';

interface UserProfile {
  id: string; full_name: string; email?: string; role: string;
  phone: string | null; is_approved: boolean; created_at: string;
}

type PeriodType = 'today' | '7d' | 'month' | 'quarter' | 'semester' | 'year';

const PERIOD_LABELS: Record<PeriodType, string> = {
  today: 'Hoje', '7d': '7 dias', month: 'Mês', quarter: 'Trimestre', semester: 'Semestre', year: 'Ano'
};

const CHART_COLORS = ['#D4A853', '#25D366', '#4A90D9', '#ff4444', '#f5a623', '#00C9A7', '#845EC2', '#FF6F91'];

function getPeriodStart(period: PeriodType): string {
  const now = new Date();
  switch (period) {
    case 'today': return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    case '7d': return new Date(now.getTime() - 7 * 86400000).toISOString();
    case 'month': return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    case 'quarter': return new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
    case 'semester': return new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();
    case 'year': return new Date(now.getFullYear(), 0, 1).toISOString();
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m${s > 0 ? ` ${s}s` : ''}`;
}

export default function AdminHome() {
  // Dashboard analytics state
  const [period, setPeriod] = useState<PeriodType>('month');
  const [analytics, setAnalytics] = useState<{
    uniqueVisitors: number; pageViews: number; avgDuration: number; bounceRate: number;
    leadsCount: number; leadsPending: number; leadsAttended: number; conversionRate: number;
    newSignups: number; pendingApproval: number;
  }>({
    uniqueVisitors: 0, pageViews: 0, avgDuration: 0, bounceRate: 0,
    leadsCount: 0, leadsPending: 0, leadsAttended: 0, conversionRate: 0,
    newSignups: 0, pendingApproval: 0,
  });
  const [visitorsChart, setVisitorsChart] = useState<{ date: string; visitors: number; views: number }[]>([]);
  const [leadsBySource, setLeadsBySource] = useState<{ name: string; value: number }[]>([]);
  const [topPages, setTopPages] = useState<{ page: string; views: number }[]>([]);
  const [leadsVsVisitors, setLeadsVsVisitors] = useState<{ date: string; leads: number; visitors: number }[]>([]);
  const [heatmapData, setHeatmapData] = useState<{ x: number; y: number; value: number }[]>([]);
  const [heatmapPage, setHeatmapPage] = useState('/');
  const [availablePages, setAvailablePages] = useState<string[]>([]);
  const heatmapRef = useRef<HTMLCanvasElement>(null);
  const heatmapContainerRef = useRef<HTMLDivElement>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [geoData, setGeoData] = useState<{ latitude: number; longitude: number; city: string; country: string; sessions: number }[]>([]);

  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);

  const carregarPendentes = useCallback(async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role, phone, is_approved, created_at')
      .neq('role', 'admin')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });
    setPendingUsers((data ?? []) as UserProfile[]);
  }, []);

  useEffect(() => {
    // Carga inicial: buscar no banco é efeito de verdade; o estado da tela é
    // consequência da resposta.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarPendentes();
  }, [carregarPendentes]);

  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    const since = getPeriodStart(period);

    try {
      // Fetch all analytics events for the period
      const { data: events } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: true });

      const allEvents = events || [];

      // KPIs
      const pageViews = allEvents.filter(e => e.event_type === 'page_view');
      const sessions = new Set(allEvents.map(e => e.session_id));
      const sessionEnds = allEvents.filter(e => e.event_type === 'session_end');
      const clicks = allEvents.filter(e => e.event_type === 'click');

      // Bounce: sessions with only 1 page_view
      const sessionPageCounts: Record<string, number> = {};
      pageViews.forEach(e => { sessionPageCounts[e.session_id] = (sessionPageCounts[e.session_id] || 0) + 1; });
      const totalSessions = Object.keys(sessionPageCounts).length;
      const bounceSessions = Object.values(sessionPageCounts).filter(c => c === 1).length;
      const bounceRate = totalSessions > 0 ? Math.round((bounceSessions / totalSessions) * 100) : 0;

      // Avg duration
      const durations = sessionEnds.map(e => e.session_duration || 0).filter(d => d > 0);
      const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

      // Leads in period
      const { data: periodLeads } = await supabase.from('leads').select('*').gte('created_at', since);
      const pLeads = periodLeads || [];
      const leadsCount = pLeads.length;
      const leadsPending = pLeads.filter(l => l.status === 'pending').length;
      const leadsAttended = pLeads.filter(l => l.status === 'attended').length;
      const conversionRate = sessions.size > 0 ? Math.round((leadsCount / sessions.size) * 10000) / 100 : 0;

      // New signups in period
      const { data: newUsers } = await supabase.from('user_profiles').select('id, is_approved, created_at')
        .in('role', ['client', 'reseller']).gte('created_at', since);
      const nUsers = newUsers || [];
      const newSignups = nUsers.length;
      const pendingApproval = nUsers.filter(u => !u.is_approved).length;

      setAnalytics({
        uniqueVisitors: sessions.size, pageViews: pageViews.length,
        avgDuration, bounceRate, leadsCount, leadsPending, leadsAttended,
        conversionRate, newSignups, pendingApproval,
      });

      // Charts — Visitors by date
      const dailyMap: Record<string, { visitors: Set<string>; views: number; leads: number }> = {};
      pageViews.forEach(e => {
        const day = e.created_at.slice(0, 10);
        if (!dailyMap[day]) dailyMap[day] = { visitors: new Set(), views: 0, leads: 0 };
        dailyMap[day].visitors.add(e.session_id);
        dailyMap[day].views++;
      });
      pLeads.forEach(l => {
        const day = l.created_at.slice(0, 10);
        if (!dailyMap[day]) dailyMap[day] = { visitors: new Set(), views: 0, leads: 0 };
        dailyMap[day].leads++;
      });

      const sortedDays = Object.keys(dailyMap).sort();
      setVisitorsChart(sortedDays.map(d => ({
        date: new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        visitors: dailyMap[d].visitors.size, views: dailyMap[d].views,
      })));
      setLeadsVsVisitors(sortedDays.map(d => ({
        date: new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        leads: dailyMap[d].leads, visitors: dailyMap[d].visitors.size,
      })));

      // Leads by source
      const sourceMap: Record<string, number> = {};
      pLeads.forEach(l => { const s = l.source || 'Direto'; sourceMap[s] = (sourceMap[s] || 0) + 1; });
      setLeadsBySource(Object.entries(sourceMap).map(([name, value]) => ({ name, value })));

      // Top pages
      const pageMap: Record<string, number> = {};
      pageViews.forEach(e => { pageMap[e.page] = (pageMap[e.page] || 0) + 1; });
      const sorted = Object.entries(pageMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
      setTopPages(sorted.map(([page, views]) => ({ page, views })));
      setAvailablePages(sorted.map(([page]) => page));

      // Heatmap data
      const pageClicks = clicks.filter(c => c.page === heatmapPage);
      const heatPoints: { x: number; y: number; value: number }[] = [];
      const pointMap: Record<string, number> = {};
      pageClicks.forEach(c => {
        if (c.x_percent != null && c.y_percent != null) {
          const key = `${Math.round(c.x_percent)}_${Math.round(c.y_percent)}`;
          pointMap[key] = (pointMap[key] || 0) + 1;
        }
      });
      Object.entries(pointMap).forEach(([key, count]) => {
        const [xStr, yStr] = key.split('_');
        heatPoints.push({ x: parseInt(xStr), y: parseInt(yStr), value: count });
      });
      setHeatmapData(heatPoints);

      // Geo map data
      const geoMap: Record<string, { lat: number; lng: number; city: string; country: string; sessions: Set<string> }> = {};
      allEvents.forEach(e => {
        if (e.latitude && e.longitude && e.country) {
          const key = `${e.country}_${e.city || 'unknown'}`;
          if (!geoMap[key]) geoMap[key] = { lat: e.latitude, lng: e.longitude, city: e.city || '', country: e.country, sessions: new Set() };
          geoMap[key].sessions.add(e.session_id);
        }
      });
      setGeoData(Object.values(geoMap).map(g => ({
        latitude: g.lat, longitude: g.lng, city: g.city, country: g.country, sessions: g.sessions.size,
      })));

    } catch (err) {
      console.error('Analytics load error:', err);
    }
    setLoadingAnalytics(false);
  }, [period, heatmapPage]);

  // Render heatmap overlay on canvas (positioned over iframe)
  useEffect(() => {
    if (!heatmapRef.current || !heatmapContainerRef.current) return;
    const canvas = heatmapRef.current;
    const container = heatmapContainerRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = container.clientWidth;
    const h = container.clientHeight || 500;
    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);

    if (heatmapData.length === 0) return;

    const maxVal = Math.max(...heatmapData.map(d => d.value), 1);

    // Draw heat points
    heatmapData.forEach(point => {
      const px = (point.x / 100) * w;
      const py = (point.y / 100) * h;
      const intensity = point.value / maxVal;
      const radius = 25 + intensity * 45;

      const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);

      // High intensity = red, medium = yellow, low = green
      if (intensity > 0.7) {
        gradient.addColorStop(0, `rgba(255, 0, 0, ${0.5 + intensity * 0.3})`);
        gradient.addColorStop(0.3, `rgba(255, 80, 0, ${0.3 + intensity * 0.2})`);
        gradient.addColorStop(0.7, `rgba(255, 180, 0, 0.1)`);
        gradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
      } else if (intensity > 0.3) {
        gradient.addColorStop(0, `rgba(255, 180, 0, ${0.4 + intensity * 0.3})`);
        gradient.addColorStop(0.4, `rgba(255, 220, 0, ${0.2 + intensity * 0.15})`);
        gradient.addColorStop(1, 'rgba(200, 255, 0, 0)');
      } else {
        gradient.addColorStop(0, `rgba(0, 200, 100, ${0.3 + intensity * 0.3})`);
        gradient.addColorStop(0.5, `rgba(0, 255, 150, 0.1)`);
        gradient.addColorStop(1, 'rgba(0, 255, 100, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Legend bar at top
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, w, 28);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`🔥 ${heatmapData.length} zona${heatmapData.length > 1 ? 's' : ''} de clique  •  Página: ${heatmapPage}`, 10, 18);

    // Gradient legend bar
    const lgW = 120;
    const lgX = w - lgW - 16;
    const lgGrad = ctx.createLinearGradient(lgX, 0, lgX + lgW, 0);
    lgGrad.addColorStop(0, '#00c864');
    lgGrad.addColorStop(0.5, '#ffc800');
    lgGrad.addColorStop(1, '#ff0000');
    ctx.fillStyle = lgGrad;
    ctx.fillRect(lgX, 9, lgW, 10);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.strokeRect(lgX, 9, lgW, 10);
    ctx.fillStyle = '#aaa';
    ctx.font = '9px monospace';
    ctx.fillText('menos', lgX, 7);
    ctx.fillText('mais', lgX + lgW - 22, 7);
  }, [heatmapData, heatmapPage]);

  useEffect(() => {
    // Carga inicial: buscar no banco é efeito de verdade; o estado da tela é
    // consequência da resposta.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAnalytics();
  }, [loadAnalytics]);

  const approveUser = async (userId: string) => {
    await supabase.from('user_profiles').update({ is_approved: true }).eq('id', userId);
    await carregarPendentes();
  };

  const denyUser = async (userId: string) => {
    await supabase.from('user_profiles').update({ is_approved: false }).eq('id', userId);
    await carregarPendentes();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

  const getRoleBadge = (role: string) => {
    if (role === 'admin') return <span className={`${styles.badge} ${styles.badgeAdmin}`}>Admin</span>;
    if (role === 'reseller') return <span className={`${styles.badge} ${styles.badgeReseller}`}>Revendedor</span>;
    return <span className={styles.badge}>Cliente</span>;
  };

  const customTooltipStyle = {
    backgroundColor: 'rgba(15, 15, 18, 0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0',
    color: '#fff',
    fontSize: '0.75rem',
  };

  return (
    <>
        {/* Period Filters */}
        <div className={styles.periodFilters}>
          {(Object.keys(PERIOD_LABELS) as PeriodType[]).map(p => (
            <button
              key={p}
              className={`${styles.periodBtn} ${period === p ? styles.periodBtnActive : ''}`}
              onClick={() => setPeriod(p)}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {loadingAnalytics && <div className={styles.loadingBar}><div className={styles.loadingBarInner} /></div>}

        {/* KPI Row 1: Traffic */}
        <div className={styles.kpiSectionTitle}>📡 Tráfego & Engajamento</div>
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>👤</div>
            <div className={styles.metricLabel}>Visitantes Únicos</div>
            <div className={styles.metricValue}>{analytics.uniqueVisitors.toLocaleString('pt-BR')}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>👁️</div>
            <div className={styles.metricLabel}>Page Views</div>
            <div className={styles.metricValue}>{analytics.pageViews.toLocaleString('pt-BR')}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>⏱️</div>
            <div className={styles.metricLabel}>Tempo Médio</div>
            <div className={styles.metricValue}>{formatDuration(analytics.avgDuration)}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>↩️</div>
            <div className={styles.metricLabel}>Bounce Rate</div>
            <div className={`${styles.metricValue} ${analytics.bounceRate > 70 ? styles.metricValueWarning : ''}`}>{analytics.bounceRate}%</div>
          </div>
        </div>

        {/* KPI Row 2: Leads */}
        <div className={styles.kpiSectionTitle}>🎯 Captação de Leads</div>
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>📩</div>
            <div className={styles.metricLabel}>Leads Captados</div>
            <div className={styles.metricValue}>{analytics.leadsCount}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>🟡</div>
            <div className={styles.metricLabel}>Pendentes</div>
            <div className={`${styles.metricValue} ${analytics.leadsPending > 0 ? styles.metricValueWarning : ''}`}>{analytics.leadsPending}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>✅</div>
            <div className={styles.metricLabel}>Atendidos</div>
            <div className={styles.metricValue}>{analytics.leadsAttended}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>📈</div>
            <div className={styles.metricLabel}>Conversão</div>
            <div className={styles.metricValue}>{analytics.conversionRate}%</div>
          </div>
        </div>

        {/* KPI Row 3: Signups */}
        <div className={styles.kpiSectionTitle}>👥 Cadastros</div>
        <div className={styles.metricsGrid} style={{ gridTemplateColumns: 'repeat(2, 1fr)', maxWidth: '480px' }}>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>🆕</div>
            <div className={styles.metricLabel}>Novos Cadastros</div>
            <div className={styles.metricValue}>{analytics.newSignups}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>⏳</div>
            <div className={styles.metricLabel}>Pendentes Aprovação</div>
            <div className={`${styles.metricValue} ${analytics.pendingApproval > 0 ? styles.metricValueWarning : ''}`}>{analytics.pendingApproval}</div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Visitantes por Dia</h3>
            {visitorsChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={visitorsChart}>
                  <defs>
                    <linearGradient id="gradVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4A853" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#D4A853" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Area type="monotone" dataKey="visitors" stroke="#D4A853" fill="url(#gradVisitors)" strokeWidth={2} name="Visitantes" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.chartEmpty}>Sem dados de tráfego para o período selecionado</div>
            )}
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Leads por Origem</h3>
            {leadsBySource.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={leadsBySource} cx="50%" cy="50%"
                    innerRadius={55} outerRadius={90}
                    paddingAngle={3} dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {leadsBySource.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={customTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.chartEmpty}>Nenhum lead no período</div>
            )}
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Top 10 Páginas</h3>
            {topPages.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(260, topPages.length * 32)}>
                <BarChart data={topPages} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <YAxis dataKey="page" type="category" tick={{ fill: '#ccc', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} width={80} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Bar dataKey="views" fill="#D4A853" name="Views" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.chartEmpty}>Sem dados de páginas</div>
            )}
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Leads vs Visitantes</h3>
            {leadsVsVisitors.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={leadsVsVisitors}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#888' }} />
                  <Line type="monotone" dataKey="visitors" stroke="#D4A853" strokeWidth={2} dot={false} name="Visitantes" />
                  <Line type="monotone" dataKey="leads" stroke="#25D366" strokeWidth={2} dot={false} name="Leads" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.chartEmpty}>Sem dados comparativos</div>
            )}
          </div>
        </div>

        {/* World Map */}
        <div className={styles.chartCard} style={{ marginTop: '1.5rem' }}>
          <h3 className={styles.chartTitle}>🌍 Localização dos Acessos</h3>
          <WorldMap data={geoData} />
        </div>

        {/* Heatmap */}
        <div className={styles.chartCard} style={{ marginTop: '1.5rem' }}>
          <div className={styles.heatmapHeader}>
            <h3 className={styles.chartTitle}>🔥 Mapa Térmico de Cliques</h3>
            <select
              className={styles.heatmapSelect}
              value={heatmapPage}
              onChange={e => { setHeatmapPage(e.target.value); }}
            >
              <option value="/">/ (Home)</option>
              <option value="/ppf">/ppf</option>
              <option value="/ppf/luxury-gloss">/ppf/luxury-gloss</option>
              <option value="/ppf/prime-gloss">/ppf/prime-gloss</option>
              <option value="/wrap">/wrap</option>
              <option value="/sobre">/sobre</option>
              {availablePages.filter(p => !['/','/ppf','/ppf/luxury-gloss','/ppf/prime-gloss','/wrap','/sobre'].includes(p)).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div
            className={styles.heatmapContainer}
            ref={heatmapContainerRef}
            style={{ position: 'relative', height: '500px', overflow: 'hidden' }}
          >
            {/* Page preview as background */}
            <iframe
              src={`${window.location.origin}${heatmapPage}`}
              title="Page preview"
              style={{
                width: '100%',
                height: '2000px',
                border: 'none',
                pointerEvents: 'none',
                opacity: 0.25,
                position: 'absolute',
                top: 0,
                left: 0,
                transformOrigin: 'top left',
              }}
              sandbox="allow-same-origin allow-scripts"
              loading="lazy"
            />
            {/* Canvas overlay with heat data */}
            <canvas
              ref={heatmapRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            />
            {heatmapData.length === 0 && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.5)',
                zIndex: 3,
              }}>
                <span style={{ fontSize: '2.5rem', opacity: 0.5, marginBottom: '0.75rem' }}>🔥</span>
                <p style={{ color: '#999', fontSize: '0.85rem', margin: 0 }}>
                  Sem dados de cliques para "{heatmapPage}" no período
                </p>
                <p style={{ color: '#666', fontSize: '0.7rem', marginTop: '0.4rem' }}>
                  As manchas de calor aparecerão sobre a página conforme visitantes clicam
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pending approvals quick view */}
        {pendingUsers.length > 0 && (
          <div className={styles.tableSection} style={{ marginTop: '2rem' }}>
            <h3 className={styles.tableSectionTitle}>🟡 Cadastros Pendentes de Aprovação</h3>
            <table className={styles.table}>
              <thead><tr><th>Nome</th><th>Email</th><th>Telefone</th><th>Tipo</th><th>Data</th><th>Ações</th></tr></thead>
              <tbody>
                {pendingUsers.map(u => (
                  <tr key={u.id}>
                    <td>{u.full_name || '—'}</td>
                    <td>{u.email || '—'}</td>
                    <td>{u.phone || '—'}</td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td>{formatDate(u.created_at)}</td>
                    <td>
                      <button className={`${styles.actionBtn} ${styles.actionBtnApprove}`} onClick={() => approveUser(u.id)}>✅ Aprovar</button>
                      <button className={`${styles.actionBtn} ${styles.actionBtnDeny}`} onClick={() => denyUser(u.id)}>❌ Negar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </>
  );
}
