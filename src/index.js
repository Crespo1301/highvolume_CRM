// Main export
export { default } from './ColdCallCRM';

// Context
export { CRMProvider, useCRM } from './context/CRMContext';

// Components
export { Header } from './components/Header';
export { Navigation } from './components/Navigation';
export { Footer } from './components/Footer';
export { AllModals } from './components/Modals';
export { Dashboard, Analytics, ListView, GolfCoursesView, AddLeadForm, AddEmailForm } from './components/Views';

// Hooks
export { useKeyboard } from './hooks/useKeyboard';

// Utils
export { colors, buttonBase, inputBase, GlobalStyles } from './utils/theme.jsx';
export * from './utils/helpers';
