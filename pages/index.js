import Head from 'next/head';
import AuthView from '../components/AuthView';
import ProfileSetup from '../components/ProfileSetup';
import Topbar from '../components/Topbar';
import ProfilePanel from '../components/ProfilePanel';
import MatchesPanel from '../components/MatchesPanel';
import DatePanel from '../components/DatePanel';
import AgeGateModal from '../components/AgeGateModal';
import ReportModal from '../components/ReportModal';
import { useDatingApp } from '../hooks/useDatingApp';

export default function Home() {
  const app = useDatingApp();

  const modals = (
    <>
      <ReportModal
        reportTarget={app.reportTarget}
        reportReason={app.reportReason}
        reportReasons={app.constants.reportReasons}
        reportNotes={app.reportNotes}
        onChangeReason={app.actions.setReportReason}
        onChangeNotes={app.actions.setReportNotes}
        onCancel={() => app.actions.setReportTarget(null)}
        onReport={() => app.actions.submitReport(false)}
        onReportBlock={() => app.actions.submitReport(true)}
      />
      <AgeGateModal
        open={app.ageGateOpen}
        checked={app.ageGateChecked}
        error={app.ageGateError}
        onToggle={app.actions.handleAgeGateToggle}
        onConfirm={app.actions.handleAgeGateConfirm}
      />
    </>
  );

  if (app.mode === 'checking') {
    return (
      <div className="page">
        <Head>
          <title>Date a Bot or Not</title>
        </Head>
        <div className="loading-state">Booting the lab…</div>
        {modals}
      </div>
    );
  }

  if (app.mode === 'auth') {
    return (
      <div className="page">
        <Head>
          <title>Date a Bot or Not</title>
        </Head>
        <AuthView
          authForm={app.authForm}
          authError={app.authError}
          authMessage={app.authMessage}
          onChange={app.actions.handleAuthChange}
          onSignIn={app.actions.handleSignIn}
          onSignUp={app.actions.handleSignUp}
          onDemo={app.actions.enterDemoMode}
          isSupabaseConfigured={app.flags.isSupabaseConfigured}
        />
        {modals}
      </div>
    );
  }

  if (app.needsProfile) {
    return (
      <div className="page">
        <Head>
          <title>Date a Bot or Not</title>
        </Head>
        <ProfileSetup
          profileDraft={app.profileDraft}
          onChange={app.actions.handleProfileDraft}
          onSave={app.actions.handleProfileSave}
          isBusy={app.isBusy}
          authError={app.authError}
        />
        {modals}
      </div>
    );
  }

  return (
    <div className="page">
      <Head>
        <title>Date a Bot or Not</title>
      </Head>

      <Topbar mode={app.mode} onSignOut={app.actions.handleSignOut} />

      <main className="grid">
        <ProfilePanel
          profile={app.profile}
          discover={app.discover}
          discoverRatings={app.discoverRatings}
          trackedDiscoverIds={app.trackedDiscoverIds}
          avatarSourceName={app.avatarSourceName}
          isUsingExternalAvatarSource={app.isUsingExternalAvatarSource}
          avatarProvider={app.avatarProvider}
          geminiApiKey={app.geminiApiKey}
          openaiApiKey={app.openaiApiKey}
          avatarPrompt={app.avatarPrompt}
          avatarInterview={app.avatarInterview}
          avatarError={app.avatarError}
          avatarStatus={app.avatarStatus}
          isAvatarBusy={app.isAvatarBusy}
          onFlirt={app.actions.handleFlirt}
          onPass={app.actions.handlePass}
          onBlock={app.actions.handleBlock}
          onRateDiscover={app.actions.rateDiscoverEntry}
          onToggleTrackDiscover={app.actions.toggleTrackDiscover}
          onUseProfileDataForAvatar={app.actions.handleUseProfileDataForAvatar}
          onAvatarProviderChange={app.actions.handleAvatarProviderChange}
          onGeminiApiKeyChange={app.actions.handleGeminiApiKeyChange}
          onOpenAIApiKeyChange={app.actions.handleOpenAIApiKeyChange}
          onSaveGeminiApiKey={app.actions.saveGeminiApiKey}
          onSaveOpenAIApiKey={app.actions.saveOpenAIApiKey}
          onAvatarPromptChange={app.actions.handleAvatarPromptChange}
          onAvatarInterviewChange={app.actions.handleAvatarInterviewChange}
          onBuildAvatarPrompt={app.actions.handleBuildAvatarPromptFromInterview}
          onGenerateAvatarFromInterview={app.actions.handleGenerateAvatarFromInterview}
          onGenerateAvatar={app.actions.handleGenerateProfileAvatar}
        />
        <MatchesPanel
          matches={app.matches}
          selectedMatchId={app.selectedMatchId}
          onSelectMatch={app.actions.handleSelectMatch}
          currentSpark={app.currentSpark}
          sparkAuthor={app.sparkAuthor}
          sparkInput={app.sparkInput}
          onSparkInputChange={app.actions.setSparkInput}
          onNextSpark={app.actions.handleNextSpark}
          onFindResponders={app.actions.handleSparkFind}
          sparkResults={app.sparkResults}
          sparkError={app.sparkError}
          onStartChat={app.actions.handleSparkStart}
          responderFilter={app.responderFilter}
          onFilterChange={app.actions.setResponderFilter}
          selectedPartner={app.selectedPartner}
          onReport={app.actions.openReport}
          onBlock={app.actions.handleBlock}
          messages={app.messages}
          profileId={app.profile?.id}
          chatInput={app.chatInput}
          onChatInputChange={app.actions.setChatInput}
          onSendMessage={app.actions.handleSendMessage}
          currentFlowStage={app.currentFlowStage}
          currentFlowStageIndex={app.currentFlowStageIndex}
          flowTotal={app.constants.flowStages.length}
          onSuggestedReply={app.actions.handleSuggestedReply}
        />
        <DatePanel
          selectedMatch={app.selectedMatch}
          selectedPartner={app.selectedPartner}
          selectedStatus={app.selectedStatus}
          onToggleReady={app.actions.toggleReady}
          onStartDate={app.actions.startDate}
          isDateActive={app.helpers.isDateActive}
          durationMs={app.constants.dateDurationMs}
        />
      </main>
      {modals}
    </div>
  );
}
