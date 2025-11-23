import { QuizView } from "@/components/quiz-view";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode } = await params;
  return <QuizView mode={mode} />;
}
