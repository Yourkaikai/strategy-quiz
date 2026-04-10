import rawQuestionBank from '../../../data/question-bank.cleaned.json'

import type { QuestionRecord } from '../app/types'

export const questionBank = rawQuestionBank as QuestionRecord[]
