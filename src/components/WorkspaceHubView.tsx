import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  FolderSearch, 
  StickyNote, 
  ExternalLink, 
  Sparkles, 
  Search, 
  Plus, 
  Pin, 
  Trash2, 
  Copy, 
  Check, 
  RefreshCw, 
  BookOpen, 
  FileText, 
  FileCode, 
  FileSpreadsheet, 
  Presentation, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Layers, 
  ArrowRight,
  Info,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { 
  ClassroomCourse, 
  ClassroomCourseWork, 
  DriveFile, 
  CelestialNote,
  EducationLevel 
} from '../types';
import { 
  auth, 
  googleSignIn, 
  signOutUser, 
  getCachedAccessToken,
  fetchClassroomCourses, 
  fetchClassroomCourseWork, 
  searchDriveFiles,
  saveNoteToFirestore,
  loadNotesFromFirestore,
  deleteNoteFromFirestore
} from '../lib/firebase';
import { User } from 'firebase/auth';

interface WorkspaceHubViewProps {
  onImportToStudy: (prompt: string, subject?: string) => void;
  educationLevel: EducationLevel;
  onAwardReward: (xp: number, stardust: number) => void;
}

const NOTE_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  violet: { bg: 'bg-orange-50/50', border: 'border-orange-200', text: 'text-stone-900', dot: 'bg-orange-500' },
  sky: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-stone-900', dot: 'bg-sky-500' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-stone-900', dot: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-stone-900', dot: 'bg-emerald-500' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-stone-900', dot: 'bg-rose-500' },
};

