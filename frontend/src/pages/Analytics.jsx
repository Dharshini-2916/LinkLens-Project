import { useParams, useNavigate } from 'react-router-dom';
import { useGetLinkAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { QRCodeCard } from '@/components/QRCodeCard';
import { HealthScoreBadge } from '@/components/HealthScoreBadge';
import { 
  ArrowLeft, 
  MousePointerClick, 
  Calendar, 
  Clock, 
  Monitor, 
  Globe,
  FileDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import dayjs from 'dayjs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function Analytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetLinkAnalytics(id);

  const handleExportCSV = () => {
    if (!data) return;
    const { recentVisits, link } = data.data;
    const headers = ['Timestamp', 'IP Address', 'Country', 'City', 'Browser', 'OS', 'Device', 'Referrer'];
    const rows = recentVisits.map(v => [
      dayjs(v.timestamp).format('YYYY-MM-DD HH:mm:ss'),
      v.ipAddress || 'N/A',
      v.country || 'N/A',
      v.city || 'N/A',
      v.browser || 'Unknown',
      v.os || 'Unknown',
      v.device || 'Unknown',
      v.referrer || 'Direct'
    ]);

    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", encodedUri);
    linkElement.setAttribute("download", `analytics_${link.shortCode}.csv`);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };

  const handleExportPDF = () => {
    if (!data) return;
    const { recentVisits, link } = data.data;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`LinkLens Analytics Report`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Short Code: ${link.customAlias || link.shortCode}`, 14, 32);
    doc.text(`Total Clicks: ${link.clickCount}`, 14, 40);
    doc.text(`Health Score: ${link.healthScore.score} (${link.healthScore.rating})`, 14, 48);
    
    autoTable(doc, {
      startY: 55,
      head: [['Date', 'IP Address', 'Browser', 'OS', 'Device']],
      body: recentVisits.map(v => [
        dayjs(v.timestamp).format('MMM D, YYYY HH:mm'),
        v.ipAddress || 'N/A',
        v.browser || 'Unknown',
        v.os || 'Unknown',
        v.device || 'Unknown'
      ]),
    });

    doc.save(`analytics_${link.shortCode}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="w-32 h-10" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-2">Failed to load analytics</h2>
        <p className="text-muted-foreground mb-6">Please check if the link exists and you have access.</p>
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  const { link, trends, recentVisits, deviceBreakdown = [], browserBreakdown = [], countryBreakdown = [], referrerBreakdown = [] } = data.data;
  const shortCode = link.customAlias || link.shortCode;
  const fullShortUrl = `${import.meta.env.VITE_SHORT_URL_BASE || 'https://linklens-backend.onrender.com'}/${shortCode}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              Analytics for <span className="text-primary">/{shortCode}</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{link.originalUrl}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <FileDown className="w-4 h-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF} className="gap-2">
            <FileDown className="w-4 h-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Top Stats & QR Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MousePointerClick className="w-4 h-4" /> Total Clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{link.clickCount}</div>
            </CardContent>
          </Card>
          
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Last Visited
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {link.lastVisited ? dayjs(link.lastVisited).format('MMM D, YYYY') : 'Never'}
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Created
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {dayjs(link.createdAt).format('MMM D, YYYY')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Health Score */}
        <div className="lg:col-span-1">
          <HealthScoreBadge score={link.healthScore.score} rating={link.healthScore.rating} />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chart & Recent Visits */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Click Trends (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {trends.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No click data available yet.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                    <AreaChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="clicks" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1} 
                        fill="url(#colorClicks)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Device & Browser Breakdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-primary" /> Device Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {deviceBreakdown.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">No device data.</div>
                ) : (
                  deviceBreakdown.map((d, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="capitalize">{d._id || 'Other'}</span>
                        <span className="text-primary">{d.count} ({Math.round((d.count / (link.clickCount || 1)) * 100)}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div 
                          className="bg-primary h-1.5 rounded-full"
                          style={{ width: `${(d.count / (link.clickCount || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Geolocation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {countryBreakdown.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">No location data.</div>
                ) : (
                  countryBreakdown.slice(0, 5).map((c, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{c._id || 'Unknown'}</span>
                        <span className="text-primary">{c.count} ({Math.round((c.count / (link.clickCount || 1)) * 100)}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div 
                          className="bg-primary h-1.5 rounded-full"
                          style={{ width: `${(c.count / (link.clickCount || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Browser & Referrer Breakdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base">Browsers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {browserBreakdown.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">No browser metrics.</div>
                ) : (
                  browserBreakdown.map((b, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs border-b border-border/30 pb-1.5">
                      <span className="font-semibold">{b._id || 'Unknown'}</span>
                      <span className="text-muted-foreground">{b.count} Clicks</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base">Traffic Channels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {referrerBreakdown.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">No traffic channel details.</div>
                ) : (
                  referrerBreakdown.slice(0, 5).map((ref, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs border-b border-border/30 pb-1.5">
                      <span className="font-semibold truncate max-w-[150px]" title={ref._id}>
                        {ref._id === 'Direct' ? 'Direct/Email/SMS' : ref._id}
                      </span>
                      <span className="text-muted-foreground">{ref.count} Clicks</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Visits Table */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Recent Visits</CardTitle>
            </CardHeader>
            <CardContent>
              {recentVisits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No recent visits.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left p-3">Time</th>
                        <th className="text-left p-3 hidden sm:table-cell">Location</th>
                        <th className="text-left p-3">Device</th>
                        <th className="text-left p-3 hidden md:table-cell">Browser</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentVisits.map((visit, index) => (
                        <tr key={index} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="p-3 text-foreground">
                            {dayjs(visit.timestamp).format('MMM D, HH:mm')}
                          </td>
                          <td className="p-3 hidden sm:table-cell text-muted-foreground">
                            {visit.city && visit.country ? `${visit.city}, ${visit.country}` : 'Unknown'}
                          </td>
                          <td className="p-3">
                            <Badge variant="secondary" className="capitalize">{visit.device}</Badge>
                          </td>
                          <td className="p-3 hidden md:table-cell text-muted-foreground">
                            {visit.browser || 'Unknown'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: QR Code & Details */}
        <div className="lg:col-span-1 space-y-6">
          <QRCodeCard shortUrl={fullShortUrl} />
          
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">Link Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge variant={link.status === 'Active' ? 'success' : link.status === 'Expired' ? 'warning' : 'destructive'}>
                  {link.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Expiry Date</p>
                <p className="text-sm font-medium">
                  {link.expiryDate ? dayjs(link.expiryDate).format('MMM D, YYYY') : 'Never Expires'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Short URL</p>
                <p className="text-sm font-medium text-primary break-all">{fullShortUrl}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}