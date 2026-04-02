import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useQuizStore = create(
    persist(
        (set, get) => ({
            quizHistory: [],

            addQuizAttempt: (attempt) => set((state) => ({
                quizHistory: [
                    ...state.quizHistory,
                    {
                        id: Date.now().toString(),
                        createdAt: new Date().toISOString(),
                        ...attempt
                    }
                ]
            })),

            getAggregatedStatsForBook: (bookId) => {
                const history = get().quizHistory.filter(q => String(q.bookId) === String(bookId));
                if (history.length === 0) return null;

                const totalScore = history.reduce((acc, curr) => acc + curr.score, 0);
                const totalQuestions = history.reduce((acc, curr) => acc + curr.numQuestions, 0);
                const totalTime = history.reduce((acc, curr) => acc + curr.timeTaken, 0);

                return {
                    attemptsCount: history.length,
                    averageScore: Math.round(totalScore / history.length),
                    totalQuestions,
                    totalTime
                };
            },

            getAggregatedStatsForSpace: (spaceId) => {
                const history = get().quizHistory.filter(q => String(q.spaceId) === String(spaceId));
                if (history.length === 0) return null;

                const totalScore = history.reduce((acc, curr) => acc + curr.score, 0);
                
                return {
                    attemptsCount: history.length,
                    averageScore: Math.round(totalScore / history.length)
                };
            },
            
            getGlobalStats: () => {
                const history = get().quizHistory;
                if (history.length === 0) return null;

                const totalScore = history.reduce((acc, curr) => acc + curr.score, 0);
                
                return {
                    attemptsCount: history.length,
                    averageScore: Math.round(totalScore / history.length)
                };
            }
        }),
        {
            name: 'apex-quiz-store',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export default useQuizStore;
