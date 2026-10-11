import { Check, UserCheck, X } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { reviewAlumni } from "@/lib/actions/admin";
import { formatDate } from "@/lib/utils";
import type { PendingAlumni } from "@/types";

/** One form per decision, each carrying its own hidden value. */
function Actions({ id }: { id: string }) {
  return (
    <div className="flex gap-2">
      <form action={reviewAlumni}>
        <input suppressHydrationWarning type="hidden" name="id" value={id} />
        <input suppressHydrationWarning type="hidden" name="decision" value="verified" />
        <SubmitButton variant="solid" size="sm">
          <Check className="h-3.5 w-3.5" aria-hidden />
          Approve
        </SubmitButton>
      </form>
      <form action={reviewAlumni}>
        <input suppressHydrationWarning type="hidden" name="id" value={id} />
        <input suppressHydrationWarning type="hidden" name="decision" value="rejected" />
        <SubmitButton variant="danger" size="sm">
          <X className="h-3.5 w-3.5" aria-hidden />
          Reject
        </SubmitButton>
      </form>
    </div>
  );
}

const th = "px-4 py-2.5 text-left text-[12.5px] font-bold text-faint";
const td = "px-4 py-3 align-middle text-[14px] text-soft";

export function VerificationQueue({ alumni }: { alumni: PendingAlumni[] }) {
  if (alumni.length === 0) {
    return <EmptyState icon={UserCheck} title="No alumni are waiting" description="New alumni signups appear here for review." />;
  }

  return (
    <>
      {/* Table on wider screens */}
      <div className="hidden overflow-hidden rounded-card border border-line bg-card [--cut:20px] [--r:16px] md:block">
        <table className="w-full border-collapse">
          <thead className="border-b border-line bg-tint">
            <tr>
              <th scope="col" className={th}>Name</th>
              <th scope="col" className={th}>Email</th>
              <th scope="col" className={th}>Branch</th>
              <th scope="col" className={th}>Graduated</th>
              <th scope="col" className={th}>Signed up</th>
              <th scope="col" className={th}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {alumni.map((person) => (
              <tr key={person.id}>
                <td className={`${td} font-semibold text-ink`}>{person.name}</td>
                <td className={`${td} break-all`}>{person.email}</td>
                <td className={td}>{person.branch}</td>
                <td className={`${td} tabular-nums`}>{person.graduation_year}</td>
                <td className={`${td} whitespace-nowrap`}>{formatDate(person.created_at)}</td>
                <td className={`${td} text-right`}>
                  <div className="flex justify-end">
                    <Actions id={person.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards on phones */}
      <ul className="space-y-3 md:hidden">
        {alumni.map((person) => (
          <li key={person.id} className="rounded-card border border-line bg-card [--cut:20px] [--r:16px] p-4">
            <div className="text-[15px] font-bold text-ink">{person.name}</div>
            <div className="mt-0.5 break-all text-[13.5px] text-soft">{person.email}</div>
            <div className="mt-1.5 text-[13px] text-faint">
              {person.branch}, class of {person.graduation_year} · signed up {formatDate(person.created_at)}
            </div>
            <div className="mt-3.5">
              <Actions id={person.id} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
