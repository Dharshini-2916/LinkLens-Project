import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Link2, 
  MousePointerClick, 
  Calendar, 
  Copy, 
  Trash2, 
  BarChart3, 
  Plus, 
  Search,
  ExternalLink,
  QrCode,
  Edit,
  Upload,
  FileDown
} from 'lucide-react';
import { useGetLinks, useDeleteLink } from '@/hooks/useLinks';
import { CreateLinkModal } from '@/components/CreateLinkModal';
import { EditLinkModal } from '@/components/EditLinkModal';
import { BulkUploadModal } from '@/components/BulkUploadModal';
import { QRCodeModal } from '@/components/QRCodeModal';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

dayjs.extend(relativeTime);

const shortUrl = import.meta.env.VITE_SHORT_URL_BASE || "https://linklens-backend.onrender.com";

export function Dashboard() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [linkToEdit, setLinkToEdit] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  const { data: linksData, isLoading, isError } = useGetLinks();
  const deleteLinkMutation = useDeleteLink();

  const links = linksData?.links || [];

  const calculateLinkHealth = (link) => {
    let score = 0;
    const now = new Date();
    const created = new Date(link.createdAt);
    const ageInDays = Math.ceil((now - created) / (1000 * 60 * 60 * 24));

    // Clicks (max 40)
    if (link.clickCount >= 100) score += 40;
    else if (link.clickCount >= 50) score += 30;
    else if (link.clickCount >= 20) score += 20;
    else if (link.clickCount >= 5) score += 10;

    // Age (max 20)
    if (ageInDays <= 7) score += 20;
    else if (ageInDays <= 30) score += 15;
    else if (ageInDays <= 90) score += 10;
    else score += 5;

    // Status (max 20)
    if (link.status === 'Active') score += 20;
    else if (link.status === 'Expired') score += 5;

    // Last Visit (max 20)
    if (link.lastVisited) {
      const lastVisit = new Date(link.lastVisited);
      const daysSinceLastVisit = Math.ceil((now - lastVisit) / (1000 * 60 * 60 * 24));
      if (daysSinceLastVisit <= 1) score += 20;
      else if (daysSinceLastVisit <= 7) score += 15;
      else if (daysSinceLastVisit <= 30) score += 10;
      else score += 5;
    }

    let rating = 'Poor';
    let variant = 'destructive';
    if (score >= 80) {
      rating = 'Excellent';
      variant = 'success';
    } else if (score >= 60) {
      rating = 'Good';
      variant = 'default';
    } else if (score >= 40) {
      rating = 'Average';
      variant = 'warning';
    }

    return { score, rating, variant };
  };

  const filteredLinks = links
    .filter(link => {
      const matchesSearch = 
        link.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.shortCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (link.customAlias && link.customAlias.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || link.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === 'most-clicked') {
        return (b.clickCount || 0) - (a.clickCount || 0);
      }
      if (sortBy === 'least-clicked') {
        return (a.clickCount || 0) - (b.clickCount || 0);
      }
      return 0;
    });

  const handleCopy = (code) => {
    const fullShortUrl = `${SHORT_URL_BASE}/${code}`;
    navigator.clipboard.writeText(fullShortUrl);
    alert('Short URL copied to clipboard!');
  };

  const handleDelete = (linkId) => {
    if (window.confirm('Are you sure you want to delete this link? This will permanently delete all click analytics as well.')) {
      deleteLinkMutation.mutate(linkId);
    }
  };

  const handleShowQR = (link) => {
    setSelectedLink(link);
    setIsQRModalOpen(true);
  };

  const handleEdit = (link) => {
    setLinkToEdit(link);
    setIsEditModalOpen(true);
  };

  const getFullShortUrl = (link) => {
    const code = link.customAlias || link.shortCode;
    return `${SHORT_URL_BASE}/${code}`;
  };

  const handleExportCSV = () => {
    if (filteredLinks.length === 0) return;
    const headers = ['Short Code', 'Short URL', 'Destination URL', 'Clicks', 'Created At', 'Expiry Date', 'Status'];
    const rows = filteredLinks.map(link => [
      link.customAlias || link.shortCode,
      getFullShortUrl(link),
      link.originalUrl,
      link.clickCount || 0,
      dayjs(link.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      link.expiryDate ? dayjs(link.expiryDate).format('YYYY-MM-DD') : 'Never',
      link.status
    ]);

    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
    rows.forEach(row => {
      const escapedRow = row.map(val => {
        const strVal = String(val);
        if (strVal.includes(',')) return `"${strVal.replace(/"/g, '""')}"`;
        return strVal;
      });
      csvContent += escapedRow.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", encodedUri);
    linkElement.setAttribute("download", `linklens_links_export.csv`);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };

  const handleExportPDF = () => {
    if (filteredLinks.length === 0) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`LinkLens Links Export`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${dayjs().format('MMM D, YYYY HH:mm')}`, 14, 30);
    
    autoTable(doc, {
      startY: 38,
      head: [['Short Code', 'Destination URL', 'Clicks', 'Status']],
      body: filteredLinks.map(link => [
        link.customAlias || link.shortCode,
        link.originalUrl.length > 50 ? `${link.originalUrl.substring(0, 50)}...` : link.originalUrl,
        link.clickCount || 0,
        link.status
      ]),
    });

    doc.save(`linklens_links_export.pdf`);
  };

  return (
    <div className="space-y-6">
      <CreateLinkModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <EditLinkModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} link={linkToEdit} />
      <BulkUploadModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} />
      
      <QRCodeModal 
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        shortUrl={selectedLink ? getFullShortUrl(selectedLink) : ''}
        shortCode={selectedLink?.customAlias || selectedLink?.shortCode}
      />

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Manage your links and track performance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setIsBulkModalOpen(true)}>
            <Upload className="w-4 h-4" /> Bulk Upload CSV
          </Button>
          <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" /> Create New Link
          </Button>
        </div>
      </div>

      {/* Filter and export block */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by URL, alias, or short code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 pr-8 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Disabled">Disabled</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 px-3 pr-8 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="most-clicked">Most Clicked</option>
            <option value="least-clicked">Least Clicked</option>
          </select>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV} disabled={filteredLinks.length === 0}>
            <FileDown className="w-4 h-4" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPDF} disabled={filteredLinks.length === 0}>
            <FileDown className="w-4 h-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Main links list */}
      <Card>
        <CardHeader>
          <CardTitle>Your Links ({filteredLinks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-full h-16" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-10 text-muted-foreground">
              Failed to load links. Please ensure the backend is running.
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="text-center py-16">
              <Link2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No links found</h3>
              <p className="text-muted-foreground mb-6">Create or upload short links to get started.</p>
              <Button onClick={() => setIsModalOpen(true)}>Create Link</Button>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium text-muted-foreground">Short Code</th>
                      <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Destination</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Clicks</th>
                      <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Created</th>
                      <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Expiry</th>
                      <th className="text-left p-4 font-medium text-muted-foreground hidden xl:table-cell">Health Score</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLinks.map((link) => {
                      const code = link.customAlias || link.shortCode;
                      const fullShortUrl = getFullShortUrl(link);
                      const health = calculateLinkHealth(link);
                      
                      return (
                        <tr key={link._id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-medium">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-primary">{code}</span>
                              <button 
                                onClick={() => handleCopy(code)} 
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                title="Copy short URL"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 truncate max-w-[140px]" title={fullShortUrl}>
                              {fullShortUrl}
                            </div>
                          </td>
                          <td className="p-4 hidden md:table-cell">
                            <div className="flex items-center gap-2 max-w-[220px] lg:max-w-[320px]">
                              <span className="truncate text-muted-foreground" title={link.originalUrl}>
                                {link.originalUrl}
                              </span>
                              <a 
                                href={link.originalUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </td>
                          <td className="p-4 font-medium">
                            <div className="flex items-center gap-1.5">
                              <MousePointerClick className="w-3.5 h-3.5 text-muted-foreground" />
                              {link.clickCount || 0}
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground hidden sm:table-cell">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" /> 
                              {dayjs(link.createdAt).format('MMM D, YYYY')}
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground hidden lg:table-cell">
                            {link.expiryDate ? (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {dayjs(link.expiryDate).format('MMM D, YYYY')}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground/60">Never</span>
                            )}
                          </td>
                          <td className="p-4 hidden xl:table-cell">
                            <Badge variant={health.variant} className="text-xs">
                              {health.score} - {health.rating}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge variant={link.status === 'Active' ? 'success' : link.status === 'Expired' ? 'warning' : 'destructive'}>
                              {link.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() => handleShowQR(link)}
                                title="Show QR Code"
                              >
                                <QrCode className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() => handleEdit(link)}
                                title="Edit Link Settings"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() => navigate(`/dashboard/analytics/${link._id}`)}
                                title="View Analytics"
                              >
                                <BarChart3 className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                onClick={() => handleDelete(link._id)}
                                disabled={deleteLinkMutation.isPending}
                                title="Delete Link"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}