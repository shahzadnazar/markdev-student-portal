import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Question, QuestionType } from "@/types";

/** Local draft of a student's answer to one question while taking a quiz. */
export interface QuestionAnswer {
  selected_option_ids?: number[];
  answer_text?: string;
}

const typeHint: Record<QuestionType, string> = {
  single_choice: "Select one answer",
  multiple_choice: "Select all that apply",
  true_false: "Select true or false",
  short_answer: "Type your answer",
};

const optionRowClass = (active: boolean) =>
  cn(
    "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors duration-150",
    active
      ? "border-primary bg-primary/5"
      : "border-outline-variant/60 bg-white hover:border-primary/40 hover:bg-surface-ice",
  );

interface QuestionCardProps {
  question: Question;
  /** Zero-based position of the question within the attempt. */
  index: number;
  answer: QuestionAnswer | undefined;
  onChange: (answer: QuestionAnswer) => void;
}

/** One quiz question with the input control matching its type. */
export function QuestionCard({ question, index, answer, onChange }: QuestionCardProps) {
  const selectedIds = answer?.selected_option_ids ?? [];

  const toggleOption = (optionId: number, checked: boolean) => {
    const next = checked ? [...selectedIds, optionId] : selectedIds.filter((id) => id !== optionId);
    onChange({ selected_option_ids: next });
  };

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-label-sm text-primary uppercase">
          Question {index + 1} · {question.points} {question.points === 1 ? "pt" : "pts"}
        </p>
        <p className="font-mono text-label-sm text-on-surface-variant uppercase">
          {typeHint[question.type]}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <p className="text-body-lg text-on-surface">{question.prompt}</p>

        {question.type === "single_choice" || question.type === "true_false" ? (
          <RadioGroup
            value={selectedIds.length > 0 ? String(selectedIds[0]) : ""}
            onValueChange={(value) => onChange({ selected_option_ids: [Number(value)] })}
            aria-label={`Answer options for question ${index + 1}`}
          >
            {question.options.map((option) => {
              const id = `question-${question.id}-option-${option.id}`;
              const active = selectedIds.includes(option.id);
              return (
                <Label key={option.id} htmlFor={id} className={optionRowClass(active)}>
                  <RadioGroupItem id={id} value={String(option.id)} />
                  <span className="min-w-0 flex-1 text-body-md font-normal text-on-surface">
                    {option.text}
                  </span>
                </Label>
              );
            })}
          </RadioGroup>
        ) : null}

        {question.type === "multiple_choice" ? (
          <div
            role="group"
            aria-label={`Answer options for question ${index + 1}`}
            className="grid gap-2.5"
          >
            {question.options.map((option) => {
              const id = `question-${question.id}-option-${option.id}`;
              const active = selectedIds.includes(option.id);
              return (
                <Label key={option.id} htmlFor={id} className={optionRowClass(active)}>
                  <Checkbox
                    id={id}
                    checked={active}
                    onCheckedChange={(checked) => toggleOption(option.id, checked === true)}
                  />
                  <span className="min-w-0 flex-1 text-body-md font-normal text-on-surface">
                    {option.text}
                  </span>
                </Label>
              );
            })}
          </div>
        ) : null}

        {question.type === "short_answer" ? (
          <div className="space-y-2">
            <Label htmlFor={`question-${question.id}-answer`}>Your answer</Label>
            <Textarea
              id={`question-${question.id}-answer`}
              rows={5}
              placeholder="Type your answer here…"
              value={answer?.answer_text ?? ""}
              onChange={(event) => onChange({ answer_text: event.target.value })}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
