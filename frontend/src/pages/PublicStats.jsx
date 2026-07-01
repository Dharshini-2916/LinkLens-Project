import { useParams, useNavigate } from 'react-router-dom';
import { useGetPublicLinkAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  MousePointerClick, 
  Calendar, 
  Clock, 
  Monitor, 
  Globe,
  Link2,
  AlertCircle
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

export function PublicStats() {
  const { shortCode } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetPublicLinkAnalytics(shortCode);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl space-y-6">
          <Skeleton className="w-32 h-10" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 glass rounded-2xl border border-red-500/20 space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold">Stats Unavailable</h2>
          <p className="text-muted-foreground">
            This link does not exist, or the owner has disabled public analytics access.
          </p>
          <Button onClick={() => navigate('/')} className="w-full">Back to Home</Button>
        </div>
      </div>
    );
  }

  const { link, trends, deviceBreakdown, browserBreakdown, countryBreakdown, referrerBreakdown } = data.data;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-primary font-semibold">
              <Link2 className="w-4 h-4" /> LinkLens Public Stats
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Statistics for <span className="text-primary">/{shortCode}</span>
            </h1>
            <p className="text-muted-foreground text-sm truncate max-w-lg" title={link.originalUrl}>
              Destination: {link.originalUrl}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/login')} className="self-start">
            Create Your Own Link
          </Button>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <MousePointerClick className="w-4 h-4" /> Total Redirects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{link.clickCount}</div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4" /> Last Click
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {link.lastVisited ? dayjs(link.lastVisited).format('MMM D, YYYY') : 'Never'}
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Created Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {dayjs(link.createdAt).format('MMM D, YYYY')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Analytics Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Trend Chart */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Click Trends (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                {trends.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No clicks recorded in the last 30 days.
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                      <AreaChart data={trends} margin={{ top: 10, right: 3, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorClicksPublic" x1="0" y1="0" x2="0" y2="1">
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
                          fill="url(#colorClicksPublic)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Geographical Analytics */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Geographic Location</CardTitle>
              </CardHeader>
              <CardContent>
                {countryBreakdown.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">No location data.</div>
                ) : (
                  <div className="space-y-4">
                    {countryBreakdown.map((c, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium flex items-center gap-2">
                            <Globe className="w-4 h-4 text-primary" /> {c._id || 'Unknown'}
                          </span>
                          <span className="text-muted-foreground font-semibold">{c.count} Clicks</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${(c.count / link.clickCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Breakdowns: Devices, Browsers, Referrers */}
          <div className="space-y-6">
            
            {/* Device Pie Chart */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Devices</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {deviceBreakdown.length === 0 ? (
                  <div className="text-muted-foreground py-6">No device metrics.</div>
                ) : (
                  <div className="w-full space-y-4">
                    {deviceBreakdown.map((d, i) => (
                      <div key={i} className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                        <span className="capitalize font-medium flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-primary" /> {d._id || 'Other'}
                        </span>
                        <span className="font-semibold">{d.count} ({Math.round((d.count / link.clickCount) * 100)}%)</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Referrer breakdown */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Top Referrers</CardTitle>
              </CardHeader>
              <CardContent>
                {referrerBreakdown.length === 0 ? (
                  <div className="text-muted-foreground text-center py-6">No referrer details.</div>
                ) : (
                  <div className="space-y-3">
                    {referrerBreakdown.map((ref, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="truncate max-w-[180px] font-medium" title={ref._id}>
                          {ref._id === 'Direct' ? 'Direct/Email/SMS' : ref._id}
                        </span>
                        <Badge variant="secondary">{ref.count} Clicks</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Browser info */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Browsers</CardTitle>
              </CardHeader>
              <CardContent>
                {browserBreakdown.length === 0 ? (
                  <div className="text-muted-foreground text-center py-6">No browser metrics.</div>
                ) : (
                  <div className="space-y-3">
                    {browserBreakdown.map((b, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="font-medium">{b._id || 'Unknown'}</span>
                        <span className="text-muted-foreground font-semibold">{b.count} clicks</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
