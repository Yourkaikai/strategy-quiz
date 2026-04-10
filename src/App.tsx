import { Navigate, Route, Routes } from 'react-router-dom'

import './App.css'
import { AppStateProvider } from './app/state'
import { AppShell } from './components/AppShell'
import { ExamResultsPage } from './pages/ExamResultsPage'
import { ExamSessionPage } from './pages/ExamSessionPage'
import { ExamSetupPage } from './pages/ExamSetupPage'
import { HomePage } from './pages/HomePage'
import { MockExamOverviewPage } from './pages/MockExamOverviewPage'
import { MockExamResultsPage } from './pages/MockExamResultsPage'
import { MockExamSessionPage } from './pages/MockExamSessionPage'
import { PracticePage } from './pages/PracticePage'
import { ReviewPage } from './pages/ReviewPage'

function App() {
  return (
    <AppStateProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="exam/setup" element={<ExamSetupPage />} />
          <Route path="exam/session" element={<ExamSessionPage />} />
          <Route path="exam/results" element={<ExamResultsPage />} />
          <Route path="mock/overview" element={<MockExamOverviewPage />} />
          <Route path="mock/session" element={<MockExamSessionPage />} />
          <Route path="mock/results" element={<MockExamResultsPage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AppStateProvider>
  )
}

export default App
