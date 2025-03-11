import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Group Details | Hisaab',
  description: 'View and manage your expense group on Hisaab. Track shared expenses, settle up with friends, and manage group members.',
};

export default function GroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="pt-16">
      {children}
    </div>
  );
} 