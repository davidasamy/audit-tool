import { Card } from "@/components/ui/card"

type TestResult = {
  passed: boolean
  input: any
  expected: any
  actual: any
  error?: string
}

export function TestResults({ results }: { results: TestResult[] }) {
  const passedCount = results.filter((r) => r.passed).length
  const totalCount = results.length

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Test Results</h3>
        <span
          className={`font-semibold ${passedCount === totalCount ? "text-(--color-success)" : "text-(--color-error)"}`}
        >
          {passedCount} / {totalCount} Passed
        </span>
      </div>

      <div className="space-y-2">
        {results.map((result, index) => (
          <Card
            key={index}
            className={`p-4 border-2 ${
              result.passed ? "border-(--color-success) bg-green-50" : "border-(--color-error) bg-red-50"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="font-semibold">Test Case {index + 1}</span>
              <span
                className={`text-sm font-semibold ${result.passed ? "text-(--color-success)" : "text-(--color-error)"}`}
              >
                {result.passed ? "PASSED" : "FAILED"}
              </span>
            </div>

            {result.error ? (
              <div className="text-sm text-(--color-error) font-mono bg-white p-2 rounded">Error: {result.error}</div>
            ) : (
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-semibold">Input:</span>
                  <code className="ml-2 bg-white px-2 py-1 rounded">{JSON.stringify(result.input)}</code>
                </div>
                <div>
                  <span className="font-semibold">Expected:</span>
                  <code className="ml-2 bg-white px-2 py-1 rounded">{JSON.stringify(result.expected)}</code>
                </div>
                <div>
                  <span className="font-semibold">Actual:</span>
                  <code className="ml-2 bg-white px-2 py-1 rounded">{JSON.stringify(result.actual)}</code>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
