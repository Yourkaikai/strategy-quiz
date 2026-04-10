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

  it('exposes authored explanation fields for technology and innovation part 1', () => {
    const chapterQuestions = getQuestionsByChapter('07-technology-and-innovation-1')

    expect(chapterQuestions).toHaveLength(25)

    for (const question of chapterQuestions) {
      expect(question['explanation']).toEqual(expect.any(String))
      expect(question['explanation']).not.toHaveLength(0)
      expect(question['examTip']).toEqual(expect.any(String))
      expect(question['examTip']).not.toHaveLength(0)
      expect(question.options).toHaveLength(4)

      for (const option of question.options) {
        expect(option['explanation']).toEqual(expect.any(String))
        expect(option['explanation']).not.toHaveLength(0)
      }
    }
  })

  it('exposes authored explanation fields for technology and innovation part 2', () => {
    const chapterQuestions = getQuestionsByChapter('08-technology-and-innovation-2')

    expect(chapterQuestions).toHaveLength(24)

    for (const question of chapterQuestions) {
      expect(question['explanation']).toEqual(expect.any(String))
      expect(question['explanation']).not.toHaveLength(0)
      expect(question['examTip']).toEqual(expect.any(String))
      expect(question['examTip']).not.toHaveLength(0)
      expect(question.options).toHaveLength(4)

      for (const option of question.options) {
        expect(option['explanation']).toEqual(expect.any(String))
        expect(option['explanation']).not.toHaveLength(0)
      }
    }

    expect(getQuestionById('08-technology-and-innovation-2-q017')).toBeUndefined()
  })

  it('exposes authored explanation fields for organizational design', () => {
    const chapterQuestions = getQuestionsByChapter('09-organizational-design')

    expect(chapterQuestions).toHaveLength(17)

    for (const question of chapterQuestions) {
      expect(question['explanation']).toEqual(expect.any(String))
      expect(question['explanation']).not.toHaveLength(0)
      expect(question['examTip']).toEqual(expect.any(String))
      expect(question['examTip']).not.toHaveLength(0)
      expect(question.options).toHaveLength(4)

      for (const option of question.options) {
        expect(option['explanation']).toEqual(expect.any(String))
        expect(option['explanation']).not.toHaveLength(0)
      }
    }
  })

  it('exposes authored explanation fields for corporate strategies part 2', () => {
    const chapterQuestions = getQuestionsByChapter('06-corporate-strategy-2')

    expect(chapterQuestions).toHaveLength(25)

    for (const question of chapterQuestions) {
      expect(question['explanation']).toEqual(expect.any(String))
      expect(question['explanation']).not.toHaveLength(0)
      expect(question['examTip']).toEqual(expect.any(String))
      expect(question['examTip']).not.toHaveLength(0)
      expect(question.options).toHaveLength(4)

      for (const option of question.options) {
        expect(option['explanation']).toEqual(expect.any(String))
        expect(option['explanation']).not.toHaveLength(0)
      }
    }
  })

  it('exposes authored explanation fields for corporate strategies part 1', () => {
    const chapterQuestions = getQuestionsByChapter('05-corporate-strategy-1')

    expect(chapterQuestions).toHaveLength(25)

    for (const question of chapterQuestions) {
      expect(question['explanation']).toEqual(expect.any(String))
      expect(question['explanation']).not.toHaveLength(0)
      expect(question['examTip']).toEqual(expect.any(String))
      expect(question['examTip']).not.toHaveLength(0)
      expect(question.options).toHaveLength(4)

      for (const option of question.options) {
        expect(option['explanation']).toEqual(expect.any(String))
        expect(option['explanation']).not.toHaveLength(0)
      }
    }
  })

  it('exposes authored explanation fields for business strategies', () => {
    const chapterQuestions = getQuestionsByChapter('04-business-strategies')

    expect(chapterQuestions).toHaveLength(25)

    for (const question of chapterQuestions) {
      expect(question['explanation']).toEqual(expect.any(String))
      expect(question['explanation']).not.toHaveLength(0)
      expect(question['examTip']).toEqual(expect.any(String))
      expect(question['examTip']).not.toHaveLength(0)
      expect(question.options).toHaveLength(4)

      for (const option of question.options) {
        expect(option['explanation']).toEqual(expect.any(String))
        expect(option['explanation']).not.toHaveLength(0)
      }
    }
  })

  it('exposes authored explanation fields for internal analysis', () => {
    const chapterQuestions = getQuestionsByChapter('03-internal-analysis')

    expect(chapterQuestions).toHaveLength(27)

    for (const question of chapterQuestions) {
      expect(question['explanation']).toEqual(expect.any(String))
      expect(question['explanation']).not.toHaveLength(0)
      expect(question['examTip']).toEqual(expect.any(String))
      expect(question['examTip']).not.toHaveLength(0)
      expect(question.options).toHaveLength(4)

      for (const option of question.options) {
        expect(option['explanation']).toEqual(expect.any(String))
        expect(option['explanation']).not.toHaveLength(0)
      }
    }
  })

  it('exposes authored explanation fields for external analysis', () => {
    const chapterQuestions = getQuestionsByChapter('02-external-analysis')

    expect(chapterQuestions).toHaveLength(28)

    for (const question of chapterQuestions) {
      expect(question['explanation']).toEqual(expect.any(String))
      expect(question['explanation']).not.toHaveLength(0)
      expect(question['examTip']).toEqual(expect.any(String))
      expect(question['examTip']).not.toHaveLength(0)
      expect(question.options).toHaveLength(4)

      for (const option of question.options) {
        expect(option['explanation']).toEqual(expect.any(String))
        expect(option['explanation']).not.toHaveLength(0)
      }
    }
  })

  it('exposes authored explanation fields for intro', () => {
    const chapterQuestions = getQuestionsByChapter('01-intro')

    expect(chapterQuestions).toHaveLength(30)

    for (const question of chapterQuestions) {
      expect(question['explanation']).toEqual(expect.any(String))
      expect(question['explanation']).not.toHaveLength(0)
      expect(question['examTip']).toEqual(expect.any(String))
      expect(question['examTip']).not.toHaveLength(0)
      expect(question.options).toHaveLength(4)

      for (const option of question.options) {
        expect(option['explanation']).toEqual(expect.any(String))
        expect(option['explanation']).not.toHaveLength(0)
      }
    }
  })
})
