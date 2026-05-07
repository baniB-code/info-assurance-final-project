"use client";

type Activity = {
  id: string;
  event_type: string;
  details: string;
  created_at: string;
};

export function ActivityLogModal({
  isOpen,
  onClose,
  activities,
}: {
  isOpen: boolean;
  onClose: () => void;
  activities: Activity[];
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[85vh] w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 sm:p-5">
          <h2 className="text-xl font-semibold text-slate-900">Activity Log</h2>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700"
          >
            Close
          </button>
        </div>

        <div className="max-h-[calc(85vh-76px)] overflow-y-auto p-4 sm:p-5">
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <p className="text-sm font-medium text-slate-900">{activity.details}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {activity.event_type} • {new Date(activity.created_at).toLocaleString()}
                </p>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-sm text-slate-500">No activity yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
