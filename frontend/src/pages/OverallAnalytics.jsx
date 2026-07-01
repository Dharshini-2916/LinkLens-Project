import { useNavigate } from 'react-router-dom';
import { useGetOverallAnalytics } from '@/hooks/useAnalytics';
import { useGetLinks } from '@/hooks/useLinks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  MousePointerClick, 
  Monitor, 
  Globe,
  Link2,
  TrendingUp,
  Share2
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

export function OverallAnalytics() {
  const navigate = useNavigate();
  const { data: overallData, isLoading: isOverallLoading, isError: isOverallError } = useGetOverallAnalytics();
  const { data: linksData } = useGetLinks();

  const handleLinkSelectChange = (e) => {
    const value = e.target.value;
    if (value) {
      navigate(`/dashboard/analytics/${value}`);
    }
  };

  if (isOverallLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="w-48 h-10" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isOverallError || !overallData) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-2">Failed to load analytics</h2>
        <p className="text-muted-foreground mb-6">Please check your internet connection or try reloading.</p>
      </div>
    );
  }

  const { totalLinks, totalClicks, trends, deviceBreakdown, countryBreakdown, referrerBreakdown, recentVisits } = overallData.data;
  const links = linksData?.links || [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System-Wide Analytics</h1>
          <p className="text-muted-foreground">Aggregated performance details across your entire link network.</p>
        </div>

        {/* Link Selector */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">View Specific Link:</label>
          <select 
            value=""
            onChange={handleLinkSelectChange}
            className="h-10 px-3 pr-8 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all w-full sm:w-64"
          >
            <option value="">-- Choose a shortened link --</option>
            {links.map((link) => (
              <option key={link._id} value={link._id}>
                /{link.customAlias || link.shortCode} → {link.originalUrl.substring(0, 30)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Aggregate Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" /> Total Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalLinks}</div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-primary" /> Total Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalClicks}</div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Average Clicks / Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalLinks > 0 ? (totalClicks / totalLinks).toFixed(1) : 0}
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> Geo Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{countryBreakdown.length} Countries</div>
          </CardContent>
        </Card>
      </div>

      {/* Trend area chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Combined Click History (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {trends.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No clicks recorded across your links in the last 30 days.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                    <AreaChart data={trends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={11} 
                        tickLine={false} 
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={11} 
                        tickLine={false} 
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
                        fill="url(#colorOverall)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Visits */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Recent Visits</CardTitle>
              <CardDescription>Real-time updates of visitor redirects.</CardDescription>
            </CardHeader>
            <CardContent>
              {recentVisits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No traffic logs found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left p-3">Time</th>
                        <th className="text-left p-3">Short URL</th>
                        <th className="text-left p-3 hidden sm:table-cell">Location</th>
                        <th className="text-left p-3">Device</th>
                        <th className="text-left p-3 hidden md:table-cell">Referrer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentVisits.map((visit, index) => {
                        const code = visit.link?.customAlias || visit.link?.shortCode || 'deleted';
                        return (
                          <tr key={index} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="p-3 text-foreground font-medium">
                              {dayjs(visit.timestamp).format('MMM D, HH:mm')}
                            </td>
                            <td className="p-3 text-primary font-mono">
                              /{code}
                            </td>
                            <td className="p-3 hidden sm:table-cell text-muted-foreground">
                              {visit.city && visit.country ? `${visit.city}, ${visit.country}` : 'Unknown'}
                            </td>
                            <td className="p-3">
                              <Badge variant="secondary" className="capitalize">{visit.device}</Badge>
                            </td>
                            <td className="p-3 hidden md:table-cell text-muted-foreground truncate max-w-[120px]" title={visit.referrer}>
                              {visit.referrer === 'Direct' ? 'Direct' : visit.referrer}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Columns: Breakdowns */}
        <div className="space-y-6">
          {/* Countries */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" /> Geolocation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {countryBreakdown.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">No geolocation data.</div>
              ) : (
                countryBreakdown.slice(0, 5).map((c, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{c._id || 'Unknown'}</span>
                      <span className="text-primary">{c.count} ({Math.round((c.count / totalClicks) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className="bg-primary h-1.5 rounded-full"
                        style={{ width: `${(c.count / totalClicks) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Devices */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Monitor className="w-4 h-4 text-primary" /> Device Types
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
                      <span className="text-primary">{d.count}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className="bg-primary h-1.5 rounded-full"
                        style={{ width: `${(d.count / totalClicks) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Referrers */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Share2 className="w-4 h-4 text-primary" /> Traffic Channels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {referrerBreakdown.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">No traffic channel details.</div>
              ) : (
                referrerBreakdown.slice(0, 5).map((ref, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="truncate max-w-[150px] font-medium" title={ref._id}>
                      {ref._id === 'Direct' ? 'Direct/Email/SMS' : ref._id}
                    </span>
                    <Badge variant="secondary">{ref.count} Clicks</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
