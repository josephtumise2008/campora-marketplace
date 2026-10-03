import { Bell, CheckCheck } from "lucide-react";
import { userService } from "../../services/marketplace";
import { useAsync } from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";
import { cx, formatDateTime, relativeTime } from "../../utils/format";
import { PageHeader } from "../../components/common/SectionHeader";
import { EmptyState, RowsSkeleton } from "../../components/ui/Feedback";

const TONE: Record<string, string> = {
  order: "mini-notifications__dot--order",
  deal: "mini-notifications__dot--deal",
  system: "mini-notifications__dot--system",
  account: "mini-notifications__dot--account",
};

export default function AccountNotificationsPage() {
  const toast = useToast();
  const { data, loading, error, reload, setData } = useAsync(
    () => userService.notifications(),
    []
  );

  const markAll = async () => {
    try {
      await userService.markNotificationsRead();
      setData({
        items: (data?.items || []).map((entry) => ({ ...entry, read: true })),
        unread: 0,
      });
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("We could not update your notifications", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <div className="stack-lg">
      <PageHeader
        title="Notifications"
        description="Order updates, promos and account notices from Campora and the stores you follow."
        actions={
          (data?.unread ?? 0) > 0 ? (
            <button type="button" className="btn btn--secondary" onClick={markAll}>
              <CheckCheck size={16} aria-hidden="true" />
              Mark all read
            </button>
          ) : null
        }
      />

      {error ? <p className="form-alert">{error}</p> : null}
      {loading && !data ? <RowsSkeleton count={4} /> : null}

      {data && data.items.length === 0 ? (
        <EmptyState
          icon={<Bell size={26} aria-hidden="true" />}
          title="No notifications yet"
          description="Order updates and store promos will show up here."
        />
      ) : null}

      {data && data.items.length > 0 ? (
        <ul className="notification-list">
          {data.items.map((entry) => (
            <li key={entry._id} className={cx(!entry.read && "is-unread")}>
              <span className={cx("mini-notifications__dot", TONE[entry.type])} aria-hidden="true" />
              <div>
                <p className="notification-list__title">{entry.title}</p>
                <p className="notification-list__body">{entry.body}</p>
                <p className="notification-list__meta">
                  <time dateTime={entry.createdAt} title={formatDateTime(entry.createdAt)}>
                    {relativeTime(entry.createdAt)}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span className="notification-list__type">{entry.type}</span>
                </p>
              </div>
              {entry.link ? (
                <a
                  href={entry.link}
                  className="btn btn--ghost btn--sm"
                  onClick={(event) => event.preventDefault()}
                >
                  View
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <button type="button" className="link-plain" onClick={reload}>
        Refresh notifications
      </button>
    </div>
  );
}