export const WorkspaceHubView: React.FC<WorkspaceHubViewProps> = ({
  onImportToStudy,
  educationLevel,
  onAwardReward,
}) => {
  const [activeTab, setActiveTab] = useState<'classroom' | 'keep' | 'drive'>('classroom');
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Classroom State
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<ClassroomCourse | null>(null);
  const [courseWork, setCourseWork] = useState<ClassroomCourseWork[]>([]);
  const [isLoadingClassroom, setIsLoadingClassroom] = useState(false);

  // Drive State
  const [driveSearchQuery, setDriveSearchQuery] = useState('');
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [selectedDriveFilter, setSelectedDriveFilter] = useState<string>('all');

  // Keep Notes State
  const [notes, setNotes] = useState<CelestialNote[]>([
    {
      id: 'note_demo_1',
      title: 'Calculus: Euler-Lagrange Formulation',
      content: 'Principle of least action: δS = 0. Lagrangian L = T - V. Integrate along path to find geodesic.',
      topic: 'Calculus',
      color: 'violet',
      isPinned: true,
      createdAt: Date.now() - 3600000 * 24,
      updatedAt: Date.now() - 3600000 * 24,
    },
    {
      id: 'note_demo_2',
      title: 'History: Causes of 1789 Storming of Bastille',
      content: 'Third Estate dissatisfaction, harvest failures of 1788-1789, fiscal crisis from American War support, Enlightenment ideals of Rousseau.',
      topic: 'History',
      color: 'amber',
      isPinned: false,
      createdAt: Date.now() - 3600000 * 12,
      updatedAt: Date.now() - 3600000 * 12,
    }
  ]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTopic, setNewNoteTopic] = useState('General');
  const [newNoteColor, setNewNoteColor] = useState<string>('violet');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Listen to Auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      if (user) {
        // Load notes from Firestore
        loadNotesFromFirestore(user.uid).then(cloudNotes => {
          if (cloudNotes && cloudNotes.length > 0) {
            setNotes(cloudNotes);
          }
        }).catch(e => console.warn('Could not load cloud notes yet:', e));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setCurrentUser(res.user);
        onAwardReward(30, 15);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Google Sign-in was cancelled or failed.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setCourses([]);
    setSelectedCourse(null);
    setCourseWork([]);
    setDriveFiles([]);
  };

  // Load Classroom Courses
  const handleLoadClassroom = async () => {
    const token = getCachedAccessToken();
    if (!token) {
      setAuthError('Please sign in with Google to access your Google Classroom courses.');
      return;
    }
    setIsLoadingClassroom(true);
    setAuthError(null);
    try {
      const loadedCourses = await fetchClassroomCourses(token);
      setCourses(loadedCourses);
      if (loadedCourses.length > 0) {
        handleSelectCourse(loadedCourses[0]);
      }
    } catch (err: any) {
      console.error('Failed to load courses:', err);
      setAuthError(err.message || 'Could not fetch Google Classroom courses.');
    } finally {
      setIsLoadingClassroom(false);
    }
  };

  const handleSelectCourse = async (course: ClassroomCourse) => {
    setSelectedCourse(course);
    const token = getCachedAccessToken();
    if (!token) return;
    setIsLoadingClassroom(true);
    try {
      const cw = await fetchClassroomCourseWork(token, course.id);
      setCourseWork(cw);
    } catch (err: any) {
      console.error('Failed to load coursework:', err);
      setCourseWork([]);
    } finally {
      setIsLoadingClassroom(false);
    }
  };

  // Search Drive
  const handleSearchDrive = async () => {
    const token = getCachedAccessToken();
    if (!token) {
      setAuthError('Please sign in with Google to search through your Google Drive study material.');
      return;
    }
    setIsLoadingDrive(true);
    setAuthError(null);
    try {
      const files = await searchDriveFiles(token, driveSearchQuery);
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Failed to search drive:', err);
      setAuthError(err.message || 'Could not search Google Drive.');
    } finally {
      setIsLoadingDrive(false);
    }
  };

  // Notes Management
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    const newNote: CelestialNote = {
      id: `note_${Date.now()}`,
      userId: currentUser?.uid,
      title: newNoteTitle.trim(),
      content: newNoteContent.trim(),
      topic: newNoteTopic.trim() || 'General',
      color: newNoteColor,
      isPinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setNotes(prev => [newNote, ...prev]);
    setNewNoteTitle('');
    setNewNoteContent('');
    setIsAddingNote(false);
    onAwardReward(15, 10);

    if (currentUser?.uid) {
      try {
        await saveNoteToFirestore(currentUser.uid, newNote);
      } catch (err) {
        console.warn('Saved locally; cloud sync pending:', err);
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    if (currentUser?.uid) {
      try {
        await deleteNoteFromFirestore(currentUser.uid, noteId);
      } catch (err) {
        console.warn('Could not delete from cloud:', err);
      }
    }
  };

  const handleTogglePin = (noteId: string) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, isPinned: !n.isPinned } : n));
  };

  const handleCopyToKeep = (note: CelestialNote) => {
    const formatted = `${note.title}\n\n${note.content}\n\n[Topic: ${note.topic || 'General'} | TechTut Study Note]`;
    navigator.clipboard.writeText(formatted);
    setCopiedNoteId(note.id);
    setTimeout(() => setCopiedNoteId(null), 2500);
  };

  const handleOpenGoogleKeep = () => {
    window.open('https://keep.google.com/', '_blank');
  };

  const getMimeTypeBadge = (mimeType: string) => {
    if (mimeType.includes('pdf')) return { label: 'PDF', icon: FileText, color: 'text-rose-300 bg-rose-500/10 border-rose-500/20' };
    if (mimeType.includes('document')) return { label: 'Doc', icon: FileText, color: 'text-sky-300 bg-sky-500/10 border-sky-500/20' };
    if (mimeType.includes('presentation')) return { label: 'Slides', icon: Presentation, color: 'text-amber-300 bg-amber-500/10 border-amber-500/20' };
    if (mimeType.includes('spreadsheet')) return { label: 'Sheet', icon: FileSpreadsheet, color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' };
    return { label: 'File', icon: FileCode, color: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20' };
  };

  return (
    <div id="workspace-hub-container" className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 pb-32">
      
      {/* Header & Auth Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-[36px] bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Google Workspace & Academic Sync</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-light italic font-serif text-white">
            Classroom, Keep Notes & Study Drive
          </h1>
          <p className="text-xs sm:text-sm text-white/70 max-w-xl">
            Seamlessly link your school coursework from Google Classroom, hold your study notes with Keep sync, and search through Drive materials.
          </p>
        </div>

        {/* Google Sign-in / User Account Card */}
        <div className="flex flex-col items-start sm:items-end gap-3 flex-shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
              <img 
                src={currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`} 
                alt="Profile" 
                className="w-10 h-10 rounded-xl border border-indigo-400/40 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="text-left">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{currentUser.displayName || 'Google Scholar'}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </h4>
                <p className="text-[11px] text-indigo-200/70 truncate max-w-[180px]">{currentUser.email}</p>
              </div>
              <button
                id="btn-workspace-signout"
                onClick={handleSignOut}
                className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-300 transition-colors ml-2"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-1 text-center sm:text-right">
              {/* Official Google GSI Styled Button */}
              <button
                id="btn-google-workspace-signin"
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="gsi-material-button inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white text-gray-800 hover:bg-gray-50 font-medium text-xs shadow-xl shadow-black/40 transition-all cursor-pointer border border-gray-200 disabled:opacity-50"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                </div>
                <span>{isAuthenticating ? 'Authorizing...' : 'Sign in with Google'}</span>
              </button>
              <p className="text-[10px] text-white/50">Authorize Classroom, Keep Notes & Drive</p>
            </div>
          )}
        </div>
      </div>

      {/* Auth Error Banner */}
      {authError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between">
          <span>{authError}</span>
          <button onClick={() => setAuthError(null)} className="text-rose-300 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Workspace Sub-Navigation Tabs */}
      <div className="flex items-center justify-center sm:justify-start gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl w-fit">
        <button
          id="tab-classroom"
          onClick={() => setActiveTab('classroom')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'classroom'
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Google Classroom</span>
        </button>

        <button
          id="tab-keep-notes"
          onClick={() => setActiveTab('keep')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'keep'
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <StickyNote className="w-4 h-4" />
          <span>Google Keep & Notes</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">{notes.length}</span>
        </button>

        <button
          id="tab-drive"
          onClick={() => setActiveTab('drive')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'drive'
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <FolderSearch className="w-4 h-4" />
          <span>Google Drive Search</span>
        </button>
      </div>

      {/* TAB 1: GOOGLE CLASSROOM */}
      {activeTab === 'classroom' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                Linked Classroom Courses & Classwork
              </h3>
              <p className="text-xs text-white/60">
                Pick an assignment from your Google Classroom to solve in TechTut with step-by-step guidance.
              </p>
            </div>
            <button
              id="btn-load-classroom"
              onClick={handleLoadClassroom}
              disabled={isLoadingClassroom}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingClassroom ? 'animate-spin' : ''}`} />
              <span>{courses.length > 0 ? 'Refresh Courses' : 'Sync Classroom Courses'}</span>
            </button>
          </div>

          {/* Courses Carousel / Pill Bar */}
          {courses.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {courses.map(course => (
                <button
                  key={course.id}
                  onClick={() => handleSelectCourse(course)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-medium whitespace-nowrap border transition-all ${
                    selectedCourse?.id === course.id
                      ? 'bg-indigo-500/30 border-indigo-400/50 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="font-semibold">{course.name}</span>
                  {course.section && <span className="ml-1.5 opacity-60 text-[10px]">({course.section})</span>}
                </button>
              ))}
            </div>
          )}

          {/* Coursework Cards List */}
          {selectedCourse && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-white/70 px-1">
                <span>Classwork for <strong>{selectedCourse.name}</strong></span>
                <span>{courseWork.length} assignments found</span>
              </div>

              {courseWork.length === 0 && !isLoadingClassroom && (
                <div className="text-center py-12 px-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3">
                  <BookOpen className="w-10 h-10 text-white/30 mx-auto" />
                  <h4 className="text-sm font-semibold text-white">No Active Coursework Found</h4>
                  <p className="text-xs text-white/60 max-w-md mx-auto">
                    You're all caught up on assignments for this class, or click below to manually formulate a study problem!
                  </p>
                  <button
                    onClick={() => onImportToStudy(`${selectedCourse.name} Homework Review: `)}
                    className="px-4 py-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold hover:bg-indigo-500/30 transition-all"
                  >
                    Solve Custom Practice for {selectedCourse.name}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courseWork.map(cw => (
                  <div 
                    key={cw.id}
                    className="p-5 sm:p-6 rounded-[28px] bg-white/5 border border-white/10 hover:border-indigo-400/40 backdrop-blur-xl transition-all shadow-xl flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-semibold text-white group-hover:text-indigo-200 transition-colors">
                          {cw.title}
                        </h4>
                        {cw.dueDate && (
                          <span className="flex-shrink-0 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                            <Calendar className="w-3 h-3" />
                            {cw.dueDate.month}/{cw.dueDate.day}
                          </span>
                        )}
                      </div>

                      {cw.description && (
                        <p className="text-xs text-white/70 line-clamp-3 leading-relaxed">
                          {cw.description}
                        </p>
                      )}

                      {cw.maxPoints !== undefined && (
                        <div className="text-[11px] text-white/50 font-mono">
                          Worth {cw.maxPoints} pts
                        </div>
                      )}
                    </div>

                    {/* Action Hub */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                      {cw.alternateLink && (
                        <a
                          href={cw.alternateLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-white/50 hover:text-white flex items-center gap-1 transition-colors"
                        >
                          <span>Open GCR</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      <button
                        onClick={() => onImportToStudy(`${cw.title}\n${cw.description || ''}`, selectedCourse.name)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500 text-indigo-200 hover:text-white border border-indigo-400/30 text-xs font-semibold shadow-lg transition-all ml-auto cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Study in TechTut</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {courses.length === 0 && !isLoadingClassroom && (
            <div className="p-8 sm:p-12 text-center rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-xl space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mx-auto text-indigo-300">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-light italic font-serif text-white">
                Connect Google Classroom
              </h3>
              <p className="text-xs sm:text-sm text-white/60 max-w-md mx-auto leading-relaxed">
                Connect your Google account to automatically load coursework from Google Classroom directly into TechTut Study Mode.
              </p>
              <button
                onClick={currentUser ? handleLoadClassroom : handleSignIn}
                className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold shadow-xl shadow-indigo-500/30 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{currentUser ? 'Fetch Active Classes' : 'Sign in to Link Classroom'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GOOGLE KEEP & NOTES */}
      {activeTab === 'keep' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-400" />
                Hold Notes & Google Keep Sync
              </h3>
              <p className="text-xs text-white/60">
                Capture study insights, formulas, and reflections. Auto-synced to your cloud account and ready for Google Keep.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenGoogleKeep}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold transition-all cursor-pointer"
                title="Launch Google Keep in a new tab"
              >
                <span>Open Google Keep</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsAddingNote(!isAddingNote)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Study Note</span>
              </button>
            </div>
          </div>

          {/* New Note Creator Form */}
          {isAddingNote && (
            <form onSubmit={handleCreateNote} className="p-6 rounded-[28px] bg-white/5 border border-white/15 backdrop-blur-2xl space-y-4 shadow-2xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Hold New Celestial Note</h4>
                <div className="flex items-center gap-2">
                  {Object.entries(NOTE_COLORS).map(([colKey, colVal]) => (
                    <button
                      key={colKey}
                      type="button"
                      onClick={() => setNewNoteColor(colKey)}
                      className={`w-4 h-4 rounded-full ${colVal.dot} transition-transform ${newNoteColor === colKey ? 'scale-125 ring-2 ring-white' : 'opacity-60 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>

              <input
                type="text"
                placeholder="Note Title (e.g. Organic Chemistry Reagents, Physics Constants)..."
                value={newNoteTitle}
                onChange={e => setNewNoteTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-indigo-400"
                required
              />

              <textarea
                placeholder="Write your study note, derivations, mnemonic rules, or questions to revisit..."
                value={newNoteContent}
                onChange={e => setNewNoteContent(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-indigo-400"
                required
              />

              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="Topic / Tag (e.g. Calculus, Biology)"
                  value={newNoteTopic}
                  onChange={e => setNewNoteTopic(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs w-48 placeholder:text-white/40 focus:outline-none focus:border-indigo-400"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNote(false)}
                    className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Notes Masonry / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map(note => {
              const colStyle = NOTE_COLORS[note.color || 'violet'] || NOTE_COLORS.violet;
              return (
                <div 
                  key={note.id}
                  className={`p-5 rounded-[26px] ${colStyle.bg} border ${colStyle.border} backdrop-blur-xl flex flex-col justify-between space-y-4 shadow-xl relative group transition-all hover:scale-[1.01]`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-white leading-snug">
                        {note.title}
                      </h4>
                      <button
                        onClick={() => handleTogglePin(note.id)}
                        className={`p-1 rounded-lg transition-colors ${note.isPinned ? 'text-amber-300' : 'text-white/30 hover:text-white/70'}`}
                        title={note.isPinned ? 'Pinned Note' : 'Pin Note'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-white/80 leading-relaxed whitespace-pre-line font-serif">
                      {note.content}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70 font-medium">
                      {note.topic || 'General'}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Copy Formatted for Google Keep */}
                      <button
                        onClick={() => handleCopyToKeep(note)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition-colors flex items-center gap-1 text-[10px]"
                        title="Copy formatted note ready for Google Keep"
                      >
                        {copiedNoteId === note.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-300">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy for Keep</span>
                          </>
                        )}
                      </button>

                      {/* Study in TechTut */}
                      <button
                        onClick={() => onImportToStudy(`Study Note: ${note.title}\n${note.content}`, note.topic)}
                        className="p-1.5 rounded-lg bg-indigo-500/30 hover:bg-indigo-500 text-indigo-200 hover:text-white transition-colors"
                        title="Analyze and generate questions from this note in Study Mode"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-white/40 hover:text-rose-300 transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Google Keep Workspace Note & Enterprise Transparency */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-start gap-3 text-xs text-white/60">
            <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-white/80 font-medium">Google Keep Workspace Synchronization</p>
              <p>
                All your study notes are safely held and synced in real-time to your TechTut cloud account. Use the <strong>"Copy for Keep"</strong> button or click <strong>"Open Google Keep"</strong> to mirror your grimoire directly into Keep on any mobile or desktop device.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GOOGLE DRIVE SEARCH */}
      {activeTab === 'drive' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FolderSearch className="w-4 h-4 text-sky-400" />
                Search Study Material in Google Drive
              </h3>
              <p className="text-xs text-white/60">
                Instantly search through your class notes, lecture slides, study PDFs, and assignments in Google Drive.
              </p>
            </div>

            {/* Search Input Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search file name (e.g. 'Calculus', 'Midterm', 'Biology Notes', 'Chapter 4')..."
                  value={driveSearchQuery}
                  onChange={e => setDriveSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearchDrive()}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-black/40 border border-white/15 text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-indigo-400 transition-colors"
                />
              </div>

              <button
                id="btn-search-drive"
                onClick={currentUser ? handleSearchDrive : handleSignIn}
                disabled={isLoadingDrive}
                className="px-6 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Search className={`w-4 h-4 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                <span>{isLoadingDrive ? 'Searching...' : currentUser ? 'Search Drive' : 'Sign in to Search'}</span>
              </button>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-white/40 text-[11px] mr-1">Filter:</span>
              {[
                { id: 'all', label: 'All Materials' },
                { id: 'pdf', label: 'PDF Documents' },
                { id: 'document', label: 'Google Docs' },
                { id: 'presentation', label: 'Slides' },
                { id: 'spreadsheet', label: 'Sheets' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedDriveFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl border transition-colors ${
                    selectedDriveFilter === f.id
                      ? 'bg-white/15 border-white/30 text-white font-medium'
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results Display */}
          {driveFiles.length > 0 ? (
            <div className="space-y-3">
              <div className="text-xs text-white/60 px-1">
                Showing {driveFiles.filter(f => selectedDriveFilter === 'all' || f.mimeType.includes(selectedDriveFilter)).length} study files
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {driveFiles
                  .filter(f => selectedDriveFilter === 'all' || f.mimeType.includes(selectedDriveFilter))
                  .map(file => {
                    const badge = getMimeTypeBadge(file.mimeType);
                    const IconComponent = badge.icon;
                    return (
                      <div 
                        key={file.id}
                        className="p-4 sm:p-5 rounded-[24px] bg-white/5 border border-white/10 hover:border-indigo-400/30 backdrop-blur-xl transition-all shadow-xl flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${badge.color}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-white truncate group-hover:text-indigo-200 transition-colors">
                              {file.name}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-white/50 mt-0.5">
                              <span className="uppercase">{badge.label}</span>
                              {file.modifiedTime && (
                                <span>• Modified {new Date(file.modifiedTime).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                              title="Open in Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            onClick={() => onImportToStudy(`Study Guide for Drive File: "${file.name}"\nExplain the core concepts and create flashcards based on this topic.`)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white border border-indigo-400/30 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Import this material into TechTut Study Mode"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span className="hidden sm:inline">Study This</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 px-4 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-xl space-y-3">
              <FolderSearch className="w-10 h-10 text-white/30 mx-auto" />
              <h4 className="text-sm font-semibold text-white">
                {currentUser ? 'Search Your Study Material' : 'Sign in to Search Google Drive'}
              </h4>
              <p className="text-xs text-white/60 max-w-md mx-auto">
                Type in keywords from your lecture slides, notes, or problem sets stored in Google Drive to link them directly with TechTut.
              </p>
              {!currentUser && (
                <button
                  onClick={handleSignIn}
                  className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold shadow-lg transition-all"
                >
                  Sign in with Google
                </button>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
