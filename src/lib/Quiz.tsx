"use client";

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, X, Award } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  answer_index: number;
  explanation: string;
}

interface QuizData {
  quiz: QuizQuestion[];
}

export function Quiz({ data, onTryAgain }: { data: QuizData, onTryAgain: () => void }) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelectAnswer = (questionIndex: number, optionIndex: number) => {
    if (submitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    onTryAgain();
  }

  const score = useMemo(() => {
    if (!submitted) return 0;
    return data.quiz.reduce((acc, question, index) => {
      return selectedAnswers[index] === question.answer_index ? acc + 1 : acc;
    }, 0);
  }, [submitted, data.quiz, selectedAnswers]);

  if (!data || !Array.isArray(data.quiz) || data.quiz.length === 0) {
    return <div>Quiz data is not available.</div>;
  }

  return (
    <div className="w-full h-full overflow-auto bg-slate-50 rounded-2xl border border-slate-200 p-6 md:p-8">
      {submitted ? (
        <div className="text-center">
          <Award className="w-20 h-20 text-amber-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold">Quiz Complete!</h2>
          <p className="text-5xl font-bold my-4">{score} / {data.quiz.length}</p>
          <p className="text-slate-600 mb-8">Review your answers below.</p>
          <Button onClick={handleReset} size="lg">Try Another Quiz</Button>
        </div>
      ) : null}

      <div className="space-y-8 mt-8">
        {data.quiz.map((q, qIndex) => (
          <div key={qIndex} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="font-semibold text-lg text-slate-800 mb-4">{qIndex + 1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map((option, oIndex) => {
                const isSelected = selectedAnswers[qIndex] === oIndex;
                const isCorrect = q.answer_index === oIndex;
                
                return (
                  <button
                    key={oIndex}
                    onClick={() => handleSelectAnswer(qIndex, oIndex)}
                    disabled={submitted}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all flex items-center",
                      "disabled:cursor-not-allowed",
                      submitted ? 
                        (isCorrect ? "bg-green-100 border-green-300 text-green-900" : (isSelected ? "bg-red-100 border-red-300 text-red-900" : "bg-slate-50 border-slate-200"))
                        : (isSelected ? "bg-indigo-100 border-indigo-400 ring-2 ring-indigo-200" : "bg-white hover:bg-slate-100 border-slate-200")
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 mr-3 flex-shrink-0 flex items-center justify-center",
                      submitted && isCorrect ? "bg-green-500 border-green-500 text-white" :
                      submitted && isSelected && !isCorrect ? "bg-red-500 border-red-500 text-white" :
                      isSelected ? "bg-indigo-500 border-indigo-500 text-white" : "border-slate-300"
                    )}>
                      {submitted && isCorrect && <Check className="w-4 h-4" />}
                      {submitted && isSelected && !isCorrect && <X className="w-4 h-4" />}
                    </div>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>
            {submitted && (
              <div className="mt-4 p-4 bg-slate-100 rounded-lg text-sm text-slate-700">
                <h4 className="font-bold mb-1">Explanation</h4>
                <p>{q.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {!submitted && (
        <div className="mt-8 text-center">
          <Button onClick={handleSubmit} size="lg" disabled={Object.keys(selectedAnswers).length !== data.quiz.length}>
            Submit Quiz
          </Button>
        </div>
      )}
    </div>
  );
}
