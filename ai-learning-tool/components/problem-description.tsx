import { Card } from "@/components/ui/card"

type Problem = {
  title: string
  difficulty: "Easy" | "Medium" | "Hard"
  description: string
  examples: Array<{ input: string; output: string; explanation: string }>
  constraints: string[]
}

const difficultyColors = {
  Easy: "text-(--color-success)",
  Medium: "text-(--color-primary-yellow)",
  Hard: "text-(--color-error)",
}

export function ProblemDescription({ problem }: { problem: Problem }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance mb-2">{problem.title}</h1>
        <span className={`text-sm font-semibold ${difficultyColors[problem.difficulty]}`}>{problem.difficulty}</span>
      </div>

      <Card className="p-6 bg-(--color-card)">
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: problem.description.replace(/`([^`]+)`/g, "<code>$1</code>") }}
        />
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Examples</h2>
        {problem.examples.map((example, index) => (
          <Card key={index} className="p-4 bg-(--color-card) space-y-2">
            <div>
              <span className="font-semibold">Input:</span>
              <code className="ml-2 text-sm bg-(--color-muted) px-2 py-1 rounded">{example.input}</code>
            </div>
            <div>
              <span className="font-semibold">Output:</span>
              <code className="ml-2 text-sm bg-(--color-muted) px-2 py-1 rounded">{example.output}</code>
            </div>
            {example.explanation && (
              <div className="text-sm text-(--color-muted-foreground)">
                <span className="font-semibold">Explanation:</span> {example.explanation}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold">Constraints</h2>
        <Card className="p-4 bg-(--color-card)">
          <ul className="space-y-1 text-sm">
            {problem.constraints.map((constraint, index) => (
              <li key={index} className="text-(--color-muted-foreground)">
                • {constraint}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
