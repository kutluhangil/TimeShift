/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from "react";

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-3 z-50 text-neutral-300 text-xs sm:text-sm border-t border-white/10">
      <div className="max-w-screen-xl mx-auto flex justify-between items-center gap-4 px-4">
        <div className="hidden md:flex items-center gap-4 text-neutral-500 whitespace-nowrap text-xs">
          <p>Powered by Gemini 2.5 Flash</p>
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-300 transition-colors hidden lg:block"
          >
            Privacy Policy
          </a>
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-300 transition-colors hidden lg:block"
          >
            Terms of Service
          </a>
        </div>

        {/* Right Side */}
        <div className="flex-grow flex justify-end items-center gap-6">
          <div className="text-neutral-400 text-sm">
            <span>Designed by </span>
            <span className="font-medium text-neutral-200">kutluhangil</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/kutluhangil"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-white transition-colors duration-300 hover:scale-110"
              title="GitHub"
              aria-label="GitHub"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M12 .5C5.73.5.5 5.73.5 12.07c0 5.07 3.29 9.37 7.86 10.89.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.37-3.88-1.37-.52-1.35-1.28-1.71-1.28-1.71-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.21 1.77 1.21 1.03 1.76 2.71 1.25 3.37.96.1-.75.4-1.25.72-1.54-2.56-.3-5.25-1.28-5.25-5.69 0-1.26.45-2.28 1.2-3.09-.12-.3-.52-1.52.11-3.16 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 5.83 0c2.22-1.49 3.2-1.18 3.2-1.18.63 1.64.23 2.86.11 3.16.75.81 1.2 1.83 1.2 3.09 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.08.78 2.18 0 1.57-.01 2.84-.01 3.22 0 .31.21.68.8.56A11.6 11.6 0 0 0 23.5 12.07C23.5 5.73 18.27.5 12 .5Z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/kutluhangil/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-white transition-colors duration-300 hover:scale-110"
              title="LinkedIn"
              aria-label="LinkedIn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5ZM.2 8.98h4.6V24H.2V8.98Zm7.6 0h4.4v2.05h.06c.61-1.15 2.1-2.37 4.32-2.37 4.62 0 5.47 3.04 5.47 6.99V24h-4.6v-7.64c0-1.82-.03-4.16-2.53-4.16-2.54 0-2.93 1.98-2.93 4.03V24H7.8V8.98Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
