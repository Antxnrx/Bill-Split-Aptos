import React from "react";
import { useAppState } from "../../hooks/useAppState";
import { Navigation } from "../../components/Navigation";
import { CreateSession } from "../CreateSession";
import { ParticipantsScreen } from "../ParticipantsScreen";
import { PaymentsScreen } from "../PaymentsScreen";
import { HistoryScreen } from "../HistoryScreen";

export const StitchDesign = (): React.ReactElement => {
  const {
    currentScreen,
    currentSession,
    sessions,
    createSession,
    addParticipant,
    addPayment,
    navigateToScreen,
    resetSession,
  } = useAppState();

  const getScreenTitle = () => {
    switch (currentScreen) {
      case "create":
        return "Create Session";
      case "participants":
        return "Add Participants";
      case "payments":
        return "Manage Payments";
      case "history":
        return "Session History";
      default:
        return "Create Session";
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "create":
        return <CreateSession onCreateSession={createSession} />;
      case "participants":
        return currentSession ? (
          <ParticipantsScreen
            session={currentSession}
            onAddParticipant={addParticipant}
            onNavigateToPayments={() => navigateToScreen("payments")}
          />
        ) : null;
      case "payments":
        return currentSession ? (
          <PaymentsScreen session={currentSession} onAddPayment={addPayment} />
        ) : null;
      case "history":
        return (
          <HistoryScreen sessions={sessions} onResetSession={resetSession} />
        );
      default:
        return <CreateSession onCreateSession={createSession} />;
    }
  };

  return (
    <div className="flex flex-col items-start relative bg-white min-h-screen">
      <div className="flex flex-col min-h-screen items-start justify-between relative self-stretch w-full flex-[0_0_auto] bg-[#112116]">
        <div className="flex flex-col items-start relative self-stretch w-full flex-1">
          <header className="flex items-center justify-between pt-4 pb-2 px-4 sm:px-6 flex-[0_0_auto] bg-[#112116] relative self-stretch w-full">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#38e07a] rounded-full flex items-center justify-center">
              <span className="text-[#112116] text-lg">💰</span>
            </div>

            <div className="items-center pl-0 pr-8 sm:pr-12 py-0 flex flex-col relative flex-1 grow">
              <h1 className="relative self-stretch mt-[-1.00px] [font-family:'Spline_Sans',Helvetica] font-bold text-white text-base sm:text-lg text-center tracking-[0] leading-[20px] sm:leading-[23px]">
                {getScreenTitle()}
              </h1>
            </div>
          </header>

          {renderScreen()}
        </div>

        <Navigation
          currentScreen={currentScreen}
          onNavigate={navigateToScreen}
          hasActiveSession={currentSession !== null}
        />
      </div>
    </div>
  );
};
