import { useNavigate } from 'react-router-dom';
import { OnboardingWizard } from '../components/OnboardingWizard';
import { settingsApi } from '../services/api';

export function OnboardingWizardPage() {
  const navigate = useNavigate();

  const handleComplete = async () => {
    try {
      await settingsApi.completeOnboarding();
    } catch (e) {
      // Continue even if API call fails
      console.error('Failed to save onboarding status:', e);
    }
    navigate('/dashboard');
  };

  const handleSkip = async () => {
    try {
      await settingsApi.completeOnboarding();
    } catch (e) {
      console.error('Failed to save onboarding status:', e);
    }
    navigate('/dashboard');
  };

  return <OnboardingWizard onComplete={handleComplete} onSkip={handleSkip} />;
}

export default OnboardingWizardPage;
