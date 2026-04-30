import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import PracticePage from "./pages/PracticePage";
import ExamSetupPage from "./pages/ExamSetupPage";
import ExamRunPage from "./pages/ExamRunPage";
import ExamReviewPage from "./pages/ExamReviewPage";
import NotesPage from "./pages/NotesPage";
import LessonPage from "./pages/LessonPage";
import GlossaryPage from "./pages/GlossaryPage";
import ProgressPage from "./pages/ProgressPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/exam" element={<ExamSetupPage />} />
          <Route path="/exam/run" element={<ExamRunPage />} />
          <Route path="/exam/review" element={<ExamReviewPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/notes/:lessonId" element={<LessonPage />} />
          <Route path="/notes/:lessonId/:topicId" element={<LessonPage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
