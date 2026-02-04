import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';

const Fallbacks = () => {
  const { profile } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!profile || !['admin', 'superuser'].includes(profile.role)) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin-logs');
        if (!response.ok) {
          setError(new Error('Failed to fetch logs'));
        } else if (mounted) {
          const data = await response.json();
          setLogs(data || []);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [profile]);

  if (!profile || !['admin', 'superuser'].includes(profile.role)) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium">Admin Logs</h3>
      {loading && <p>Loading...</p>}
      {error && <p className="text-danger">Error loading logs: {String(error.message || error)}</p>}
      {!loading && !error && (
        <div className="overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left">Time</th>
                <th className="p-2 text-left">User</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t last:border-b">
                  <td className="p-2 align-top">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="p-2 align-top">{l.user_id}</td>
                  <td className="p-2 align-top">{l.event_type}</td>
                  <td className="p-2 align-top"><pre className="whitespace-pre-wrap text-xs">{JSON.stringify(l.details || {}, null, 2)}</pre></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Fallbacks;