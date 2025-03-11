import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Create New Group | Hisaab',
  description: 'Create a new expense group on Hisaab. Start tracking shared expenses with friends, roommates, or travel companions.',
};

export default function NewGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 