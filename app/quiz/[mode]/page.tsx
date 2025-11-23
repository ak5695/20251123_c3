import { QuizView } from "@/components/quiz-view";

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ mode: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { mode } = await params;
  const { category } = await searchParams;

  return <QuizView mode={mode} category={category as string} />;
}
