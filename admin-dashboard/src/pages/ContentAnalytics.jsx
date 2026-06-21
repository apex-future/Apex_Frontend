import { useEffect, useState } from 'react';
import { fetchBooksAnalytics, fetchHighlightsAnalytics } from '../services/api';
import { Book, HardDrive, Clock, Highlighter, Loader2, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function ContentAnalytics() {
  const [booksData, setBooksData] = useState(null);
  const [highlightsData, setHighlightsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetchBooksAnalytics(30),
      fetchHighlightsAnalytics(30)
    ])
      .then(([books, highlights]) => {
        setBooksData(books);
        setHighlightsData(highlights);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (error) return <div className="text-red-500 p-4 bg-red-50 rounded-lg border border-red-200">Error loading content analytics: {error}</div>;
  if (!booksData || !highlightsData) return null;

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const fileTypeData = Object.entries(booksData.by_file_type || {}).map(([name, value]) => ({ name: name.toUpperCase(), value }));
  const highlightColorData = Object.entries(highlightsData.by_color || {}).map(([name, value]) => ({ name, value }));

  const stats = [
    { name: 'Total Storage Used', value: formatBytes(booksData.total_storage_bytes), icon: HardDrive, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Total Books Uploaded', value: booksData.total_books, icon: Book, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: 'Total Reading Minutes', value: (booksData.reading?.total_minutes || 0).toLocaleString(), icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100' },
    { name: 'Total Highlights', value: (highlightsData.total || 0).toLocaleString(), icon: Highlighter, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`rounded-lg p-3 ${item.bg}`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                  <dd className="text-2xl font-bold text-gray-900 mt-1">{item.value}</dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Books by File Type</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fileTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {fileTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-700 font-medium">Average Reading Progress</span>
              </div>
              <span className="text-gray-900 font-semibold">{booksData.reading?.average_progress_pct || 0}%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Highlighter className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-700 font-medium">Highlights with Notes</span>
              </div>
              <span className="text-gray-900 font-semibold">{highlightsData.notes_rate_pct || 0}%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <HardDrive className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-700 font-medium">Avg Size per Book</span>
              </div>
              <span className="text-gray-900 font-semibold">{formatBytes(booksData.avg_storage_bytes_per_book || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Top Books by Reading Time</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Time (Mins)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {booksData.reading?.top_books_by_reading_time?.map((book, idx) => (
                <tr key={book.book_id || idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {book.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {book.author || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold text-blue-600">
                    {book.total_reading_minutes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
