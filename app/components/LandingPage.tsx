"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import Stepper, { Step } from "./Stepper";

interface LandingPageProps {
  onOpenLogin?: () => void;
  onOpenSignup?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = () => {
  const [name, setName] = useState("");

  const handleFinalStep = () => {
    console.log("All steps completed!");
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F5] p-4 sm:p-6">
      <div className="w-full max-w-[640px] flex flex-col items-center">
        <Stepper
          initialStep={1}
          onStepChange={step => console.log(step)}
          onFinalStepCompleted={handleFinalStep}
          backButtonText="Back"
          nextButtonText="Continue"
          orientation="vertical"
          width={640}
          completeButtonText="Place order"
          theme="light"
          accentColor="#10B981"
          radius={24}
          className="border border-[#E2ECE5] shadow-xl bg-white/95"
        >
          <Step title="Welcome">
            <div className="space-y-2 py-1">
              <h3 className="text-xl font-bold text-[#2D3748]">Welcome aboard</h3>
              <p className="text-sm text-[#718096]">
                Set up your workspace in a few quick steps.
              </p>
            </div>
          </Step>

          <Step title="Plan">
            <div className="space-y-2 py-1">
              <h3 className="text-xl font-bold text-[#2D3748]">Choose a plan</h3>
              <p className="text-sm text-[#718096]">
                You can change this at any time.
              </p>
            </div>
          </Step>

          <Step title="Profile">
            <div className="space-y-3 py-1">
              <h3 className="text-xl font-bold text-[#2D3748]">What should we call you?</h3>
              <input
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E2ECE5] bg-white text-sm text-[#2D3748] focus:outline-none focus:border-[#10B981] transition-colors"
              />
            </div>
          </Step>

          <Step title="Review">
            <div className="space-y-2 py-1">
              <h3 className="text-xl font-bold text-[#2D3748]">Looking good</h3>
              <p className="text-sm text-[#718096]">
                Complete setup to open your workspace.
              </p>
            </div>
          </Step>
        </Stepper>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="text-xs text-[#718096] hover:text-[#10B981] transition-colors font-medium cursor-pointer"
          >
            Already have an account? <span className="underline">Sign in with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};
