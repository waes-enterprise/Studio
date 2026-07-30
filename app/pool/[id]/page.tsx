import { Metadata } from "next";
import Game from "../Game";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Table ${id} - Pool Hall Online`,
    description: `Play 8-ball pool on Table ${id}`,
  };
}

export default async function PoolTable({ params }: Props) {
  const { id } = await params;
  return <Game tableId={id} />;
}
