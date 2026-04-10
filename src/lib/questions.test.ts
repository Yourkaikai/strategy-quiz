import { describe, expect, it } from 'vitest'

import { getChapterSummaries, getQuestionById, getQuestionsByChapter } from './questions'

describe('question selectors', () => {
  it('preserves chapter order from the imported question bank', () => {
    const summaries = getChapterSummaries()

    expect(summaries).toHaveLength(9)
    expect(summaries[0]).toMatchObject({ chapterId: '01-intro', questionCount: 30 })
    expect(summaries[1]).toMatchObject({ chapterId: '02-external-analysis', questionCount: 28 })
    expect(summaries[7]).toMatchObject({ chapterId: '08-technology-and-innovation-2', questionCount: 24 })
    expect(summaries[8]).toMatchObject({ chapterId: '09-organizational-design', questionCount: 17 })
  })

  it('returns chapter questions in normalized order while preserving duplicate original numbers', () => {
    const internalAnalysisQuestions = getQuestionsByChapter('03-internal-analysis')

    expect(internalAnalysisQuestions).toHaveLength(27)
    expect(internalAnalysisQuestions[13]?.questionNumberOriginal).toBe('15')
    expect(internalAnalysisQuestions[14]?.questionNumberOriginal).toBe('15')
    expect(internalAnalysisQuestions[13]?.questionNumberNormalized).toBe(14)
    expect(internalAnalysisQuestions[14]?.questionNumberNormalized).toBe(15)
  })

  it('retrieves an individual question by stable id', () => {
    const question = getQuestionById('01-intro-q001')

    expect(question).toMatchObject({
      id: '01-intro-q001',
      chapterTitle: 'Intro',
      correctAnswer: 'B',
    })
    expect(question?.options).toHaveLength(4)
  })

  it('applies manual correction overrides for disputed technology questions', () => {
    const correctedQuestion = getQuestionById('07-technology-and-innovation-1-q016')
    const excludedQuestion = getQuestionById('08-technology-and-innovation-2-q017')

    expect(correctedQuestion).toMatchObject({
      id: '07-technology-and-innovation-1-q016',
      correctAnswer: 'B',
      hasAnswerKey: true,
    })
    expect(correctedQuestion?.options[0]?.text).not.toContain('*')

    expect(excludedQuestion).toBeUndefined()
    expect(getQuestionsByChapter('08-technology-and-innovation-2')).toHaveLength(24)
  })
})
